from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, UTC
from werkzeug.security import generate_password_hash, check_password_hash # werkzeug.security: Şifre hashleme işlemlerini yapmak için kullanılır.

# SQLAlchemy'yi başlat
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True) # Kullanıcının benzersiz kimliği.
    username = db.Column(db.String(80), unique=True, nullable=False) # Kullanıcı adı.
    email = db.Column(db.String(120), unique=True, nullable=False) # E-posta adresi.
    password_hash = db.Column(db.String(255), nullable=False)  # password yerine password_hash kullanıyoruz
    role = db.Column(db.String(20), nullable=False, default='student')  # Kullanıcının rolü.
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # Kullanıcının oluşturulma tarihi.
    
    # İlişkiler
    enrollments = db.relationship('Enrollment', backref='student', lazy=True, foreign_keys='Enrollment.student_id')
    created_courses = db.relationship('Course', backref='instructor', lazy=True, foreign_keys='Course.instructor_id')

    def set_password(self, password): # Şifreyi hashler.
        self.password_hash = generate_password_hash(password)

    def check_password(self, password): # Şifrenin doğru olup olmadığını kontrol eder.
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    price = db.Column(db.Float, nullable=False, default=0.0)
    category = db.Column(db.String(50))
    level = db.Column(db.String(20))  # 'Beginner', 'Intermediate', 'Advanced'
    image_url = db.Column(db.String(500), nullable=True)  # Kurs resmi için URL
    
    # İlişkiler
    lessons = db.relationship('Lesson', back_populates='course', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='course', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'instructor': self.instructor.to_dict(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'price': self.price,
            'category': self.category,
            'level': self.level,
            'image_url': self.image_url,
            'lesson_count': len(self.lessons),
            'enrollment_count': len(self.enrollments),
            'review_count': len(self.reviews)
        }

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # Medya desteği
    video_url = db.Column(db.String(500), nullable=True)
    file_url = db.Column(db.String(500), nullable=True)
    file_type = db.Column(db.String(50), nullable=True)  # pdf, ppt, doc vb.
    
    # İlişkiler
    progress_records = db.relationship('Progress', backref='lesson', lazy=True)
    quizzes = db.relationship('Quiz', backref='lesson', lazy=True)
    assignments = db.relationship('Assignment', back_populates='lesson', lazy=True)
    documents = db.relationship('LessonDocument', backref='lesson', lazy=True, cascade='all, delete-orphan')
    course = db.relationship('Course', back_populates='lessons', lazy=True)

    def to_dict(self):
        # İlişkilerin None olup olmadığını kontrol et
        doc_count = len(self.documents) if self.documents is not None else 0
        # Dersin sahip olduğu quizlerin sayısını hesapla
        quiz_count = len(self.quizzes) if self.quizzes is not None else 0 
        assign_count = len(self.assignments) if self.assignments is not None else 0
        
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'order': self.order,
            'video_url': self.video_url,
            'created_at': self.created_at.isoformat(),
            'document_count': doc_count,
            'quiz_count': quiz_count,          # Düzeltilmiş quiz sayımı
            'assignment_count': assign_count
        }

class LessonDocument(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    def to_dict(self):
        return {
            'id': self.id,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'created_at': self.created_at.isoformat()
        }

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'enrolled_at': self.enrolled_at.isoformat()
        }

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
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instructor_reply = db.Column(db.Text, nullable=True)
    instructor_reply_date = db.Column(db.DateTime, nullable=True)
    
    # İlişki tanımlamaları
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
            'user': self.user.to_dict(),
            'instructor_reply': self.instructor_reply,
            'instructor_reply_date': self.instructor_reply_date.isoformat() if self.instructor_reply_date else None
        }

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    time_limit = db.Column(db.Integer, nullable=True)  # Dakika cinsinden süre limiti
    passing_score = db.Column(db.Float, nullable=False, default=60.0)  # Geçme notu
    
    # İlişkiler
    questions = db.relationship('QuizQuestion', backref='quiz', lazy=True)
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'lesson_id': self.lesson_id,
            'created_at': self.created_at.isoformat(),
            'time_limit': self.time_limit,
            'passing_score': self.passing_score,
            'question_count': len(self.questions) if self.questions else 0
        }

class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # multiple_choice, true_false, short_answer
    points = db.Column(db.Integer, nullable=False, default=1)
    
    # İlişkiler
    options = db.relationship('QuizOption', backref='question', lazy=True)
    answers = db.relationship('QuizAnswer', backref='question', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'points': self.points,
            'options': [option.to_dict() for option in self.options] if self.options else []
        }

class QuizOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_question.id'), nullable=False)
    option_text = db.Column(db.String(200), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'option_text': self.option_text,
            'is_correct': self.is_correct
        }

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, nullable=True)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # İlişkiler
    answers = db.relationship('QuizAnswer', backref='attempt', lazy=True)
    user = db.relationship('User', backref=db.backref('quiz_attempts', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'user_id': self.user_id,
            'score': self.score,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class QuizAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempt.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_question.id'), nullable=False)
    selected_option_id = db.Column(db.Integer, db.ForeignKey('quiz_option.id'), nullable=True)  # Çoktan seçmeli sorular için
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    points_earned = db.Column(db.Float, default=0)
    
    # İlişkiler
    selected_option = db.relationship('QuizOption', backref=db.backref('answers', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'selected_option_id': self.selected_option_id,
            'answer_text': self.answer_text,
            'is_correct': self.is_correct,
            'points_earned': self.points_earned
        }

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    due_date = db.Column(db.DateTime(timezone=True), nullable=False)
    max_points = db.Column(db.Integer, nullable=False, default=100)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC))
    
    # İlişkiler
    submissions = db.relationship('AssignmentSubmission', backref='assignment', lazy=True)
    lesson = db.relationship('Lesson', back_populates='assignments')

    def __init__(self, **kwargs):
        if 'due_date' in kwargs and kwargs['due_date'].tzinfo is None:
            kwargs['due_date'] = kwargs['due_date'].replace(tzinfo=UTC)
        super(Assignment, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'lesson_id': self.lesson_id,
            'lesson_title': self.lesson.title if self.lesson else None,
            'course_title': self.lesson.course.title if self.lesson else None,
            'due_date': self.due_date.isoformat(),
            'max_points': self.max_points,
            'created_at': self.created_at.isoformat(),
            'submission_count': len(self.submissions)
        }

class AssignmentSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignment.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    submission_text = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(500), nullable=True)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    grade = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    graded_at = db.Column(db.DateTime, nullable=True)
    
    # İlişkiler
    user = db.relationship('User', backref=db.backref('assignment_submissions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'user_id': self.user_id,
            'submission_text': self.submission_text,
            'file_url': self.file_url,
            'submitted_at': self.submitted_at.isoformat(),
            'grade': self.grade,
            'feedback': self.feedback,
            'graded_at': self.graded_at.isoformat() if self.graded_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'course_update', 'new_assignment', 'new_quiz', 'quiz_graded', 'assignment_graded', 'assignment_due'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    reference_id = db.Column(db.Integer, nullable=True)  # İlgili ödev, quiz vb. ID'si
    
    # İlişkiler
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))
    course = db.relationship('Course', backref=db.backref('notifications', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'course_title': self.course.title,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat(),
            'reference_id': self.reference_id
        }

class NotificationSetting(db.Model):
    __tablename__ = 'notification_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # 'course', 'system', 'marketing'
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # İlişkiler
    user = db.relationship('User', backref=db.backref('notification_settings', lazy=True))
    
    def to_dict(self):
        return {
            'id': str(self.id),  # Frontend ile uyumlu olması için id'yi string olarak dönüştürüyoruz
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'enabled': self.enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 