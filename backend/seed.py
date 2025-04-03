from app import create_app
from models import (
    db, User, Course, Lesson, Quiz, QuizQuestion, QuizOption, 
    Assignment, LessonDocument, Enrollment, Notification
)
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, UTC

def seed_database():
    app = create_app()
    with app.app_context():
        # Veritabanını temizle
        db.drop_all()
        # Tabloları oluştur
        db.create_all()
        
        print('1. Kullanıcılar oluşturuluyor...')
        # Örnek kullanıcılar oluştur
        instructor = User(
            username='instructor',
            email='instructor@test.com',
            password_hash=generate_password_hash('password123'),
            role='instructor',
            created_at=datetime.now(UTC)
        )
        
        student = User(
            username='student',
            email='student@test.com',
            password_hash=generate_password_hash('password123'),
            role='student',
            created_at=datetime.now(UTC)
        )
        
        db.session.add_all([instructor, student])
        db.session.commit()
        
        print('2. Kurslar oluşturuluyor...')
        # Örnek kurslar oluştur
        python_course = Course(
            title='Python Programlama',
            description='Python programlama dilini temellerinden öğrenin',
            instructor_id=instructor.id,
            created_at=datetime.now(UTC),
            price=199.99,
            category='Programlama',
            level='Başlangıç'
        )
        
        web_course = Course(
            title='Web Geliştirme',
            description='HTML, CSS ve JavaScript ile web geliştirme',
            instructor_id=instructor.id,
            created_at=datetime.now(UTC),
            price=299.99,
            category='Web Geliştirme',
            level='Orta Seviye'
        )
        
        db.session.add_all([python_course, web_course])
        db.session.commit()
        
        print('3. Dersler oluşturuluyor...')
        # Python kursu için dersler
        python_lessons = [
            Lesson(
                title='Python\'a Giriş',
                content='Python programlama diline giriş ve kurulum',
                order=1,
                course_id=python_course.id,
                created_at=datetime.now(UTC)
            ),
            Lesson(
                title='Veri Tipleri ve Değişkenler',
                content='Python\'da temel veri tipleri ve değişken kavramı',
                order=2,
                course_id=python_course.id,
                created_at=datetime.now(UTC)
            )
        ]
        
        # Web kursu için dersler
        web_lessons = [
            Lesson(
                title='HTML Temelleri',
                content='HTML etiketleri ve sayfa yapısı',
                order=1,
                course_id=web_course.id,
                created_at=datetime.now(UTC)
            ),
            Lesson(
                title='CSS ile Stillendirme',
                content='CSS seçiciler ve özellikler',
                order=2,
                course_id=web_course.id,
                created_at=datetime.now(UTC)
            )
        ]
        
        db.session.add_all(python_lessons + web_lessons)
        db.session.commit()
        
        print('4. Quizler oluşturuluyor...')
        # Python dersi için quiz
        python_quiz = Quiz(
            title='Python Temel Kavramlar Quiz',
            description='Python\'da veri tipleri hakkında quiz',
            lesson_id=python_lessons[1].id,
            time_limit=30,
            passing_score=70.0,
            created_at=datetime.now(UTC)
        )
        db.session.add(python_quiz)
        db.session.commit()
        
        # Quiz soruları
        python_questions = [
            QuizQuestion(
                quiz_id=python_quiz.id,
                question_text='Python\'da liste oluşturmak için hangi parantezler kullanılır?',
                question_type='multiple_choice',
                points=10
            ),
            QuizQuestion(
                quiz_id=python_quiz.id,
                question_text='Python\'da string birleştirme operatörü hangisidir?',
                question_type='multiple_choice',
                points=10
            )
        ]
        db.session.add_all(python_questions)
        db.session.commit()
        
        # Soru seçenekleri
        question1_options = [
            QuizOption(question_id=python_questions[0].id, option_text='()', is_correct=False),
            QuizOption(question_id=python_questions[0].id, option_text='[]', is_correct=True),
            QuizOption(question_id=python_questions[0].id, option_text='{}', is_correct=False)
        ]
        
        question2_options = [
            QuizOption(question_id=python_questions[1].id, option_text='+', is_correct=True),
            QuizOption(question_id=python_questions[1].id, option_text='&', is_correct=False),
            QuizOption(question_id=python_questions[1].id, option_text='*', is_correct=False)
        ]
        
        db.session.add_all(question1_options + question2_options)
        db.session.commit()
        
        print('5. Ödevler oluşturuluyor...')
        # Ödevler
        python_assignment = Assignment(
            id=1,
            title='Python Liste İşlemleri',
            description='Listeler üzerinde temel işlemler yapan bir program yazın',
            lesson_id=python_lessons[1].id,
            due_date=datetime.now(UTC) + timedelta(days=7),
            max_points=100,
            created_at=datetime.now(UTC)
        )
        
        web_assignment = Assignment(
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
        
        db.session.add_all([python_assignment, web_assignment, urgent_assignment])
        db.session.commit()
        
        print('6. Ders dökümanları oluşturuluyor...')
        # Ders dökümanları
        python_doc = LessonDocument(
            lesson_id=python_lessons[0].id,
            file_url='https://example.com/python_intro.pdf',
            file_name='python_giris.pdf',
            created_at=datetime.now(UTC)
        )
        
        web_doc = LessonDocument(
            lesson_id=web_lessons[0].id,
            file_url='https://example.com/html_basics.pdf',
            file_name='html_temelleri.pdf',
            created_at=datetime.now(UTC)
        )
        
        db.session.add_all([python_doc, web_doc])
        db.session.commit()
        
        print('7. Kurs kayıtları oluşturuluyor...')
        # Öğrenciyi kurslara kaydet
        python_enrollment = Enrollment(
            student_id=student.id,
            course_id=python_course.id,
            enrolled_at=datetime.now(UTC)
        )
        
        web_enrollment = Enrollment(
            student_id=student.id,
            course_id=web_course.id,
            enrolled_at=datetime.now(UTC)
        )
        
        db.session.add_all([python_enrollment, web_enrollment])
        db.session.commit()
        
        print('8. Bildirimler oluşturuluyor...')
        # Örnek bildirimler
        notifications = [
            Notification(
                user_id=student.id,
                course_id=python_course.id,
                type='course_update',
                title='Kurs Güncellendi',
                message='Python Programlama kursuna yeni içerikler eklendi.',
                is_read=False,
                created_at=datetime.now(UTC)
            ),
            Notification(
                user_id=student.id,
                course_id=web_course.id,
                type='new_assignment',
                title='Yeni Ödev',
                message='Web Geliştirme kursuna yeni ödev eklendi.',
                is_read=False,
                created_at=datetime.now(UTC)
            )
        ]
        
        db.session.add_all(notifications)
        db.session.commit()
        
        print('Veritabanı başarıyla dolduruldu!')

if __name__ == '__main__':
    seed_database()