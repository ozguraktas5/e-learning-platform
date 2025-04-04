import pytest
from app import create_app
from models import db
import os

@pytest.fixture(scope='function')
def test_app():
    # Test veritabanı dosyasının yolunu belirle
    db_path = "instance/test.db"
    
    # Eğer test veritabanı varsa sil
    if os.path.exists(db_path):
        os.remove(db_path)
    
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False
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
        if os.path.exists(db_path):
            os.remove(db_path)

@pytest.fixture(scope='function')
def test_client(test_app):
    return test_app.test_client()

@pytest.fixture(scope='function')
def session():
    db.session.begin_nested()
    yield db.session
    db.session.rollback() 