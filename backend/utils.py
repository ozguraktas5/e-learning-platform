from werkzeug.utils import secure_filename # Dosya adını güvenli hale getir 
import os # Dosya yollarını oluşturmak için kullanılır.
from google.cloud import storage # Google Cloud Storage'a bağlanmak için kullanılır.
from config import GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_BUCKET, GOOGLE_APPLICATION_CREDENTIALS # Google Cloud projesini, bucket'ı ve kimlik bilgilerini yükle
from config import ALLOWED_VIDEO_EXTENSIONS, ALLOWED_FILE_EXTENSIONS # İzin verilen video ve dosya uzantılarını yükle
from datetime import datetime, timedelta # Zaman dilimi için kullanılır.
import uuid
from flask import current_app, request, jsonify # Flask'ın current_app, request ve jsonify fonksiyonlarını import ediyoruz.
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

def get_storage_client():
    """Google Cloud Storage istemcisi oluştur"""
    credentials_path = os.path.join(os.path.dirname(__file__), GOOGLE_APPLICATION_CREDENTIALS)
    return storage.Client.from_service_account_json(credentials_path)

def upload_file_to_gcs(file, folder=None): # Dosyayı yükle
    """Dosyayı yükle"""
    base_upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads') # Dosya yolu oluştur
    target_folder = base_upload_folder # Dosya yolu oluştur
    if folder: # Eğer folder varsa
        target_folder = os.path.join(base_upload_folder, folder) # Dosya yolu oluştur
    
    if not os.path.exists(target_folder): # Eğer dosya yolu yoksa
        os.makedirs(target_folder) # Dosya yolu oluştur
    
    filename = secure_filename(file.filename) # Dosya adını güvenli hale getir
    unique_filename = f"{uuid.uuid4().hex}_{filename}" # Dosya adını güvenli hale getir
    local_file_path = os.path.join(target_folder, unique_filename) # Dosya yolu oluştur
    
    try:
        file.save(local_file_path) # Dosyayı yükle
    except Exception as e:
        current_app.logger.error(f"Error saving file {local_file_path}: {e}") # Hata mesajı
        return None # Hata mesajı
    
    relative_path = os.path.join(folder, unique_filename) if folder else unique_filename # Dosya yolu oluştur
    url_path = relative_path.replace('\\', '/') # Dosya yolu oluştur
    full_url = f"/uploads/{url_path}" # Dosya yolu oluştur
    
    current_app.logger.info(f"File uploaded locally to: {local_file_path}, URL: {full_url}") # Dosya yolu oluştur
    return full_url # Dosya yolu oluştur

def upload_video_to_gcs(video_file): # Video dosyasını yükle
    """Video dosyasını yükle"""
    if not allowed_video_file(video_file.filename):
        return None # Hata mesajı

    video_url = upload_file_to_gcs(video_file, folder='videos') # Video dosyasını yükle ve dosya yolu oluştur
    
    return video_url # Video dosyasını yükle ve dosya yolu oluştur

def upload_document_to_gcs(file): # Dosya dosyasını yükle
    """Dosya dosyasını yükle"""
    if not allowed_file(file.filename): # Dosya dosyasının uzantısı geçerli değilse
        return None # Hata mesajı
    doc_url = upload_file_to_gcs(file, folder='documents') # Dosya dosyasını yükle ve dosya yolu oluştur
    return doc_url # Dosya dosyasını yükle ve dosya yolu oluştur