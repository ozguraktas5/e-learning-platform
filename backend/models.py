from flask_sqlalchemy import SQLAlchemy # SQLAlchemy: SQL veritabanını yönetmek için kullanılır.
from datetime import datetime, UTC # datetime: Tarih ve saat bilgilerini işlemek için kullanılır.
from werkzeug.security import generate_password_hash, check_password_hash # werkzeug.security: Şifre hashleme işlemlerini yapmak için kullanılır.

db = SQLAlchemy() # Veritabanı bağlantısını başlatır.

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Kullanıcının benzersiz kimliği.
    username = db.Column(db.String(80), unique=True, nullable=False) # Kullanıcı adı.
    email = db.Column(db.String(120), unique=True, nullable=False) # E-posta adresi.
    password_hash = db.Column(db.String(255), nullable=False)  # password yerine password_hash kullanıyoruz
    role = db.Column(db.String(20), nullable=False, default='student')  # Kullanıcının rolü.
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # Kullanıcının oluşturulma tarihi.
    
    # İlişkiler
    enrolled_courses = db.relationship('Enrollment', backref='student', lazy=True)
    created_courses = db.relationship('Course', backref='instructor', lazy=True)

    def set_password(self, password): # Şifreyi hashler.
        self.password_hash = generate_password_hash(password)

    def check_password(self, password): # Şifrenin doğru olup olmadığını kontrol eder.
        return check_password_hash(self.password_hash, password)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=True)
    popularity = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, nullable=False, default=0.0)  # Fiyat alanı eklendi
    instructor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # İlişkiler
    lessons = db.relationship('Lesson', backref='course', lazy=True, order_by='Lesson.order')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # Medya desteği
    video_url = db.Column(db.String(500), nullable=True)
    file_url = db.Column(db.String(500), nullable=True)
    file_type = db.Column(db.String(50), nullable=True)  # pdf, ppt, doc vb.
    
    # İlişkiler
    progress_records = db.relationship('Progress', backref='lesson', lazy=True)
    quiz = db.relationship('Quiz', backref='lesson', uselist=False, lazy=True)
    assignments = db.relationship('Assignment', backref='lesson', lazy=True)

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollment.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # İlişkiler
    enrollment = db.relationship('Enrollment', backref='progress_records', lazy=True)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 arası puan
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # İlişkiler
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    instructor_reply = db.Column(db.Text, nullable=True)
    instructor_reply_date = db.Column(db.DateTime, nullable=True)
    
    # İlişki tanımlamaları
    course = db.relationship('Course', backref=db.backref('reviews', lazy=True))
    user = db.relationship('User', backref=db.backref('reviews', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'course_id': self.course_id,
            'user_id': self.user_id,
            'user': {
                'id': self.user.id,
                'username': self.user.username
            },
            'instructor_reply': self.instructor_reply,
            'instructor_reply_date': self.instructor_reply_date.isoformat() if self.instructor_reply_date else None
        }

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # İlişkiler
    questions = db.relationship('QuizQuestion', backref='quiz', lazy=True)
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True)

class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # multiple_choice, true_false, short_answer
    points = db.Column(db.Integer, nullable=False, default=1)
    
    # İlişkiler
    options = db.relationship('QuizOption', backref='question', lazy=True)
    answers = db.relationship('QuizAnswer', backref='question', lazy=True)

class QuizOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_question.id'), nullable=False)
    option_text = db.Column(db.String(200), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score = db.Column(db.Float, nullable=True)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # İlişkiler
    answers = db.relationship('QuizAnswer', backref='attempt', lazy=True)

class QuizAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempt.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_question.id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=True)
    points_earned = db.Column(db.Float, nullable=True)

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    max_points = db.Column(db.Integer, nullable=False, default=100)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # İlişkiler
    submissions = db.relationship('AssignmentSubmission', backref='assignment', lazy=True)

class AssignmentSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignment.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    submission_text = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(500), nullable=True)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    grade = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    graded_at = db.Column(db.DateTime, nullable=True)
    
    # İlişkiler
    user = db.relationship('User', backref='assignment_submissions', lazy=True) 