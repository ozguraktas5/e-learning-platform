from werkzeug.utils import secure_filename # Dosya adını güvenli hale getir 
import os # Dosya yollarını oluşturmak için kullanılır.
from google.cloud import storage # Google Cloud Storage'a bağlanmak için kullanılır.
from config import GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_BUCKET, GOOGLE_APPLICATION_CREDENTIALS # Google Cloud projesini, bucket'ı ve kimlik bilgilerini yükle
from config import ALLOWED_VIDEO_EXTENSIONS, ALLOWED_FILE_EXTENSIONS # İzin verilen video ve dosya uzantılarını yükle
from datetime import datetime, timedelta # Zaman dilimi için kullanılır.
import uuid

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
    Dosyayı yerel uploads klasörüne (veya belirtilen alt klasöre) kaydet
    Not: Gerçek bir uygulamada bu fonksiyon Google Cloud Storage'a yükleme yapacaktır
    """
    # Base uploads folder
    base_upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
    # Determine the target folder
    target_folder = base_upload_folder
    if folder:
        target_folder = os.path.join(base_upload_folder, folder)
    
    # Create the target folder if it doesn't exist
    if not os.path.exists(target_folder):
        os.makedirs(target_folder)
    
    # Güvenli dosya adı oluştur
    filename = secure_filename(file.filename)
    # Benzersiz bir isim oluştur
    unique_filename = f"{uuid.uuid4()}_{filename}"
    # Dosya yolunu oluştur (target_folder kullanarak)
    file_path = os.path.join(target_folder, unique_filename)
    
    # Dosyayı kaydet
    file.save(file_path)
    
    # URL'i döndür (klasör yapısını da içerecek şekilde)
    relative_path = os.path.join(folder, unique_filename) if folder else unique_filename
    # Ensure forward slashes for URL
    url_path = relative_path.replace('\\', '/') 
    return f"http://localhost:5000/uploads/{url_path}"

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