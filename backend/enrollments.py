from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, Course, Enrollment, Progress, Lesson, User
from datetime import datetime, UTC

enrollments = Blueprint('enrollments', __name__) # Enrollments blueprint'ini oluşturuyoruz.
CORS(enrollments, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

def is_student(user_id): # Kullanıcının öğrenci olup olmadığını kontrol et
    user = User.query.get(user_id)
    return user and user.role == 'student'

@enrollments.route('/courses/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_course(course_id): # Kursa kayıt ol
    # Kullanıcının öğrenci olup olmadığını kontrol et
    user_id = get_jwt_identity()
    if not is_student(user_id):
        return jsonify({'error': 'Only students can enroll in courses'}), 403
    
    # Kursun var olup olmadığını kontrol et
    course = Course.query.get_or_404(course_id)
    
    # Zaten kayıtlı mı kontrol et
    existing_enrollment = Enrollment.query.filter_by(
        student_id=user_id,
        course_id=course_id
    ).first()
    
    if existing_enrollment: # Zaten kayıtlı ise hata döndür
        return jsonify({'error': 'Already enrolled in this course'}), 400
    
    # Yeni kayıt oluştur
    enrollment = Enrollment(
        student_id=user_id,
        course_id=course_id
    )
    db.session.add(enrollment)
    
    # Her ders için ilerleme kaydı oluştur
    lessons = Lesson.query.filter_by(course_id=course_id).all()
    for lesson in lessons:
        progress = Progress(
            enrollment_id=enrollment.id,
            lesson_id=lesson.id,
            completed=False
        )
        db.session.add(progress)
    
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({
        'message': 'Successfully enrolled in course',
        'enrollment': {
            'id': enrollment.id,
            'course_title': course.title,
            'enrolled_at': enrollment.enrolled_at
        }
    }), 201

@enrollments.route('/my-courses', methods=['GET'])
@jwt_required()
def get_my_courses():
    user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    
    enrollments = Enrollment.query.filter_by(student_id=user_id).all() # Kullanıcının kayıtlı olduğu kursları al
    
    return jsonify([{
        'enrollment_id': enrollment.id,
        'course': {
            'id': enrollment.course.id,
            'title': enrollment.course.title,
            'description': enrollment.course.description,
            'instructor': enrollment.course.instructor.username,
            'progress': {
                'completed_lessons': len([p for p in enrollment.progress if p.completed]),
                'total_lessons': len(enrollment.course.lessons)
            }
        }
    } for enrollment in enrollments])

@enrollments.route('/courses/<int:course_id>/progress', methods=['GET'])
@jwt_required()
def get_course_progress(course_id):
    user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    
    # Kayıt kontrolü
    enrollment = Enrollment.query.filter_by(
        student_id=user_id,
        course_id=course_id
    ).first_or_404()
    
    # Dersleri ve ilerleme durumunu al
    lessons = Lesson.query.filter_by(course_id=course_id).order_by(Lesson.order).all()
    progress_records = {p.lesson_id: p for p in enrollment.progress}
    
    return jsonify({
        'course_title': enrollment.course.title,
        'total_progress': len([p for p in enrollment.progress if p.completed]) / len(lessons) * 100,
        'lessons': [{
            'id': lesson.id,
            'title': lesson.title,
            'order': lesson.order,
            'completed': progress_records.get(lesson.id, {}).completed or False,
            'completed_at': progress_records.get(lesson.id, {}).completed_at
        } for lesson in lessons]
    })

@enrollments.route('/lessons/<int:lesson_id>/complete', methods=['POST'])
@jwt_required()
def complete_lesson(lesson_id):
    user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    
    # Dersi bul
    lesson = Lesson.query.get_or_404(lesson_id)
    
    # Kayıt kontrolü
    enrollment = Enrollment.query.filter_by(
        student_id=user_id,
        course_id=lesson.course_id
    ).first_or_404()
    
    # İlerleme kaydını bul veya oluştur
    progress = Progress.query.filter_by(
        enrollment_id=enrollment.id,
        lesson_id=lesson_id
    ).first()
    
    if not progress:
        progress = Progress(
            enrollment_id=enrollment.id,
            lesson_id=lesson_id
        )
        db.session.add(progress)
    
    # Dersi tamamla
    progress.completed = True
    progress.completed_at = datetime.now(UTC)
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson marked as completed',
        'progress': {
            'lesson_id': lesson_id,
            'completed': True,
            'completed_at': progress.completed_at
        }
    })

@enrollments.route('/courses', methods=['GET'])
@jwt_required()
def get_enrolled_courses():
    user_id = get_jwt_identity()
    
    # Kullanıcının öğrenci olup olmadığını kontrol et
    if not is_student(user_id):
        return jsonify({'error': 'Only students can view enrolled courses'}), 403
    
    # Kullanıcının kayıtlı olduğu kursları al
    enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    
    # Kayıt yoksa boş liste döndür (404 yerine 200 durum koduyla)
    if not enrollments:
        return jsonify([]), 200
    
    # Kayıtlar varsa kurs bilgilerini döndür
    courses = []
    for enrollment in enrollments:
        course = Course.query.get(enrollment.course_id)
        if course:
            # Kursa ait derslerin sayısını ve tamamlananları bul
            lesson_count = Lesson.query.filter_by(course_id=course.id).count()
            completed_count = Progress.query.join(Lesson).filter(
                Progress.enrollment_id == enrollment.id,
                Progress.completed == True,
                Lesson.course_id == course.id
            ).count()
            
            # İlerleme yüzdesini hesapla
            progress_percentage = 0
            if lesson_count > 0:
                progress_percentage = int((completed_count / lesson_count) * 100)
            
            instructor = User.query.get(course.instructor_id)
            
            courses.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'image_url': course.image_url,
                'instructor_name': instructor.username if instructor else 'Unknown',
                'progress': progress_percentage,
                'enrolled_at': enrollment.enrolled_at.isoformat(),
                'last_activity_at': None  # Bu alan eklenebilir
            })
    
    return jsonify(courses)

@enrollments.route('/history', methods=['GET'])
@jwt_required()
def get_enrollment_history():
    """Öğrencinin tüm kayıt geçmişini döndürür"""
    user_id = get_jwt_identity()
    
    # Kullanıcının öğrenci olup olmadığını kontrol et
    if not is_student(user_id):
        return jsonify({'error': 'Only students can view enrollment history'}), 403
    
    # Kullanıcının kayıtlı olduğu kursları al
    enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    
    # Kayıt yoksa boş liste döndür
    if not enrollments:
        return jsonify([]), 200
    
    # Kayıt geçmişini hazırla
    history = []
    for enrollment in enrollments:
        course = Course.query.get(enrollment.course_id)
        if course:
            instructor = User.query.get(course.instructor_id)
            
            # Tüm dersleri ve tamamlanan dersleri say
            lesson_count = Lesson.query.filter_by(course_id=course.id).count()
            completed_count = Progress.query.join(Lesson).filter(
                Progress.enrollment_id == enrollment.id,
                Progress.completed == True,
                Lesson.course_id == course.id
            ).count()
            
            # Kursun durumunu belirle
            status = 'active'
            completed_at = None
            
            # Eğer tüm dersler tamamlanmışsa, kurs tamamlanmış demektir
            if lesson_count > 0 and completed_count == lesson_count:
                status = 'completed'
                # Son tamamlanan dersin tarihini bul
                last_progress = Progress.query.join(Lesson).filter(
                    Progress.enrollment_id == enrollment.id,
                    Progress.completed == True,
                    Lesson.course_id == course.id
                ).order_by(Progress.completed_at.desc()).first()
                
                if last_progress and last_progress.completed_at:
                    completed_at = last_progress.completed_at.isoformat()
            
            history.append({
                'id': enrollment.id,
                'course_id': course.id,
                'course_title': course.title,
                'instructor_name': instructor.username if instructor else 'Unknown',
                'enrolled_at': enrollment.enrolled_at.isoformat(),
                'status': status,
                'completed_at': completed_at,
                'certificate_id': None  # Sertifika özelliği henüz eklenmedi
            })
    
    return jsonify(history) 