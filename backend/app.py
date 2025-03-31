from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, User, Course, Lesson, Enrollment, Progress
from flask_migrate import Migrate
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Instance path'i ayarla
instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
if not os.path.exists(instance_path):
    os.makedirs(instance_path)

app = Flask(__name__, instance_path=instance_path)
CORS(app)

# Veritabanı yapılandırması
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(instance_path, 'elearning.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Extensions
jwt = JWTManager(app)
db.init_app(app)
migrate = Migrate(app, db)

# Blueprint'leri import et ve kaydet
from auth import auth
from courses import courses

app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(courses, url_prefix='/api/courses')

@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to E-Learning Platform API',
        'status': 'active'
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)