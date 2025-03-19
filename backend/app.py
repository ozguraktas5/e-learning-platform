from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, User, Course, Lesson, Enrollment, Progress
from flask_migrate import Migrate
import os
from config import config

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load configuration
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Initialize database
db.init_app(app)
migrate = Migrate(app, db)

# Basic configuration
app.config['JSON_AS_ASCII'] = False

# Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to E-Learning Platform API',
        'status': 'active'
    })

@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.all()
    return jsonify([{
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'instructor': course.instructor.username
    } for course in courses])

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
    app.run(debug=True)