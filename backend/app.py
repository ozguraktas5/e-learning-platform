import os
import sys
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, send_from_directory, request

# Arka uç dizinini Python yoluna ekleyin
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask_jwt_extended import JWTManager
from flask_cors import CORS
from models import db, User, Course, Lesson, Enrollment, Progress
from flask_migrate import Migrate
from datetime import timedelta
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

migrate = Migrate()

def create_app():
    # Explicitly disable Flask's default static folder handling
    app = Flask(__name__, static_folder=None)
    
    # Debug modu aktif et
    app.config['DEBUG'] = True
    
    # URL sonundaki eğik çizgi yönlendirmesini devre dışı bırak
    app.url_map.strict_slashes = False
    
    # Uploads klasörünü oluştur
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token 1 saat geçerli
    
    # CORS ayarları: tüm rotalar için preflight dahil her isteği otomatik olarak destekle
    CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
    
    # Preflight OPTIONS isteklerini yakala ve 200 dön
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            return ('', 200)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt = JWTManager(app)

    # DEFINE THE MEDIA SERVING ROUTE *BEFORE* BLUEPRINTS
    @app.route('/media/<path:filename>')
    def serve_media_file(filename):
        app.logger.info(f"Attempting to serve file via /media/ route: {filename}")
        absolute_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        app.logger.info(f"Looking for file at absolute path: {absolute_path}")
        
        if not os.path.exists(absolute_path):
            app.logger.error(f"File does not exist at path: {absolute_path}")
            return jsonify({"error": "File not found"}), 404 
            
        try:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False)
        except Exception as e:
            app.logger.error(f"Error sending file {filename}: {e}")
            return jsonify({"error": "Error serving file"}), 500

    # Register Blueprints
    from auth import auth
    from courses import courses
    from profiles import profiles
    from enrollments import enrollments

    app.register_blueprint(auth, url_prefix='/auth')
    app.register_blueprint(courses, url_prefix='/courses')
    app.register_blueprint(profiles)
    app.register_blueprint(enrollments)
    
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