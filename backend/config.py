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
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instance/elearning.db' # SQLALCHEMY_DATABASE_URI'yi alıyoruz.
    SQLALCHEMY_TRACK_MODIFICATIONS = False # SQLALCHEMY_TRACK_MODIFICATIONS'yi alıyoruz.
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key' # JWT_SECRET_KEY'yi alıyoruz.
    
    # PostgreSQL için gerekli ayarlar
    if os.environ.get('DATABASE_URL') and os.environ.get('DATABASE_URL').startswith('postgres://'):
        # Railway PostgreSQL URL'ini güncelle
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL').replace('postgres://', 'postgresql://')
    
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False} if 'sqlite' in (os.environ.get('DATABASE_URL') or 'sqlite') else {}, # connect_args'ı alıyoruz.
        'timezone': UTC # timezone'ı alıyoruz.
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