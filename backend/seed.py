from app import app, db 
from models import User, Course, Lesson
from datetime import datetime, UTC 

def seed_database(): # Veritabanını doldur
    with app.app_context(): 
        
        db.drop_all() # Veritabanını temizle
        db.create_all() # Yeni tabloları oluştur

        # Örnek eğitmen oluştur
        instructor = User(
            username="test_instructor",
            email="instructor@test.com",
            role="instructor",
            created_at=datetime.utcnow()
        )
        instructor.set_password("password123")  # Şifreyi doğru şekilde ayarla
        db.session.add(instructor) # Eğitmeni veritabanına ekliyoruz.
        db.session.commit() # Değişiklikleri kaydediyoruz.

        # Örnek kurslar oluştur
        courses = [
            Course(
                title="Python Programlama Temelleri",
                description="Python programlama dilini sıfırdan öğrenin. Değişkenler, döngüler, fonksiyonlar ve daha fazlası.",
                instructor_id=instructor.id,
                category="programming",
                price=199.99,
                created_at=datetime.utcnow()
            ),
            Course(
                title="Web Geliştirme ile Flask",
                description="Flask framework'ü ile web uygulamaları geliştirmeyi öğrenin. REST API, veritabanı entegrasyonu ve authentication konuları.",
                instructor_id=instructor.id,
                category="web_development",
                price=149.99,
                created_at=datetime.utcnow()
            ),
            Course(
                title="Veri Bilimi ve Machine Learning",
                description="Python ile veri bilimi ve makine öğrenmesi. NumPy, Pandas, Scikit-learn kütüphaneleri ile uygulamalı örnekler.",
                instructor_id=instructor.id,
                category="data_science",
                price=299.99,
                created_at=datetime.utcnow()
            )
        ]
        
        for course in courses: # Kursları veritabanına ekliyoruz.
            db.session.add(course) 
        db.session.commit() # Değişiklikleri kaydediyoruz.

        # Her kurs için örnek dersler oluştur
        for course in courses:
            for i in range(1, 4):
                lesson = Lesson(
                    title=f"{course.title} - Ders {i}",
                    content=f"Bu {course.title} kursunun {i}. dersidir.",
                    course_id=course.id,
                    order=i,
                    created_at=datetime.utcnow()
                )
                db.session.add(lesson)
        
        db.session.commit() # Değişiklikleri kaydediyoruz.

if __name__ == "__main__": # Bu kodu çalıştır
    seed_database() # Veritabanını doldur
    print("Veritabanı başarıyla dolduruldu!") # Mesaj göster