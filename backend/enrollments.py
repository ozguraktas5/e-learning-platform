from flask import Blueprint, jsonify, request # Flask'ın Blueprint ve jsonify fonksiyonlarını import ediyoruz.
from flask_jwt_extended import jwt_required, get_jwt_identity 
from flask_cors import CORS # Flask-CORS'u import ediyoruz.
from models import db, Course, Enrollment, Progress, Lesson, User, Assignment, AssignmentSubmission
from datetime import datetime, UTC, timedelta # datetime modülünü import ediyoruz.

enrollments = Blueprint('enrollments', __name__) # Enrollments blueprint'ini oluşturuyoruz.
CORS(enrollments, resources={ # CORS'u ayarlıyoruz.
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

def is_student(user_id): # Kullanıcının öğrenci olup olmadığını kontrol et
    user = User.query.get(user_id) # Kullanıcıyı buluyoruz.
    return user and user.role == 'student'

def is_instructor(user_id): # Kullanıcının eğitmen olup olmadığını kontrol et
    user = User.query.get(user_id) # Kullanıcıyı buluyoruz.
    return user and user.role == 'instructor'

@enrollments.route('/courses/<int:course_id>/enroll', methods=['POST']) # Kursa kayıt ol
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def enroll_course(course_id): # Kursa kayıt ol
    user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
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

@enrollments.route('/my-courses', methods=['GET']) # Öğrencinin kayıtlı olduğu kursları al
@jwt_required()
def get_my_courses(): # Öğrencinin kayıtlı olduğu kursları al
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

@enrollments.route('/courses/<int:course_id>/progress', methods=['GET']) # Kursun ilerleme durumunu al
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_course_progress(course_id): # Kursun ilerleme durumunu al
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

@enrollments.route('/lessons/<int:lesson_id>/complete', methods=['POST']) # Dersi tamamla
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def complete_lesson(lesson_id): # Dersi tamamla
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

@enrollments.route('/courses', methods=['GET']) # Öğrencinin kayıtlı olduğu kursları al
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_enrolled_courses(): # Öğrencinin kayıtlı olduğu kursları al
    user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    
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

@enrollments.route('/history', methods=['GET']) # Öğrencinin tüm kayıt geçmişini döndürür
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_enrollment_history(): # Öğrencinin tüm kayıt geçmişini döndürür
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

@enrollments.route('/instructor/students', methods=['GET']) # Eğitmenin öğrencilerini döndürür
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_instructor_students(): # Eğitmenin öğrencilerini döndürür
    """Eğitmenin öğrencilerini döndürür"""
    user_id = get_jwt_identity()
    
    # Kullanıcının eğitmen olup olmadığını kontrol et
    if not is_instructor(user_id):
        return jsonify({'error': 'Only instructors can view their students'}), 403
    
    # Eğitmenin kurslarını al
    instructor_courses = Course.query.filter_by(instructor_id=user_id).all()
    if not instructor_courses:
        return jsonify([]), 200
    
    course_ids = [course.id for course in instructor_courses]
    
    # Bu kurslara kayıtlı öğrencileri al
    students_data = []
    enrollments = Enrollment.query.filter(Enrollment.course_id.in_(course_ids)).all()
    
    for enrollment in enrollments:
        student = User.query.get(enrollment.student_id)
        course = Course.query.get(enrollment.course_id)
        
        if not student or not course:
            continue
        
        # Öğrencinin kurs ilerlemesini hesapla
        lesson_count = Lesson.query.filter_by(course_id=course.id).count()
        completed_count = Progress.query.join(Lesson).filter(
            Progress.enrollment_id == enrollment.id,
            Progress.completed == True,
            Lesson.course_id == course.id
        ).count()
        
        progress_percentage = 0
        if lesson_count > 0:
            progress_percentage = int((completed_count / lesson_count) * 100)
        
        completed = lesson_count > 0 and completed_count == lesson_count
        
        # Son aktivite tarihini bul
        last_activity = Progress.query.join(Lesson).filter(
            Progress.enrollment_id == enrollment.id,
            Lesson.course_id == course.id
        ).order_by(Progress.completed_at.desc()).first()
        
        last_activity_at = None
        if last_activity and last_activity.completed_at:
            last_activity_at = last_activity.completed_at.isoformat()
        else:
            last_activity_at = enrollment.enrolled_at.isoformat()
        
        students_data.append({
            'id': enrollment.id,
            'student': {
                'id': student.id,
                'name': student.username,  # veya full_name alan varsa
                'email': student.email,
                'avatar': student.profile_image if hasattr(student, 'profile_image') else None
            },
            'course': {
                'id': course.id,
                'title': course.title
            },
            'enrolled_at': enrollment.enrolled_at.isoformat(),
            'progress': progress_percentage,
            'last_activity_at': last_activity_at,
            'completed': completed
        })
    
    return jsonify(students_data)

@enrollments.route('/instructor/student-stats', methods=['GET']) # Eğitmenin öğrenci istatistiklerini döndürür
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_instructor_student_stats(): # Eğitmenin öğrenci istatistiklerini döndürür
    """Eğitmenin öğrenci istatistiklerini döndürür"""
    user_id = get_jwt_identity()
    
    # Kullanıcının eğitmen olup olmadığını kontrol et
    if not is_instructor(user_id):
        return jsonify({'error': 'Only instructors can view student statistics'}), 403
    
    # Eğitmenin kurslarını al
    instructor_courses = Course.query.filter_by(instructor_id=user_id).all()
    if not instructor_courses:
        return jsonify({
            'total_students': 0,
            'active_students': 0,
            'completions_this_month': 0,
            'average_course_completion': 0
        }), 200
    
    course_ids = [course.id for course in instructor_courses]
    
    # Bu kurslara kayıtlı öğrencileri al
    enrollments = Enrollment.query.filter(Enrollment.course_id.in_(course_ids)).all()
    
    total_students = len(set(enrollment.student_id for enrollment in enrollments))
    
    # Son 2 hafta içinde aktif olan öğrencileri hesapla
    two_weeks_ago = datetime.utcnow() - timedelta(days=14)
    active_student_ids = set()
    
    for enrollment in enrollments:
        # Son aktivite
        last_activity = Progress.query.join(Lesson).filter(
            Progress.enrollment_id == enrollment.id,
            Lesson.course_id.in_(course_ids),
            Progress.completed_at >= two_weeks_ago
        ).order_by(Progress.completed_at.desc()).first()
        
        if last_activity:
            active_student_ids.add(enrollment.student_id)
    
    active_students = len(active_student_ids)
    
    # Bu ay tamamlanan kurs sayısı
    this_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    completions_this_month = 0
    
    # Kurs tamamlama oranları
    completion_rates = []
    
    for course_id in course_ids:
        lessons = Lesson.query.filter_by(course_id=course_id).all()
        lesson_count = len(lessons)
        
        if lesson_count == 0:
            continue
        
        course_enrollments = Enrollment.query.filter_by(course_id=course_id).all()
        
        for enrollment in course_enrollments:
            completed_count = Progress.query.join(Lesson).filter(
                Progress.enrollment_id == enrollment.id,
                Progress.completed == True,
                Lesson.course_id == course_id
            ).count()
            
            # Kurs tamamlama oranı
            completion_rate = (completed_count / lesson_count) * 100
            completion_rates.append(completion_rate)
            
            # Bu ay tamamlanan kursları kontrol et
            if completed_count == lesson_count:
                last_completed = Progress.query.join(Lesson).filter(
                    Progress.enrollment_id == enrollment.id,
                    Progress.completed == True,
                    Lesson.course_id == course_id
                ).order_by(Progress.completed_at.desc()).first()
                
                if last_completed and last_completed.completed_at and last_completed.completed_at >= this_month_start:
                    completions_this_month += 1
    
    # Ortalama tamamlama oranı
    average_completion = 0
    if completion_rates:
        average_completion = int(sum(completion_rates) / len(completion_rates))
    
    return jsonify({
        'total_students': total_students,
        'active_students': active_students,
        'completions_this_month': completions_this_month,
        'average_course_completion': average_completion
    })

@enrollments.route('/instructor/students/<int:student_id>/progress', methods=['GET']) # Belirli bir öğrencinin tüm kurslarındaki ilerleme detaylarını döndürür
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_student_progress(student_id): # Belirli bir öğrencinin tüm kurslarındaki ilerleme detaylarını döndürür
    """Belirli bir öğrencinin tüm kurslarındaki ilerleme detaylarını döndürür"""
    user_id = get_jwt_identity()
    
    # Kullanıcının eğitmen olup olmadığını kontrol et
    if not is_instructor(user_id):
        return jsonify({'error': 'Only instructors can view student progress'}), 403
    
    # Öğrenciyi bul
    student = User.query.get_or_404(student_id)
    if student.role != 'student':
        return jsonify({'error': 'User is not a student'}), 400
    
    # Eğitmenin kurslarını al
    instructor_courses = Course.query.filter_by(instructor_id=user_id).all()
    if not instructor_courses:
        return jsonify({'error': 'No courses found for instructor'}), 404
    
    course_ids = [course.id for course in instructor_courses]
    
    # Öğrencinin bu kurslara kayıtlarını bul
    enrollments = Enrollment.query.filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id.in_(course_ids)
    ).all()
    
    if not enrollments:
        return jsonify({'error': 'Student is not enrolled in any of your courses'}), 404
    
    # Öğrenci bilgilerini ve kurs ilerlemelerini hazırla
    courses_progress = []
    for enrollment in enrollments:
        course = Course.query.get(enrollment.course_id)
        
        # Kurs derslerini ve ödevlerini al
        lessons = Lesson.query.filter_by(course_id=course.id).all()
        assignments = Assignment.query.join(Lesson).filter(Lesson.course_id == course.id).all()
        
        # Tamamlanan dersleri say
        completed_lessons = Progress.query.join(Lesson).filter(
            Progress.enrollment_id == enrollment.id,
            Progress.completed == True,
            Lesson.course_id == course.id
        ).count()
        
        # Tamamlanan ödevleri ve ortalama notu hesapla
        completed_assignments = 0
        total_grade = 0
        graded_count = 0
        
        for assignment in assignments:
            submission = AssignmentSubmission.query.filter_by(
                assignment_id=assignment.id,
                user_id=student_id
            ).first()
            
            if submission and submission.submitted_at:
                completed_assignments += 1
                if submission.grade is not None:
                    total_grade += submission.grade
                    graded_count += 1
        
        # Son aktivite tarihini bul
        last_activity = Progress.query.join(Lesson).filter(
            Progress.enrollment_id == enrollment.id,
            Lesson.course_id == course.id
        ).order_by(Progress.completed_at.desc()).first()
        
        last_activity_at = None
        if last_activity and last_activity.completed_at:
            last_activity_at = last_activity.completed_at.isoformat()
        else:
            last_activity_at = enrollment.enrolled_at.isoformat()
        
        courses_progress.append({
            'id': course.id,
            'title': course.title,
            'progress': int((completed_lessons / len(lessons) * 100) if lessons else 0),
            'completed_lessons': completed_lessons,
            'total_lessons': len(lessons),
            'last_activity': last_activity_at,
            'completed_assignments': completed_assignments,
            'total_assignments': len(assignments),
            'average_grade': round(total_grade / graded_count if graded_count > 0 else 0, 2)
        })
    
    return jsonify({
        'id': student.id,
        'name': student.username,
        'email': student.email,
        'avatar': student.profile_image if hasattr(student, 'profile_image') else None,
        'courses': courses_progress
    }) 