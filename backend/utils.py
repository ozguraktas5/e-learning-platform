from werkzeug.utils import secure_filename # Dosya adını güvenli hale getir 
import os # Dosya yollarını oluşturmak için kullanılır.
from config import ALLOWED_VIDEO_EXTENSIONS, ALLOWED_FILE_EXTENSIONS # İzin verilen video ve dosya uzantılarını yükle
from datetime import datetime, timedelta # Zaman dilimi için kullanılır.
import uuid
from flask import current_app, request, jsonify, url_for # Flask'ın current_app, request ve jsonify fonksiyonlarını import ediyoruz.
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt

# Giriş yapılmış kullanıcılar için kullanılır.
def login_required(f): 
    @wraps(f) # Fonksiyonun adını ve parametrelerini saklar.
    def decorated(*args, **kwargs): # Fonksiyonun adını ve parametrelerini saklar.
        try: # Hata yakalamak için kullanılır.
            verify_jwt_in_request() # JWT token'ının içindeki bilgileri almak için kullanılır.
            user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
            request.user_id = int(user_id)  # String'i integer'a çevir
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"msg": "Authentication required"}), 401 # Yetkisiz erişim
    return decorated # Fonksiyonun adını ve parametrelerini saklar.

def instructor_required(f): # Eğitmen için kullanılır.
    @wraps(f) # Fonksiyonun adını ve parametrelerini saklar.
    def decorated(*args, **kwargs): # Fonksiyonun adını ve parametrelerini saklar.
        try: # Hata yakalamak için kullanılır.
            verify_jwt_in_request() # JWT token'ının içindeki bilgileri almak için kullanılır.
            claims = get_jwt()
            if claims.get('role') != 'instructor':
                return jsonify({"msg": "Instructor privileges required"}), 403
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"msg": "Authentication required"}), 401
    return decorated
 
def allowed_video_file(filename):
    """Video dosya uzantısının geçerli olup olmadığını kontrol et"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

def allowed_file(filename): 
    """Dosya uzantısının geçerli olup olmadığını kontrol et"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_FILE_EXTENSIONS

# ========== LOCAL UPLOADS (Production Ready) ==========

def upload_file_local(file, folder=None):
    """Dosyayı local uploads klasörüne yükle"""
    try:
        # Uploads klasörü yolunu al
        uploads_path = os.path.join(os.path.dirname(__file__), 'uploads')
        
        # Folder varsa alt klasör oluştur
        if folder:
            folder_path = os.path.join(uploads_path, folder)
            os.makedirs(folder_path, exist_ok=True)
            save_path = folder_path
        else:
            os.makedirs(uploads_path, exist_ok=True)
            save_path = uploads_path
        
        # Güvenli dosya adı oluştur
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Dosya yolu
        file_path = os.path.join(save_path, unique_filename)
        
        # Dosyayı kaydet
        file.save(file_path)
        
        # URL oluştur (production'da domain ile değişecek)
        if folder:
            file_url = f"/uploads/{folder}/{unique_filename}"
        else:
            file_url = f"/uploads/{unique_filename}"
        
        current_app.logger.info(f"File uploaded locally: {file_path}, URL: {file_url}")
        return file_url
        
    except Exception as e:
        current_app.logger.error(f"Error uploading file locally: {str(e)}")
        return None

def upload_video_local(video_file):
    """Video dosyasını local uploads'a yükle"""
    if not allowed_video_file(video_file.filename):
        return None
    
    return upload_file_local(video_file, folder='videos')

def upload_document_local(file):
    """Döküman dosyasını local uploads'a yükle"""
    if not allowed_file(file.filename):
        return None
    
    return upload_file_local(file, folder='documents')

def upload_image_local(image_file):
    """Resim dosyasını local uploads'a yükle"""
    # Resim uzantıları
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    
    if not ('.' in image_file.filename and 
            image_file.filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS):
        return None
    
    return upload_file_local(image_file, folder='images')

# ========== MAIN UPLOAD FUNCTIONS ==========

# Ana upload fonksiyonları artık local'i kullanıyor
def upload_file(file, folder=None):
    """Ana dosya upload fonksiyonu - local uploads kullanır"""
    return upload_file_local(file, folder)

def upload_video(video_file):
    """Ana video upload fonksiyonu"""
    return upload_video_local(video_file)

def upload_document(file):
    """Ana döküman upload fonksiyonu"""
    return upload_document_local(file)

def upload_image(image_file):
    """Ana resim upload fonksiyonu"""
    return upload_image_local(image_file)