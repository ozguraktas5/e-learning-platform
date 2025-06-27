from werkzeug.utils import secure_filename # Dosya adını güvenli hale getir 
import os # Dosya yollarını oluşturmak için kullanılır.
from google.cloud import storage # Google Cloud Storage'a bağlanmak için kullanılır.
from config import GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_BUCKET, GOOGLE_APPLICATION_CREDENTIALS # Google Cloud projesini, bucket'ı ve kimlik bilgilerini yükle

def validate_gcs_config():
    """Google Cloud Storage konfigürasyonunu kontrol et"""
    if not GOOGLE_CLOUD_PROJECT:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is required")
    if not GOOGLE_CLOUD_BUCKET:
        raise ValueError("GOOGLE_CLOUD_BUCKET environment variable is required")
    return True
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
    try:
        if GOOGLE_APPLICATION_CREDENTIALS:
            # Service account key file kullan
            credentials_path = os.path.join(os.path.dirname(__file__), GOOGLE_APPLICATION_CREDENTIALS)
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"Credentials file not found: {credentials_path}")
            return storage.Client.from_service_account_json(credentials_path, project=GOOGLE_CLOUD_PROJECT)
        else:
            # Default credentials kullan (Google Cloud'da çalışırken)
            return storage.Client(project=GOOGLE_CLOUD_PROJECT)
    except Exception as e:
        current_app.logger.error(f"Error creating GCS client: {str(e)}")
        raise

def upload_file_to_gcs(file, folder=None):
    """Dosyayı Google Cloud Storage'a yükle"""
    try:
        # Konfigürasyonu kontrol et
        validate_gcs_config()
        
        # Google Cloud Storage istemcisini al
        client = get_storage_client()
        bucket = client.bucket(GOOGLE_CLOUD_BUCKET)
        
        # Güvenli dosya adı oluştur
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Folder path oluştur
        blob_name = f"{folder}/{unique_filename}" if folder else unique_filename
        
        # Blob oluştur ve dosyayı yükle
        blob = bucket.blob(blob_name)
        
        # Dosya tipini belirle
        content_type = None
        if filename.lower().endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif filename.lower().endswith('.png'):
            content_type = 'image/png'
        elif filename.lower().endswith('.gif'):
            content_type = 'image/gif'
        elif filename.lower().endswith('.mp4'):
            content_type = 'video/mp4'
        elif filename.lower().endswith('.pdf'):
            content_type = 'application/pdf'
        
        # Dosyayı yükle
        file.seek(0)  # Dosya pointer'ını başa al
        blob.upload_from_file(file, content_type=content_type)
        
        # Public URL oluştur
        blob.make_public()
        public_url = blob.public_url
        
        current_app.logger.info(f"File uploaded to GCS: {blob_name}, URL: {public_url}")
        return public_url
        
    except Exception as e:
        current_app.logger.error(f"Error uploading file to GCS: {str(e)}")
        return None

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