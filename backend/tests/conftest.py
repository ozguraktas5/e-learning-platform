import pytest
from app import create_app
from models import db
import os
import atexit
import time

def remove_test_db(path):
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            if os.path.exists(path):
                os.remove(path)
            break
        except PermissionError:
            if attempt < max_attempts - 1:
                time.sleep(0.5)  # Dosyanın serbest kalmasını bekle
            else:
                print(f"Warning: Could not remove test database at {path}")

@pytest.fixture(scope='function')
def test_app():
    # Test veritabanı dosyasının yolunu belirle
    db_path = "instance/test.db"
    
    # Eğer test veritabanı varsa sil
    remove_test_db(db_path)
    
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SQLALCHEMY_ENGINE_OPTIONS': {
            'pool_pre_ping': True,
            'pool_recycle': 300
        }
    })
    
    # Uygulama bağlamını oluştur
    with app.app_context():
        # Veritabanını oluştur
        db.create_all()
        yield app
        # Temizlik yap
        db.session.remove()
        db.drop_all()
        # Test veritabanını sil
        remove_test_db(db_path)

    # Program sonlandığında test veritabanını temizle
    atexit.register(lambda: remove_test_db(db_path))

@pytest.fixture(scope='function')
def test_client(test_app):
    return test_app.test_client()

@pytest.fixture(scope='function')
def session():
    db.session.begin_nested()
    yield db.session
    db.session.rollback() 