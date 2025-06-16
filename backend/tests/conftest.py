import pytest
# pytest kütüphanesini içe aktar.

from app import create_app
# Uygulama oluşturma fonksiyonunu içe aktar.

from models import db
# Veritabanı modelini içe aktar.

import os
# İşletim sistemi ile ilgili fonksiyonları içe aktar.

import atexit
# Program sonlandığında belirli işlemleri gerçekleştirmek için atexit modülünü içe aktar.

import time
# Zaman ile ilgili fonksiyonları içe aktar.

def remove_test_db(path):
    max_attempts = 3
    # Maksimum deneme sayısını belirle.
    for attempt in range(max_attempts):
        try:
            if os.path.exists(path):
                os.remove(path)
                # Eğer test veritabanı dosyası varsa, sil.
            break
        except PermissionError:
            if attempt < max_attempts - 1:
                time.sleep(0.5)  # Dosyanın serbest kalmasını bekle
            else:
                print(f"Warning: Could not remove test database at {path}")
                # Test veritabanı silinemediğinde uyarı mesajı yazdır.

@pytest.fixture(scope='function')
def test_app():
    # Test veritabanı dosyasının yolunu belirle
    db_path = "instance/test.db"
    
    # Eğer test veritabanı varsa sil
    remove_test_db(db_path)
    
    app = create_app()
    # Uygulamayı oluştur.
    app.config.update({
        'TESTING': True,
        # Test modunu etkinleştir.
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        # Test veritabanı URI'sini ayarla.
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        # SQLAlchemy'nin değişiklik izleme özelliğini devre dışı bırak.
        'SQLALCHEMY_ENGINE_OPTIONS': {
            'pool_pre_ping': True,
            # Bağlantı havuzunu önceden kontrol et.
            'pool_recycle': 300
            # Bağlantı havuzundaki bağlantıları 300 saniyede bir yenile.
        }
    })
    
    # Uygulama bağlamını oluştur
    with app.app_context():
        # Veritabanını oluştur
        db.create_all()
        yield app
        # Testten sonra uygulamayı döndür.
        db.session.remove()
        # Veritabanı oturumunu temizle.
        db.drop_all()
        # Tüm veritabanı tablolarını sil.
        remove_test_db(db_path)
        # Test veritabanını sil.

    # Program sonlandığında test veritabanını temizle
    atexit.register(lambda: remove_test_db(db_path))

@pytest.fixture(scope='function')
def test_client(test_app):
    return test_app.test_client()
    # Test uygulaması için bir test istemcisi oluştur ve döndür.

@pytest.fixture(scope='function')
def session():
    db.session.begin_nested()
    # Yeni bir iç içe oturum başlat.
    yield db.session
    # Testten sonra oturumu döndür.
    db.session.rollback()
    # Oturumu geri al. 