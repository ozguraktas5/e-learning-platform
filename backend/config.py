import os # Python'un işletim sistemi ile iletişim kurmak için kullanılır.
from dotenv import load_dotenv # .env dosyasındaki değişkenleri yüklemek için kullanılır.
from datetime import UTC # Zaman dilimi için kullanılır.

load_dotenv() # .env dosyasındaki değişkenleri yüklemek için kullanılır.

# Local uploads ayarları (Google Cloud kaldırıldı)
UPLOAD_FOLDER = 'uploads'  # Local uploads klasörü

# Dosya yükleme ayarları
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mkv'} # Video dosya uzantılarını alıyoruz.
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'} # Dosya uzantılarını alıyoruz.

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev' # SECRET_KEY'yi alıyoruz.
    
    # Database URL'i al ve PostgreSQL formatını düzelt
    database_url = os.environ.get('DATABASE_URL') or 'sqlite:///instance/elearning.db'
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://')
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False # SQLALCHEMY_TRACK_MODIFICATIONS'yi alıyoruz.
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key' # JWT_SECRET_KEY'yi alıyoruz.
    
    # Engine options
    is_sqlite = 'sqlite' in database_url
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False} if is_sqlite else {}
    }
    
class DevelopmentConfig(Config): # DevelopmentConfig sınıfını oluşturuyoruz ve Config sınıfını miras alıyoruz.
    DEBUG = True # DEBUG değişkenini True yapıyoruz.
    
class ProductionConfig(Config): # ProductionConfig sınıfını oluşturuyoruz ve Config sınıfını miras alıyoruz.    
    DEBUG = False # DEBUG değişkenini False yapıyoruz.
    
class TestingConfig(Config): # TestingConfig sınıfını oluşturuyoruz ve Config sınıfını miras alıyoruz.  
    TESTING = True # TESTING değişkenini True yapıyoruz.
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db' # SQLALCHEMY_DATABASE_URI değişkenini oluşturuyoruz ve test.db dosyasını yüklüyoruz.

config = {
    'development': DevelopmentConfig, # DevelopmentConfig'ı alıyoruz.
    'production': ProductionConfig, # ProductionConfig'ı alıyoruz.
    'testing': TestingConfig, # TestingConfig'ı alıyoruz.
    'default': DevelopmentConfig # DevelopmentConfig'ı alıyoruz.
} 