from flask_sqlalchemy import SQLAlchemy # SQLAlchemy: SQL veritabanını yönetmek için kullanılır.
from datetime import datetime, UTC # datetime: Tarih ve saat bilgilerini işlemek için kullanılır.
from werkzeug.security import generate_password_hash, check_password_hash # werkzeug.security: Şifre hashleme işlemlerini yapmak için kullanılır.

db = SQLAlchemy() # Veritabanı bağlantısını başlatır.

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Kullanıcının benzersiz kimliği.
    username = db.Column(db.String(80), unique=True, nullable=False) # Kullanıcı adı.
    email = db.Column(db.String(120), unique=True, nullable=False) # E-posta adresi.
    password = db.Column(db.String(255), nullable=False)  # Şifre alanını ekledik
    role = db.Column(db.String(20), nullable=False, default='student')  # Kullanıcının rolü.
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # Kullanıcının oluşturulma tarihi.
    
    # İlişkiler
    enrolled_courses = db.relationship('Enrollment', back_populates='student') # Öğrencinin kayıtlı olduğu kurslar.
    created_courses = db.relationship('Course', back_populates='instructor') # Öğretmenin oluşturduğu kurslar.

    def set_password(self, password): # Şifreyi hashler.
        self.password_hash = generate_password_hash(password)

    def check_password(self, password): # Şifrenin doğru olup olmadığını kontrol eder.
        return check_password_hash(self.password_hash, password)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Kursun benzersiz kimliği.
    title = db.Column(db.String(200), nullable=False) # Kursun başlığı.
    description = db.Column(db.Text) # Kursun açıklaması.
    instructor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Öğretmenin kimliği.
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC)) # Kursun oluşturulma tarihi.
    
    # İlişkiler
    instructor = db.relationship('User', back_populates='created_courses') # Kursu oluşturan öğretmen.
    enrollments = db.relationship('Enrollment', back_populates='course') # Kursa kayıtlı öğrenciler.
    lessons = db.relationship('Lesson', back_populates='course', cascade='all, delete-orphan') # Kursa ait dersler.

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Dersin benzersiz kimliği.
    title = db.Column(db.String(200), nullable=False) # Dersin başlığı.
    content = db.Column(db.Text, nullable=False) # Dersin içeriği.
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False) # Kursun kimliği.
    order = db.Column(db.Integer, nullable=False)  # Dersin sırasını belirtir.
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC)) # Dersin oluşturulma tarihi.
    
    # İlişkiler
    course = db.relationship('Course', back_populates='lessons') # Dersin ait olduğu kurs.
    progress_records = db.relationship('Progress', back_populates='lesson') # Dersin ilerleme kayıtları.

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Kayıtun benzersiz kimliği.
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Öğrencinin kimliği.
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False) # Kursun kimliği.
    enrolled_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC)) # Kayıtun oluşturulma tarihi.
    
    # İlişkiler
    student = db.relationship('User', back_populates='enrolled_courses') # Kayıt yapan öğrenci.
    course = db.relationship('Course', back_populates='enrollments') # Kurs.
    progress = db.relationship('Progress', back_populates='enrollment') # Kayıt ile ilişkili ilerleme kayıtları.

class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True) # İlerleme kayıtlarının benzersiz kimliği.
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollment.id'), nullable=False) # Kayıtun kimliği.
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False) # Dersin kimliği.
    completed = db.Column(db.Boolean, default=False) # Dersin tamamlanıp tamamlanmadığını belirtir.
    completed_at = db.Column(db.DateTime) # Dersin tamamlanma tarihi.
    
    # İlişkiler
    enrollment = db.relationship('Enrollment', back_populates='progress') # Kayıt ile ilişkili ilerleme kayıtları.
    lesson = db.relationship('Lesson', back_populates='progress_records') # Ders ile ilişkili ilerleme kayıtları. 