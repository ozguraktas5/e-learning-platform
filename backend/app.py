from flask import Flask, jsonify, request # Flask: Web uygulaması oluşturmak için kullanılır.
from flask_cors import CORS # Farklı domainlerden gelen verileri almak için kullanılır.
from flask_jwt_extended import JWTManager # JWT token işlemleri için kullanılır.
from models import db, User, Course, Lesson, Enrollment, Progress # Oluşturduğumuz modelleri import ediyoruz.
from flask_migrate import Migrate # Veritabanı şema değişikliklerini yönetmek için kullanılır.
import os # İşletim sistemi ile ilgili işlemleri yapmak için kullanılır.
from config import config # Konfigürasyon ayarlarını içeren dosyayı import ediyoruz.
from auth import auth # Auth blueprint'ini import ediyoruz.

app = Flask(__name__) # Yeni bir Flask uygulaması oluşturuyoruz.
CORS(app) # CORS'u etkinleştiriyoruz.

env = os.environ.get('FLASK_ENV', 'development') # Ortam değişkeninden çalışma ortamını alıyoruz.
app.config.from_object(config[env]) # Konfigürasyon ayarlarını yüklüyoruz.

jwt = JWTManager(app) # JWT token işlemleri için JWTManager'ı başlatıyoruz.

db.init_app(app) # SQLAlchemy veritabanını Flask uygulamasına bağlıyoruz.
migrate = Migrate(app, db) # Veritabanı şema değişikliklerini yönetmek için Migrate'i başlatıyoruz.

app.register_blueprint(auth, url_prefix='/api/auth') # Auth blueprint'ini Flask uygulamasına bağlıyoruz.

app.config['JSON_AS_ASCII'] = False # JSON verilerinin UTF-8 kodlamasını kullanmasını sağlar.

@app.route('/') # Ana URL'ye yapılan istekleri yakalar.
def home():
    return jsonify({
        'message': 'Welcome to E-Learning Platform API',
        'status': 'active'
    })

@app.route('/api/courses', methods=['GET']) # /api/courses URL'sine GET istekleri yapıldığında çalışacak fonksiyon.
def get_courses():
    courses = Course.query.all() # Tüm kursları alıyoruz.
    return jsonify([{
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'instructor': course.instructor.username
    } for course in courses])

@app.route('/api/courses/<int:course_id>', methods=['GET']) # /api/courses/<int:course_id> URL'sine GET istekleri yapıldığında çalışacak fonksiyon.
def get_course(course_id):
    course = Course.query.get_or_404(course_id) # Belirtilen ID'ye sahip kursu alıyoruz.
    return jsonify({
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'instructor': course.instructor.username,
        'lessons': [{
            'id': lesson.id,
            'title': lesson.title,
            'order': lesson.order
        } for lesson in course.lessons]
    })

if __name__ == '__main__': # Uygulamanın ana dosyası olduğunu belirtir.
    with app.app_context(): # Flask uygulama bağlamı oluşturur.
        db.create_all()  # Veritabanı tablolarını oluşturur.
    app.run(debug=True) # Uygulamayı debug modunda çalıştırır.