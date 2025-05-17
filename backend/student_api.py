from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, Course, Enrollment, Progress, Notification, Lesson, Assignment, AssignmentSubmission
from datetime import datetime, timedelta

student_api = Blueprint('student_api', __name__)
CORS(student_api)

# Öğrenci kayıtlı kurslarını getir
@student_api.route('/student/enrolled-courses', methods=['GET'])
@jwt_required()
def get_enrolled_courses():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Sadece öğrenciler bu API'yi kullanabilir
        if user.role != 'student':
            return jsonify({'message': 'Unauthorized access'}), 403
        
        # Öğrencinin kayıtlı olduğu kursları bul
        enrollments = Enrollment.query.filter_by(student_id=current_user_id).all()
        
        courses_list = []
        for enrollment in enrollments:
            course = Course.query.get(enrollment.course_id)
            if course:
                # Bu kayıt için ilerleme kayıtlarını bul
                progress_records = Progress.query.filter_by(
                    enrollment_id=enrollment.id
                ).all()
                
                # Derslerin sayısını bul
                total_lessons = Lesson.query.filter_by(course_id=course.id).count()
                
                # Tamamlanan derslerin sayısı
                completed_lessons = len([p for p in progress_records if p.completed])
                
                # İlerleme yüzdesi
                progress_percentage = 0
                if total_lessons > 0:
                    progress_percentage = round((completed_lessons / total_lessons) * 100)
                
                # En son erişim zamanı
                last_accessed = None
                if progress_records:
                    last_accessed = max([p.updated_at for p in progress_records]).isoformat()
                
                courses_list.append({
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'image_url': course.image_url,
                    'instructor_id': course.instructor_id,
                    'progress': progress_percentage,
                    'last_accessed': last_accessed,
                    'enrollment_date': enrollment.enrolled_at.isoformat(),
                    'enrollment_id': enrollment.id
                })
        
        return jsonify({'courses': courses_list})
    except Exception as e:
        print(f"Error getting enrolled courses: {str(e)}")
        return jsonify({'message': f'Error getting enrolled courses: {str(e)}'}), 500

# Öğrenci aktivitelerini getir
@student_api.route('/student/activities', methods=['GET'])
@jwt_required()
def get_student_activities():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Sadece öğrenciler bu API'yi kullanabilir
        if user.role != 'student':
            return jsonify({'message': 'Unauthorized access'}), 403
        
        # Son 30 günlük aktiviteleri getir
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Aktiviteleri oluşturalım (gerçek bir uygulamada bunlar veritabanından gelir)
        # Burada örnek olarak kayıt ve ilerleme bilgilerinden aktiviteler oluşturuyoruz
        
        activities = []
        
        # Kayıt bilgilerinden aktiviteler
        enrollments = Enrollment.query.filter_by(student_id=current_user_id).all()
        
        for enrollment in enrollments:
            # Son 30 günde kaydolmuş kursları filtrele
            if enrollment.enrolled_at >= thirty_days_ago:
                course = Course.query.get(enrollment.course_id)
                if course:
                    activities.append({
                        'id': f"enroll_{enrollment.id}",
                        'type': 'enrollment',
                        'title': 'Yeni Kurs Kaydı',
                        'description': f"{course.title} kursuna kayıt oldunuz",
                        'course_id': course.id,
                        'course_title': course.title,
                        'date': enrollment.enrolled_at.isoformat()
                    })
        
        # İlerleme bilgilerinden aktiviteler - Progress tablosundan kayıtları çekelim
        # İlk önce öğrencinin tüm kayıtlarını bulup progress kayıtlarını alacağız
        for enrollment in enrollments:
            progress_records = Progress.query.filter_by(
                enrollment_id=enrollment.id,
                completed=True
            ).all()
            
            # Son 30 günde tamamlanan dersleri filtrele
            recent_progress = [p for p in progress_records if p.updated_at >= thirty_days_ago]
            
            for progress in recent_progress:
                lesson = Lesson.query.get(progress.lesson_id)
                course = Course.query.get(enrollment.course_id)
                
                if lesson and course:
                    activities.append({
                        'id': f"progress_{progress.id}",
                        'type': 'completion',
                        'title': 'Ders Tamamlandı',
                        'description': f"{course.title} kursundaki {lesson.title} dersini tamamladınız",
                        'course_id': course.id,
                        'course_title': course.title,
                        'date': progress.updated_at.isoformat()
                    })
        
        # Ödev bilgilerini ekliyoruz
        # Öğrencinin aldığı kurslardaki ödev teslimlerini listeleyebiliriz
        submissions = AssignmentSubmission.query.filter_by(user_id=current_user_id).all()
        
        # Son 30 günde teslim edilen ödevleri filtrele
        recent_submissions = [s for s in submissions if s.submitted_at >= thirty_days_ago]
        
        for submission in recent_submissions:
            assignment = Assignment.query.get(submission.assignment_id)
            if assignment:
                lesson = Lesson.query.get(assignment.lesson_id)
                if lesson:
                    course = Course.query.get(lesson.course_id)
                    if course:
                        activities.append({
                            'id': f"submission_{submission.id}",
                            'type': 'submission',
                            'title': 'Ödev Teslimi',
                            'description': f"{course.title} kursundaki {assignment.title} ödevini teslim ettiniz",
                            'course_id': course.id,
                            'course_title': course.title,
                            'date': submission.submitted_at.isoformat()
                        })
        
        # Tarihe göre sırala (en yeniden en eskiye)
        activities.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({'activities': activities})
    except Exception as e:
        print(f"Error getting student activities: {str(e)}")
        return jsonify({'message': f'Error getting student activities: {str(e)}'}), 500 