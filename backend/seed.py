from app import create_app # app.py dosyasındaki create_app fonksiyonunu import ediyoruz.
from models import (
    db, User, Course, Lesson, Quiz, QuizQuestion, QuizOption, 
    Assignment, LessonDocument, Enrollment, Notification
)
from werkzeug.security import generate_password_hash # werkzeug.security modülünün generate_password_hash fonksiyonunu import ediyoruz.
from datetime import datetime, timedelta, UTC # datetime modülünü import ediyoruz.

def seed_database(): # Veritabanını doldur
    app = create_app() # Flask uygulamasını oluştur
    with app.app_context():
        # Veritabanını temizle
        db.drop_all() # Veritabanını temizle
        # Tabloları oluştur
        db.create_all() # Tabloları oluştur
        
        # Örnek kullanıcılar oluştur
        instructor = User( # Örnek kullanıcılar oluştur
            username='instructor',
            email='instructor@test.com',
            password_hash=generate_password_hash('password123'),
            role='instructor',
            created_at=datetime.now(UTC)
        )
        
        student = User( # Örnek kullanıcılar oluştur
            username='student',
            email='student@test.com',
            password_hash=generate_password_hash('password123'),
            role='student',
            created_at=datetime.now(UTC)
        )
        
        db.session.add_all([instructor, student]) # Kullanıcıları veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
    
        # Örnek kurslar oluştur
        python_course = Course( # Örnek kurslar oluştur
            title='Python Programlama',
            description='Python programlama dilini temellerinden öğrenin',
            instructor_id=instructor.id,
            created_at=datetime.now(UTC),
            price=199.99,
            category='Programlama',
            level='Başlangıç'
        )
        
        web_course = Course( # Örnek kurslar oluştur
            title='Web Geliştirme',
            description='HTML, CSS ve JavaScript ile web geliştirme',
            instructor_id=instructor.id,
            created_at=datetime.now(UTC),
            price=299.99,
            category='Web Geliştirme',
            level='Orta Seviye'
        )
        
        db.session.add_all([python_course, web_course]) # Kursları veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Python kursu için dersler
        python_lessons = [
            Lesson( # Örnek dersler oluştur
                title='Python\'a Giriş',
                content='Python programlama diline giriş ve kurulum',
                order=1,
                course_id=python_course.id,
                created_at=datetime.now(UTC)
            ),
            Lesson( # Örnek dersler oluştur
                title='Veri Tipleri ve Değişkenler',
                content='Python\'da temel veri tipleri ve değişken kavramı',
                order=2,
                course_id=python_course.id,
                created_at=datetime.now(UTC)
            )
        ]
        
        # Web kursu için dersler
        web_lessons = [
            Lesson( # Örnek dersler oluştur
                title='HTML Temelleri',
                content='HTML etiketleri ve sayfa yapısı',
                order=1,
                course_id=web_course.id,
                created_at=datetime.now(UTC)
            ),
            Lesson( # Örnek dersler oluştur
                title='CSS ile Stillendirme',
                content='CSS seçiciler ve özellikler',
                order=2,
                course_id=web_course.id,
                created_at=datetime.now(UTC)
            )
        ]
        
        db.session.add_all(python_lessons + web_lessons) # Dersleri veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Python dersi için quiz
        python_quiz = Quiz( # Örnek quiz oluştur
            title='Python Temel Kavramlar Quiz',
            description='Python\'da veri tipleri hakkında quiz',
            lesson_id=python_lessons[1].id,
            time_limit=30,
            passing_score=70.0,
            created_at=datetime.now(UTC)
        )
        db.session.add(python_quiz) # Quizi veritabanına ekle
        
        # Quiz soruları
        python_questions = [
            QuizQuestion( # Örnek quiz soruları oluştur
                quiz_id=python_quiz.id,
                question_text='Python\'da liste oluşturmak için hangi parantezler kullanılır?',
                question_type='multiple_choice',
                points=10
            ),
            QuizQuestion( # Örnek quiz soruları oluştur
                quiz_id=python_quiz.id,
                question_text='Python\'da string birleştirme operatörü hangisidir?',
                question_type='multiple_choice',
                points=10
            )
        ]
        db.session.add_all(python_questions) # Quiz sorularını veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Soru seçenekleri
        question1_options = [ # Örnek quiz soru seçenekleri oluştur
            QuizOption(question_id=python_questions[0].id, option_text='()', is_correct=False),
            QuizOption(question_id=python_questions[0].id, option_text='[]', is_correct=True),
            QuizOption(question_id=python_questions[0].id, option_text='{}', is_correct=False)
        ]
        
        question2_options = [ # Örnek quiz soru seçenekleri oluştur
            QuizOption(question_id=python_questions[1].id, option_text='+', is_correct=True),
            QuizOption(question_id=python_questions[1].id, option_text='&', is_correct=False),
            QuizOption(question_id=python_questions[1].id, option_text='*', is_correct=False)
        ]
        
        db.session.add_all(question1_options + question2_options) # Quiz soru seçeneklerini veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Ödevler
        python_assignment = Assignment( # Örnek ödev oluştur
            id=1,
            title='Python Liste İşlemleri',
            description='Listeler üzerinde temel işlemler yapan bir program yazın',
            lesson_id=python_lessons[1].id,
            due_date=datetime.now(UTC) + timedelta(days=7),
            max_points=100,
            created_at=datetime.now(UTC)
        )
        
        web_assignment = Assignment( # Örnek ödev oluştur
            id=2,
            title='Kişisel Web Sayfası',
            description='HTML ve CSS kullanarak kişisel web sayfası oluşturun',
            lesson_id=web_lessons[1].id,
            due_date=datetime.now(UTC) + timedelta(days=7),
            max_points=100,
            created_at=datetime.now(UTC)
        )

        # Yakın tarihli ödev
        urgent_assignment = Assignment(
            id=3,
            title='Python Döngüler ve Koşullar',
            description='For, while döngüleri ve if-else koşulları kullanarak örnek programlar yazın',
            lesson_id=python_lessons[1].id,
            due_date=datetime.now(UTC) + timedelta(days=2),  # 2 gün sonra teslim
            max_points=100,
            created_at=datetime.now(UTC)
        )
        
        db.session.add_all([python_assignment, web_assignment, urgent_assignment]) # Ödevleri veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Ders dökümanları
        python_doc = LessonDocument( # Örnek ders dökümanı oluştur
            lesson_id=python_lessons[0].id,
            file_url='https://example.com/python_intro.pdf',
            file_name='python_giris.pdf',
            created_at=datetime.now(UTC)
        )
        
        web_doc = LessonDocument( # Örnek ders dökümanı oluştur
            lesson_id=web_lessons[0].id,
            file_url='https://example.com/html_basics.pdf',
            file_name='html_temelleri.pdf',
            created_at=datetime.now(UTC)
        )
        
        db.session.add_all([python_doc, web_doc]) # Ders dökümanlarını veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Öğrenciyi kurslara kaydet
        python_enrollment = Enrollment( # Öğrenciyi kurslara kaydet
            student_id=student.id,
            course_id=python_course.id,
            enrolled_at=datetime.now(UTC)
        )
        
        web_enrollment = Enrollment( # Öğrenciyi kurslara kaydet
            student_id=student.id,
            course_id=web_course.id,
            enrolled_at=datetime.now(UTC)
        )
        
        db.session.add_all([python_enrollment, web_enrollment]) # Kurs kayıtlarını veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.
        
        # Örnek bildirimler
        notifications = [
            Notification( # Örnek bildirim oluştur
                user_id=student.id,
                course_id=python_course.id,
                type='course_update',
                title='Kurs Güncellendi',
                message='Python Programlama kursuna yeni içerikler eklendi.',
                is_read=False,
                created_at=datetime.now(UTC)
            ),
            Notification( # Örnek bildirim oluştur
                user_id=student.id,
                course_id=web_course.id,
                type='new_assignment',
                title='Yeni Ödev',
                message='Web Geliştirme kursuna yeni ödev eklendi.',
                is_read=False,
                created_at=datetime.now(UTC)
            )
        ]
        
        db.session.add_all(notifications) # Bildirimleri veritabanına ekle
        db.session.commit() # Değişiklikleri kaydediyoruz.

if __name__ == '__main__':
    seed_database()