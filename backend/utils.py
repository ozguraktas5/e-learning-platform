from werkzeug.utils import secure_filename
import os
from google.cloud import storage
from config import GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_BUCKET, GOOGLE_APPLICATION_CREDENTIALS
from config import ALLOWED_VIDEO_EXTENSIONS, ALLOWED_FILE_EXTENSIONS
from datetime import datetime, timedelta

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

def upload_file_to_gcs(file, folder='general'):
    """Dosyayı Google Cloud Storage'a yükle"""
    if file.filename == '':
        return None
        
    try:
        # Güvenli dosya adı oluştur
        filename = secure_filename(file.filename)
        
        # Dosya yolu oluştur (folder/filename)
        file_path = f"{folder}/{filename}"
        
        # Storage istemcisi oluştur
        storage_client = get_storage_client()
        bucket = storage_client.bucket(GOOGLE_CLOUD_BUCKET)
        
        # Yeni bir blob oluştur
        blob = bucket.blob(file_path)
        
        # Dosyayı yükle
        blob.upload_from_file(
            file,
            content_type=file.content_type
        )
        
        # Geçici URL oluştur (24 saat geçerli)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=24),
            method="GET"
        )
        return url
        
    except Exception as e:
        print(f"Google Cloud Storage yükleme hatası: {e}")
        return None

def upload_video_to_gcs(video_file):
    """Video dosyasını Google Cloud Storage'a yükle"""
    if not allowed_video_file(video_file.filename):
        return None
    return upload_file_to_gcs(video_file, folder='videos')

def upload_document_to_gcs(file):
    """Döküman dosyasını Google Cloud Storage'a yükle"""
    if not allowed_file(file.filename):
        return None
    return upload_file_to_gcs(file, folder='documents') 