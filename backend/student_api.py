from flask import Blueprint, jsonify, request # Flask'ın Blueprint, jsonify ve request fonksiyonlarını import ediyoruz.
from flask_jwt_extended import jwt_required, get_jwt_identity # Flask-JWT-Extended'ın jwt_required ve get_jwt_identity fonksiyonlarını import ediyoruz.
from flask_cors import CORS # Flask-CORS'ı import ediyoruz.
from models import db, User, Course, Enrollment, Progress, Notification, Lesson, Assignment, AssignmentSubmission # models.py dosyasındaki modelleri import ediyoruz.
from datetime import datetime, timedelta # datetime modülünü import ediyoruz.

student_api = Blueprint('student_api', __name__) # student_api blueprint'ini oluşturuyoruz.
CORS(student_api) # CORS'ı student_api blueprint'ine uyguluyoruz.

# Öğrenci kayıtlı kurslarını getir
@student_api.route('/student/enrolled-courses', methods=['GET']) # Öğrenci kayıtlı kurslarını getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_enrolled_courses(): # Öğrenci kayıtlı kurslarını getir
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        user = User.query.get(current_user_id) # Kullanıcıyı al
        
        if not user:
            return jsonify({'message': 'User not found'}), 404 # Kullanıcı bulunamadı
        
        # Sadece öğrenciler bu API'yi kullanabilir
        if user.role != 'student':  
            return jsonify({'message': 'Unauthorized access'}), 403 # Yetkisiz erişim
        
        # Öğrencinin kayıtlı olduğu kursları bul
        enrollments = Enrollment.query.filter_by(student_id=current_user_id).all() # Öğrencinin kayıtlı olduğu kursları al
        
        courses_list = [] # Kursların listesini oluştur
        for enrollment in enrollments: # Öğrencinin kayıtlı olduğu kursları döngüye sok
            course = Course.query.get(enrollment.course_id) # Kursu al
            if course: # Kurs varsa
                # Bu kayıt için ilerleme kayıtlarını bul
                progress_records = Progress.query.filter_by( # Bu kayıt için ilerleme kayıtlarını bul
                    enrollment_id=enrollment.id # Bu kayıt için ilerleme kayıtlarını bul
                ).all() # Bu kayıt için ilerleme kayıtlarını al
                
                # Derslerin sayısını bul
                total_lessons = Lesson.query.filter_by(course_id=course.id).count() # Derslerin sayısını bul
                
                # Tamamlanan derslerin sayısı
                completed_lessons = len([p for p in progress_records if p.completed]) # Tamamlanan derslerin sayısı
                
                # İlerleme yüzdesi
                progress_percentage = 0 # İlerleme yüzdesi
                if total_lessons > 0: # Derslerin sayısı 0'dan büyükse
                    progress_percentage = round((completed_lessons / total_lessons) * 100) # İlerleme yüzdesini bul
                
                # En son erişim zamanı
                last_accessed = None # En son erişim zamanı
                if progress_records: # İlerleme kayıtları varsa
                    last_accessed = max([p.updated_at for p in progress_records]).isoformat() # En son erişim zamanını bul
                
                courses_list.append({
                    'id': course.id, # Kurs ID'si
                    'title': course.title, # Kurs başlığı
                    'description': course.description, # Kurs açıklaması
                    'image_url': course.image_url, # Kurs resmi
                    'instructor_id': course.instructor_id, # Eğitmen ID'si
                    'progress': progress_percentage, # İlerleme yüzdesi
                    'last_accessed': last_accessed, # En son erişim zamanı
                    'enrollment_date': enrollment.enrolled_at.isoformat(), # Kayıt tarihi
                    'enrollment_id': enrollment.id # Kayıt ID'si
                })
        
        return jsonify({'courses': courses_list}) # Kursların listesini döndür
    except Exception as e:
            return jsonify({'message': f'Error getting enrolled courses: {str(e)}'}), 500 # Hata mesajı

# Öğrenci aktivitelerini getir
@student_api.route('/student/activities', methods=['GET']) # Öğrenci aktivitelerini getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_student_activities(): # Öğrenci aktivitelerini getir
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        user = User.query.get(current_user_id) # Kullanıcıyı al
        
        if not user:
            return jsonify({'message': 'User not found'}), 404 # Kullanıcı bulunamadı
        
        # Sadece öğrenciler bu API'yi kullanabilir
        if user.role != 'student':
            return jsonify({'message': 'Unauthorized access'}), 403 # Yetkisiz erişim
        
        # Son 30 günlük aktiviteleri getir
        thirty_days_ago = datetime.utcnow() - timedelta(days=30) # 30 gün önce
        
        # Aktiviteleri oluşturalım (gerçek bir uygulamada bunlar veritabanından gelir)
        # Burada örnek olarak kayıt ve ilerleme bilgilerinden aktiviteler oluşturuyoruz
        
        activities = [] # Aktivitelerin listesini oluştur
        
        # Kayıt bilgilerinden aktiviteler
        enrollments = Enrollment.query.filter_by(student_id=current_user_id).all() # Öğrencinin kayıtlı olduğu kursları al
        
        for enrollment in enrollments: # Öğrencinin kayıtlı olduğu kursları döngüye sok
            # Son 30 günde kaydolmuş kursları filtrele
            if enrollment.enrolled_at >= thirty_days_ago: # Kayıt tarihi 30 günden önceyse
                course = Course.query.get(enrollment.course_id) # Kursu al
                if course: # Kurs varsa
                    activities.append({
                        'id': f"enroll_{enrollment.id}", # Kayıt ID'si
                        'type': 'enrollment', # Kayıt türü
                        'title': 'Yeni Kurs Kaydı', # Kayıt başlığı
                        'description': f"{course.title} kursuna kayıt oldunuz", # Kayıt açıklaması
                        'course_id': course.id, # Kurs ID'si
                        'course_title': course.title, # Kurs başlığı
                        'date': enrollment.enrolled_at.isoformat() # Kayıt tarihi
                    })
        
        # İlerleme bilgilerinden aktiviteler - Progress tablosundan kayıtları çekelim
        # İlk önce öğrencinin tüm kayıtlarını bulup progress kayıtlarını alacağız
        for enrollment in enrollments: # Öğrencinin kayıtlı olduğu kursları döngüye sok
            progress_records = Progress.query.filter_by( # İlerleme kayıtlarını al
                enrollment_id=enrollment.id, # İlerleme kayıtlarını al
                completed=True # İlerleme kayıtlarını al
            ).all() # İlerleme kayıtlarını al
            
            # Son 30 günde tamamlanan dersleri filtrele
            recent_progress = [p for p in progress_records if p.updated_at >= thirty_days_ago] # Son 30 günde tamamlanan dersleri filtrele
            
            for progress in recent_progress: # Son 30 günde tamamlanan dersleri döngüye sok
                lesson = Lesson.query.get(progress.lesson_id) # Dersi al
                course = Course.query.get(enrollment.course_id) # Kursu al
                
                if lesson and course: # Ders ve kurs varsa
                    activities.append({
                        'id': f"progress_{progress.id}", # İlerleme ID'si
                        'type': 'completion', # İlerleme türü
                        'title': 'Ders Tamamlandı', # İlerleme başlığı
                        'description': f"{course.title} kursundaki {lesson.title} dersini tamamladınız", # İlerleme açıklaması
                        'course_id': course.id, # Kurs ID'si
                        'course_title': course.title, # Kurs başlığı
                        'date': progress.updated_at.isoformat() # İlerleme tarihi
                    })
        
        # Ödev bilgilerini ekliyoruz
        # Öğrencinin aldığı kurslardaki ödev teslimlerini listeleyebiliriz
        submissions = AssignmentSubmission.query.filter_by(user_id=current_user_id).all() # Öğrencinin aldığı kurslardaki ödev teslimlerini al
        
        # Son 30 günde teslim edilen ödevleri filtrele
        recent_submissions = [s for s in submissions if s.submitted_at >= thirty_days_ago] # Son 30 günde teslim edilen ödevleri filtrele
        
        for submission in recent_submissions: # Son 30 günde teslim edilen ödevleri döngüye sok
            assignment = Assignment.query.get(submission.assignment_id) # Ödevi al
            if assignment: # Ödev varsa
                lesson = Lesson.query.get(assignment.lesson_id) # Dersi al
                if lesson: # Ders varsa
                    course = Course.query.get(lesson.course_id) # Kursu al
                    if course: # Kurs varsa
                        activities.append({ # Ödev bilgilerini ekliyoruz
                            'id': f"submission_{submission.id}", # Ödev ID'si
                            'type': 'submission', # Ödev türü
                            'title': 'Ödev Teslimi', # Ödev başlığı
                            'description': f"{course.title} kursundaki {assignment.title} ödevini teslim ettiniz", # Ödev açıklaması
                            'course_id': course.id, # Kurs ID'si
                            'course_title': course.title, # Kurs başlığı
                            'date': submission.submitted_at.isoformat() # Ödev tarihi
                        })
        
        # Tarihe göre sırala (en yeniden en eskiye)
        activities.sort(key=lambda x: x['date'], reverse=True) # Tarihe göre sırala (en yeniden en eskiye)
        
        return jsonify({'activities': activities}) # Aktivitelerin listesini döndür
    except Exception as e:
        return jsonify({'message': f'Error getting student activities: {str(e)}'}), 500 # Hata mesajı