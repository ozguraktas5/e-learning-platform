import os # Python'un işletim sistemi ile iletişim kurmak için kullanılır.
from dotenv import load_dotenv # .env dosyasındaki değişkenleri yüklemek için kullanılır.
from datetime import UTC # Zaman dilimi için kullanılır.

load_dotenv() # .env dosyasındaki değişkenleri yüklemek için kullanılır.

# Google Cloud Storage ayarları
GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT')
GOOGLE_CLOUD_BUCKET = os.getenv('GOOGLE_CLOUD_BUCKET')
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

# Dosya yükleme ayarları
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mkv'}
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'}

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instance/elearning.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False},
        'timezone': UTC
    }
    
class DevelopmentConfig(Config): # DevelopmentConfig sınıfını oluşturuyoruz ve Config sınıfını miras alıyoruz.
    DEBUG = True # DEBUG değişkenini True yapıyoruz.
    
class ProductionConfig(Config): # ProductionConfig sınıfını oluşturuyoruz ve Config sınıfını miras alıyoruz.    
    DEBUG = False # DEBUG değişkenini False yapıyoruz.
    
class TestingConfig(Config): # TestingConfig sınıfını oluşturuyoruz ve Config sınıfını miras alıyoruz.  
    TESTING = True # TESTING değişkenini True yapıyoruz.
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db' # SQLALCHEMY_DATABASE_URI değişkenini oluşturuyoruz ve test.db dosyasını yüklüyoruz.

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 