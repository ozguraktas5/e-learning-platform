import os
import sys
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, send_from_directory, request, send_file

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
    # Configure uploads directory as a separate static folder
    uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    app = Flask(__name__, static_folder=None)
    
    # Debug modu aktif et
    app.config['DEBUG'] = True
    
    # URL sonundaki eğik çizgi yönlendirmesini devre dışı bırak
    app.url_map.strict_slashes = False
    
    # Uploads klasörünü oluştur
    UPLOAD_FOLDER = uploads_path
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
    file_handler.setLevel(logging.DEBUG)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.DEBUG)
    app.logger.info('E-Learning Platform startup')

    # SQLite veritabanı konfigürasyonu
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///elearning.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT konfigürasyonu
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Güvenli bir secret key kullanın
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token 1 saat geçerli
    
    # CORS ayarları: tüm rotalar için preflight dahil her isteği otomatik olarak destekle
    CORS(app, 
         origins=["*"],  # Tüm kaynakları kabul et 
         supports_credentials=True,
         resources={r"/*": {"origins": "*"}}
    )
    
    # Preflight OPTIONS isteklerini yakala ve 200 dön
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            return response
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt = JWTManager(app)

    # DEFINE THE MEDIA SERVING ROUTE *BEFORE* BLUEPRINTS
    @app.route('/uploads/<path:filename>')
    def serve_uploads_file(filename):
        app.logger.info(f"Attempting to serve file: {filename}")
        
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            app.logger.info(f"Full file path: {file_path}")
            
            # Dosya varlığını kontrol et
            if not os.path.exists(file_path):
                app.logger.error(f"File not found: {file_path}")
                # Dosya tam yolu göstererek hata döndür
                return jsonify({"error": "File not found", "path": file_path}), 404
                
            # Dosya tipi belirle
            mimetype = None
            if filename.lower().endswith('.mp4'):
                mimetype = 'video/mp4'
            elif filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
                mimetype = 'image/jpeg'
            elif filename.lower().endswith('.png'):
                mimetype = 'image/png'
            
            app.logger.info(f"Sending file with mimetype: {mimetype}")
            
            # Dosyayı gönder
            response = send_file(
                file_path,
                mimetype=mimetype,
                as_attachment=False,
                download_name=os.path.basename(file_path)
            )
            
            # CORS headers ekle
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Methods', 'GET')
            
            app.logger.info(f"Successfully sent file: {filename}")
            return response
            
        except Exception as e:
            app.logger.error(f"Error sending file {filename}: {str(e)}")
            return jsonify({"error": "Error serving file", "details": str(e)}), 500
            
    # Test endpoint to check if server can see files
    @app.route('/debug-files')
    def debug_files():
        uploads_dir = app.config['UPLOAD_FOLDER']
        videos_dir = os.path.join(uploads_dir, 'videos')
        
        files_list = []
        
        if os.path.exists(videos_dir):
            for file in os.listdir(videos_dir):
                file_path = os.path.join(videos_dir, file)
                if os.path.isfile(file_path):
                    files_list.append({
                        'name': file,
                        'size': os.path.getsize(file_path),
                        'path': file_path,
                        'exists': os.path.exists(file_path),
                        'readable': os.access(file_path, os.R_OK)
                    })
        
        return jsonify({
            'upload_folder': uploads_dir,
            'videos_dir': videos_dir,
            'videos_dir_exists': os.path.exists(videos_dir),
            'files': files_list
        })

    # Test endpoint to check if server is working correctly
    @app.route('/test-file')
    def test_file():
        # Create a simple test file in uploads folder
        test_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'test.txt')
        with open(test_file_path, 'w') as f:
            f.write('This is a test file.')
        
        app.logger.debug(f"Created test file at {test_file_path}")
        return jsonify({
            'success': True,
            'message': 'Test file created',
            'file_path': test_file_path,
            'url': '/uploads/test.txt'
        })

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