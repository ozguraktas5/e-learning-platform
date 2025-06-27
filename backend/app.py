import os #os modülünü import ediyoruz
import sys #sys modülünü import ediyoruz
from pathlib import Path #pathlib modülünü import ediyoruz
import logging #logging modülünü import ediyoruz
from logging.handlers import RotatingFileHandler #logging.handlers modülünü import ediyoruz
from flask import Flask, jsonify, send_from_directory, request, send_file #flask modülünü import ediyoruz

# Arka uç dizinini Python yoluna ekleyin
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))) #arayüz dizinini Python yoluna ekliyoruz

from flask_jwt_extended import JWTManager #flask_jwt_extended modülünü import ediyoruz
from flask_cors import CORS #flask_cors modülünü import ediyoruz
from models import db, User, Course, Lesson, Enrollment, Progress #models modülünü import ediyoruz
from flask_migrate import Migrate #flask_migrate modülünü import ediyoruz
from datetime import timedelta #datetime modülünü import ediyoruz
from dotenv import load_dotenv #dotenv modülünü import ediyoruz

# Ortam değişkenlerini yükle
load_dotenv()

migrate = Migrate() #flask_migrate modülünü başlatıyoruz

def create_app():
    #uploads dizinini ayarla (backend/uploads klasörü)
    uploads_path = os.path.join(os.path.dirname(__file__), 'uploads')
    app = Flask(__name__, static_folder=None) #flask uygulamasını başlatıyoruz
    
    # Debug modu aktif et
    app.config['DEBUG'] = True
    
    # URL sonundaki eğik çizgi yönlendirmesini devre dışı bırak
    app.url_map.strict_slashes = False
    
    # Google Cloud Storage için gerekli olmayabilir ama backward compatibility için
    UPLOAD_FOLDER = uploads_path #uploads dizinini ayarla
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER #uploads dizinini ayarla
    
    # Google Cloud Storage ayarları
    app.config['GOOGLE_CLOUD_PROJECT'] = os.getenv('GOOGLE_CLOUD_PROJECT')
    app.config['GOOGLE_CLOUD_BUCKET'] = os.getenv('GOOGLE_CLOUD_BUCKET')

    # Logging konfigürasyonu
    if not os.path.exists('logs'): #logs dizininin var olup olmadığını kontrol et
        os.mkdir('logs') #logs dizinini oluştur
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10000, backupCount=3) #logs dizinini ayarla
    file_handler.setFormatter(logging.Formatter( #logs dizinini ayarla
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]' #logs dizinini ayarla
    ))
    file_handler.setLevel(logging.DEBUG) #logs dizinini ayarla
    app.logger.addHandler(file_handler) #logs dizinini ayarla
    app.logger.setLevel(logging.DEBUG) #logs dizinini ayarla
    app.logger.info('E-Learning Platform startup') #logs dizinini ayarla

    # SQLite veritabanı konfigürasyonu
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///elearning.db' #sqlite veritabanını ayarla
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False #sqlite veritabanını ayarla
    
    # JWT konfigürasyonu
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Güvenli bir secret key kullanın (şifre)
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
    
    # (veritabanı ve JWT) uzantılarını başlat
    db.init_app(app) #veritabanını başlat
    migrate.init_app(app, db) #veritabanını başlat
    jwt = JWTManager(app) #JWT tokenını başlat

    # Google Cloud Storage kullanıldığında dosyalar doğrudan cloud'dan serve edilir
    # Bu endpoint artık gerekli değil, ama legacy support için bırakılabilir
    @app.route('/uploads/<path:filename>')
    def serve_uploads_file(filename):
        app.logger.info(f"Legacy upload endpoint called for: {filename}")
        return jsonify({
            "message": "Files are now served from Google Cloud Storage",
            "filename": filename
        }), 200
            
    # (dosya gönderimi için test endpoint)
    @app.route('/debug-files') #debug-files rotasını tanımla
    def debug_files(): #debug-files rotasını tanımla
        uploads_dir = app.config['UPLOAD_FOLDER'] #uploads dizinini ayarla
        videos_dir = os.path.join(uploads_dir, 'videos') #videos dizinini ayarla
        
        # Direkt uploads klasörünün içeriğini kontrol et
        all_files = [] #tüm dosyaların listesini oluştur
        if os.path.exists(uploads_dir): #uploads dizininin var olup olmadığını kontrol et
            try:
                for item in os.listdir(uploads_dir): #uploads dizininin içeriğini kontrol et
                    item_path = os.path.join(uploads_dir, item) #dosya yolu oluştur
                    if os.path.isfile(item_path): #dosya varlığını kontrol et
                        all_files.append({ #dosya yolu oluştur
                            'name': item,
                            'size': os.path.getsize(item_path), #dosya boyutunu al
                            'path': item_path, #dosya yolu oluştur
                            'exists': os.path.exists(item_path), #dosya varlığını kontrol et
                            'readable': os.access(item_path, os.R_OK), #dosya okunabilirliğini kontrol et
                            'absolute_path': os.path.abspath(item_path) #dosya yolu oluştur
                        })
            except Exception as e:
                app.logger.error(f"Error listing files: {str(e)}") #dosya gönderimi için log yazdır
        
        # Video klasörünü kontrol et
        files_list = [] 
        if os.path.exists(videos_dir): #videos dizininin var olup olmadığını kontrol et
            for file in os.listdir(videos_dir): #videos dizininin içeriğini kontrol et
                file_path = os.path.join(videos_dir, file) #dosya yolu oluştur
                if os.path.isfile(file_path): #dosya varlığını kontrol et
                    files_list.append({ #dosya yolu oluştur
                        'name': file,
                        'size': os.path.getsize(file_path), #dosya boyutunu al
                        'path': file_path, #dosya yolu oluştur
                        'exists': os.path.exists(file_path), #dosya varlığını kontrol et
                        'readable': os.access(file_path, os.R_OK) #dosya okunabilirliğini kontrol et
                    })
        
        # Özel dosya için bir kontrol yap
        specific_file = 'fd79095935a944bd81256f9e8765b8e6_wallhaven-6dqemx.jpg'
        specific_path = os.path.join(uploads_dir, specific_file) #dosya yolu oluştur
        specific_info = { #dosya yolu oluştur
            'exists': os.path.exists(specific_path), #dosya varlığını kontrol et
            'path': specific_path,
            'readable': os.access(specific_path, os.R_OK) if os.path.exists(specific_path) else False,
            'size': os.path.getsize(specific_path) if os.path.exists(specific_path) else 0
        }
        
        return jsonify({
            'upload_folder': uploads_dir, #uploads dizinini ayarla
            'upload_folder_exists': os.path.exists(uploads_dir), #uploads dizininin var olup olmadığını kontrol et
            'upload_folder_absolute': os.path.abspath(uploads_dir), #uploads dizininin mutlak yolu oluştur
            'all_files': all_files, #tüm dosyaların listesini oluştur
            'videos_dir': videos_dir, #videos dizinini ayarla
            'videos_dir_exists': os.path.exists(videos_dir), #videos dizininin var olup olmadığını kontrol et
            'video_files': files_list, #videos dizininin içeriğini kontrol et
            'specific_file': specific_info #özel dosya için bir kontrol yap
        })

    # (test dosyasının varlığını kontrol et)
    @app.route('/test-file') #test-file rotasını tanımla
    def test_file(): #test-file rotasını tanımla
        # Create a simple test file in uploads folder
        test_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'test.txt') #test dosyasının yolu oluştur
        with open(test_file_path, 'w') as f: #test dosyasını oluştur
            f.write('This is a test file.') #test dosyasını yaz
        
        app.logger.debug(f"Created test file at {test_file_path}") #test dosyasının yolu log yazdır
        return jsonify({ #test dosyasının yolu log yazdır
            'success': True, #test dosyasının varlığını kontrol et
            'message': 'Test file created', #test dosyasının varlığını kontrol et
            'file_path': test_file_path, #test dosyasının yolu oluştur
            'url': '/uploads/test.txt' #test dosyasının yolu oluştur
        })

    from auth import auth #auth modülünü import ediyoruz
    from courses import courses #courses modülünü import ediyoruz
    from profiles import profiles #profiles modülünü import ediyoruz
    from enrollments import enrollments #enrollments modülünü import ediyoruz
    from notifications import notifications_bp #notifications_bp modülünü import ediyoruz
    from assignments import assignments #assignments modülünü import ediyoruz
    from student_api import student_api #student_api modülünü import ediyoruz

    app.register_blueprint(auth, url_prefix='/auth') #auth modülünü register et
    app.register_blueprint(courses, url_prefix='/courses') #courses modülünü register et
    app.register_blueprint(profiles) #profiles modülünü register et
    app.register_blueprint(enrollments, url_prefix='/enrollments') #enrollments modülünü register et
    app.register_blueprint(notifications_bp, url_prefix='/api') #notifications_bp modülünü register et
    app.register_blueprint(assignments) #assignments modülünü register et
    app.register_blueprint(student_api, url_prefix='/api') #student_api modülünü register et
    
    # Veritabanı tablolarını oluştur
    with app.app_context():
        try: #veritabanı tablolarını oluştur
            db.create_all() #veritabanı tablolarını oluştur
            app.logger.info('Database tables created successfully') #veritabanı tablolarını oluştur
        except Exception as e:
            app.logger.error(f'Error creating database tables: {str(e)}') #veritabanı tablolarını oluştur
    
    @jwt.expired_token_loader #JWT tokenının süresi dolduğunda çalışır
    def expired_token_callback(jwt_header, jwt_payload): #JWT tokenının süresi dolduğunda çalışır
        return jsonify({ #JWT tokenının süresi dolduğunda çalışır
            'message': 'The token has expired', #JWT tokenının süresi dolduğunda çalışır
            'error': 'token_expired' #JWT tokenının süresi dolduğunda çalışır
        }), 401 #JWT tokenının süresi dolduğunda çalışır
    
    @jwt.invalid_token_loader #JWT tokenının geçersiz olduğunda çalışır 
    def invalid_token_callback(error):
        return jsonify({
            'message': 'Signature verification failed',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader #JWT tokenının eksik olduğunda çalışır
    def missing_token_callback(error):
        return jsonify({
            'message': 'Request does not contain an access token',
            'error': 'authorization_required'
        }), 401

    @app.route('/') #root rotasını tanımla
    def hello(): #root rotasını tanımla
        return jsonify({"message": "Welcome to the E-Learning API!"}) #root rotasını tanımla
        
    @app.route('/favicon.ico') #favicon.ico rotasını tanımla
    def favicon(): #favicon.ico rotasını tanımla
        return "", 204  #favicon.ico rotasını tanımla

    return app

if __name__ == '__main__':
    app = create_app() #app oluştur
    app.run(debug=True, host='0.0.0.0', port=5000) #app çalıştır