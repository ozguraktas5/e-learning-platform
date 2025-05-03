from werkzeug.utils import secure_filename # Dosya adını güvenli hale getir 
import os # Dosya yollarını oluşturmak için kullanılır.
from google.cloud import storage # Google Cloud Storage'a bağlanmak için kullanılır.
from config import GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_BUCKET, GOOGLE_APPLICATION_CREDENTIALS # Google Cloud projesini, bucket'ı ve kimlik bilgilerini yükle
from config import ALLOWED_VIDEO_EXTENSIONS, ALLOWED_FILE_EXTENSIONS # İzin verilen video ve dosya uzantılarını yükle
from datetime import datetime, timedelta # Zaman dilimi için kullanılır.
import uuid
from flask import current_app # For logging

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

def upload_file_to_gcs(file, folder=None):
    """
    Uploads a file to the local uploads directory.
    Returns ONLY the relative URL path.
    """
    base_upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    target_folder = base_upload_folder
    if folder:
        target_folder = os.path.join(base_upload_folder, folder)
    
    if not os.path.exists(target_folder):
        os.makedirs(target_folder)
    
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    local_file_path = os.path.join(target_folder, unique_filename)
    
    try:
        file.save(local_file_path)
    except Exception as e:
        current_app.logger.error(f"Error saving file {local_file_path}: {e}")
        return None # Return None if saving fails
    
    relative_path = os.path.join(folder, unique_filename) if folder else unique_filename
    url_path = relative_path.replace('\\', '/')
    # Use /uploads/ prefix
    full_url = f"/uploads/{url_path}" 
    
    current_app.logger.info(f"File uploaded locally to: {local_file_path}, URL: {full_url}")
    return full_url # Return only the URL

def upload_video_to_gcs(video_file):
    """Uploads video file and returns its URL."""
    if not allowed_video_file(video_file.filename):
        return None

    # Call upload_file_to_gcs which now only returns the URL
    video_url = upload_file_to_gcs(video_file, folder='videos')
    
    # No thumbnail generation needed
    return video_url # Return only the video URL

def upload_document_to_gcs(file):
    """Uploads document file and returns its URL."""
    if not allowed_file(file.filename):
        return None
    # Call upload_file_to_gcs which now only returns the URL
    doc_url = upload_file_to_gcs(file, folder='documents') 
    return doc_url # Return only the document URL 