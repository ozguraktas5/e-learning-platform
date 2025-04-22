import os
import sys
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler

# Arka uç dizinini Python yoluna ekleyin
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify 
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from models import db, User, Course, Lesson, Enrollment, Progress
from flask_migrate import Migrate
from datetime import timedelta
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Debug modu aktif et
    app.config['DEBUG'] = True
    
    # Logging konfigürasyonu
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10000, backupCount=3)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('E-Learning Platform startup')

    # SQLite veritabanı konfigürasyonu
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///elearning.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT konfigürasyonu
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Güvenli bir secret key kullanın
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)  # Token 1 gün geçerli
    
    # CORS ayarları
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Veritabanını başlat
    db.init_app(app)
    
    # JWT yöneticisini başlat
    jwt = JWTManager(app)
    
    # Blueprint'leri kaydet
    from auth import auth
    from courses import courses

    app.register_blueprint(auth, url_prefix='/auth')
    app.register_blueprint(courses, url_prefix='/courses')
    
    # Veritabanı tablolarını oluştur
    with app.app_context():
        try:
            db.create_all()
            app.logger.info('Database tables created successfully')
        except Exception as e:
            app.logger.error(f'Error creating database tables: {str(e)}')
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token has expired',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'message': 'Signature verification failed',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'message': 'Request does not contain an access token',
            'error': 'authorization_required'
        }), 401

    @app.route('/')
    def hello():
        return jsonify({"message": "Hello, World!"})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)