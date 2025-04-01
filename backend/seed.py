from app import create_app
from models import db, User, Course, Lesson
from werkzeug.security import generate_password_hash
from datetime import datetime

def seed_database():
    app = create_app()
    with app.app_context():
        # Veritabanını temizle
        db.drop_all()
        # Tabloları oluştur
        db.create_all()
        
        # Örnek kullanıcılar oluştur
        instructor = User(
            username='instructor',
            email='instructor@test.com',
            password_hash=generate_password_hash('password123'),
            role='instructor',
            created_at=datetime.utcnow()
        )
        
        student = User(
            username='student',
            email='student@test.com',
            password_hash=generate_password_hash('password123'),
            role='student',
            created_at=datetime.utcnow()
        )
        
        db.session.add(instructor)
        db.session.add(student)
        db.session.commit()
        
        # Örnek kurs oluştur
        course = Course(
            title='Python Programlama',
            description='Python programlama dilini temellerinden öğrenin',
            instructor_id=instructor.id,
            created_at=datetime.utcnow(),
            price=0.0,
            category='Programming',
            level='Beginner'
        )
        
        db.session.add(course)
        db.session.commit()
        
        # Örnek ders oluştur
        lesson = Lesson(
            title='Python Giriş',
            content='Python programlama diline giriş',
            order=1,
            course_id=course.id
        )
        
        db.session.add(lesson)
        db.session.commit()
        
        print('Veritabanı başarıyla dolduruldu!')

if __name__ == '__main__':
    seed_database()