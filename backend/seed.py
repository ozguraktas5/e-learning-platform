from app import app, db
from models import User, Course, Lesson
from datetime import datetime, UTC

def seed_database():
    with app.app_context():
        # Veritabanını temizle
        db.drop_all()
        db.create_all()

        # Örnek eğitmen oluştur
        instructor = User(
            username="test_instructor",
            email="instructor@test.com",
            role="instructor"
        )
        instructor.set_password("test123")
        db.session.add(instructor)
        db.session.commit()

        # Örnek kurslar oluştur
        courses = [
            Course(
                title="Python Programlama Temelleri",
                description="Python programlama dilini sıfırdan öğrenin. Değişkenler, döngüler, fonksiyonlar ve daha fazlası.",
                instructor_id=instructor.id
            ),
            Course(
                title="Web Geliştirme ile Flask",
                description="Flask framework'ü ile web uygulamaları geliştirmeyi öğrenin. REST API, veritabanı entegrasyonu ve authentication konuları.",
                instructor_id=instructor.id
            ),
            Course(
                title="Veri Bilimi ve Machine Learning",
                description="Python ile veri bilimi ve makine öğrenmesi. NumPy, Pandas, Scikit-learn kütüphaneleri ile uygulamalı örnekler.",
                instructor_id=instructor.id
            )
        ]
        
        for course in courses:
            db.session.add(course)
        db.session.commit()

        # Her kurs için örnek dersler oluştur
        for i, course in enumerate(courses):
            lessons = [
                Lesson(
                    title=f"Ders 1: Giriş - {course.title}",
                    content="Bu derste kursun genel içeriğini ve hedeflerini öğreneceksiniz.",
                    course_id=course.id,
                    order=1
                ),
                Lesson(
                    title=f"Ders 2: Temel Kavramlar - {course.title}",
                    content="Bu derste temel kavramları ve terminolojiyi öğreneceksiniz.",
                    course_id=course.id,
                    order=2
                ),
                Lesson(
                    title=f"Ders 3: İleri Seviye - {course.title}",
                    content="Bu derste ileri seviye konuları ve best practice'leri öğreneceksiniz.",
                    course_id=course.id,
                    order=3
                )
            ]
            
            for lesson in lessons:
                db.session.add(lesson)
        
        db.session.commit()

if __name__ == "__main__":
    seed_database()
    print("Veritabanı başarıyla dolduruldu!") 