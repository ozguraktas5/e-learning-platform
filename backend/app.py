import os
import sys
from pathlib import Path

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
    
    # Backend klasörü içinde instance klasörünü oluştur
    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    
    # Veritabanı yapılandırması
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(instance_path, 'elearning.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')  
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    # CORS yapılandırması
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Uzantıları başlat
    jwt = JWTManager(app)
    db.init_app(app)
    migrate = Migrate(app, db)

    # Planları kaydedin
    from auth import auth
    from courses import courses

    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(courses, url_prefix='/api/courses')

    # Tablolar oluştur
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Error creating tables: {e}")

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
    app.run(debug=True)