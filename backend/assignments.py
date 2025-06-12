from flask import Blueprint, jsonify, request
from models import db, Assignment, AssignmentSubmission, Course, Enrollment, User, Lesson, Notification
from sqlalchemy import desc, func
import datetime
from utils import login_required, instructor_required
from flask_jwt_extended import get_jwt

assignments = Blueprint('assignments', __name__)

@assignments.route('/instructor/assignments', methods=['GET'])
@login_required
@instructor_required
def get_instructor_assignments():
    """
    Eğitmenin tüm kurslarında bulunan ödevleri getirir.
    """
    instructor_id = request.user_id
    
    # Eğitmenin kurslarını bul
    instructor_courses = Course.query.filter_by(instructor_id=instructor_id).all()
    course_ids = [course.id for course in instructor_courses]

    if not course_ids:
        return jsonify([])
    
    # Kurslara ait tüm ödevleri bul
    assignments_list = []
    
    for course in instructor_courses:
        # Kursun tüm derslerini bul
        course_lessons = Lesson.query.filter_by(course_id=course.id).all()
        lesson_ids = [lesson.id for lesson in course_lessons]
        
        if not lesson_ids:
            continue
            
        # Bu derslere ait tüm ödevleri bul
        course_assignments = Assignment.query.filter(Assignment.lesson_id.in_(lesson_ids)).all()
        
        for assignment in course_assignments:
            # Ders bilgisini al
            lesson = Lesson.query.get(assignment.lesson_id)
            
            # Her ödev için submission sayısını bul
            submissions_count = AssignmentSubmission.query.filter_by(assignment_id=assignment.id).count()
            
            # Değerlendirilen submission sayısını bul
            graded_count = AssignmentSubmission.query.filter(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.graded_at.isnot(None)
            ).count()
            
            # Ödevin durumunu belirle
            now = datetime.datetime.utcnow()
            status = 'active'
            
            if assignment.due_date and assignment.due_date < now:
                status = 'expired'
            elif not assignment.is_published:
                status = 'draft'
            
            assignments_list.append({
                'id': assignment.id,
                'title': assignment.title,
                'description': assignment.description,
                'course_id': course.id,
                'course_title': course.title,
                'lesson_id': assignment.lesson_id,
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                'created_at': assignment.created_at.isoformat(),
                'status': status,
                'max_points': assignment.max_points,
                'submissions_count': submissions_count,
                'graded_count': graded_count
            })
    
    # Tarihe göre sırala
    sorted_assignments = sorted(assignments_list, key=lambda x: x['due_date'] if x['due_date'] else '9999-12-31', reverse=True)
    
    return jsonify(sorted_assignments)

@assignments.route('/instructor/assignments/stats', methods=['GET'])
@login_required
@instructor_required
def get_assignment_stats():
    """
    Eğitmenin ödevleriyle ilgili istatistikleri getirir.
    """
    instructor_id = request.user_id
    
    # Eğitmenin kurslarını bul
    instructor_courses = Course.query.filter_by(instructor_id=instructor_id).all()
    course_ids = [course.id for course in instructor_courses]
    
    if not course_ids:
        return jsonify({
            'total': 0,
            'active': 0,
            'pending_review': 0,
            'average_score': 0
        })
    
    # Kurs derslerini bul
    lesson_ids = []
    for course in instructor_courses:
        lessons = Lesson.query.filter_by(course_id=course.id).all()
        lesson_ids.extend([lesson.id for lesson in lessons])
    
    if not lesson_ids:
        return jsonify({
            'total': 0,
            'active': 0,
            'pending_review': 0,
            'average_score': 0
        })
    
    # Toplam ödev sayısı
    total_assignments = Assignment.query.filter(Assignment.lesson_id.in_(lesson_ids)).count()
    
    # Aktif ödev sayısı
    now = datetime.datetime.utcnow()
    active_assignments = Assignment.query.filter(
        Assignment.lesson_id.in_(lesson_ids),
        Assignment.is_published == True,
        (Assignment.due_date.is_(None) | (Assignment.due_date > now))
    ).count()
    
    # Tüm assignment ID'lerini al
    assignments = Assignment.query.filter(Assignment.lesson_id.in_(lesson_ids)).all()
    assignment_ids = [assignment.id for assignment in assignments]
    
    # Değerlendirme bekleyen teslimler
    pending_reviews = 0
    if assignment_ids:
        pending_reviews = AssignmentSubmission.query.filter(
            AssignmentSubmission.assignment_id.in_(assignment_ids),
            AssignmentSubmission.graded_at.is_(None)
        ).count()
    
    # Ortalama puan
    average_score = 0
    if assignment_ids:
        avg_score_query = db.session.query(func.avg(AssignmentSubmission.grade)).filter(
            AssignmentSubmission.assignment_id.in_(assignment_ids),
            AssignmentSubmission.grade.isnot(None)
        ).scalar()
        
        average_score = round((avg_score_query or 0) * 100) / 100
    
    return jsonify({
        'total': total_assignments,
        'active': active_assignments,
        'pending_review': pending_reviews,
        'average_score': average_score
    })

@assignments.route('/instructor/assignments/create', methods=['GET', 'POST'])
@login_required
@instructor_required
def create_assignment():
    """
    GET: Ödev oluşturma bilgilerini getirir
    POST: Yeni bir ödev oluşturur
    """
    instructor_id = request.user_id
    
    # GET isteği - ödev oluşturma için gerekli verileri döndür
    if request.method == 'GET':
        # Eğitmenin kurslarını ve derslerini getir
        instructor_courses = Course.query.filter_by(instructor_id=instructor_id).all()
        
        courses_with_lessons = []
        for course in instructor_courses:
            course_lessons = Lesson.query.filter_by(course_id=course.id).all()
            courses_with_lessons.append({
                'id': course.id,
                'title': course.title,
                'lessons': [{
                    'id': lesson.id,
                    'title': lesson.title
                } for lesson in course_lessons]
            })
        
        return jsonify({
            'courses': courses_with_lessons
        })
    
    # POST isteği - yeni ödev oluştur
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    required_fields = ['title', 'description', 'lesson_id', 'due_date', 'max_points']
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({
            "error": "Missing required fields",
            "missing_fields": missing_fields
        }), 400
    
    # Dersin eğitmene ait olup olmadığını kontrol et
    lesson = Lesson.query.get(data['lesson_id'])
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404
    
    # Dersin ait olduğu kursu kontrol et
    course = Course.query.get(lesson.course_id)
    if not course or course.instructor_id != int(instructor_id):
        return jsonify({"error": "You don't have permission to create an assignment for this lesson"}), 403
    
    try:
        # Due date'i datetime objesine çevir
        due_date = datetime.datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        
        # Ödev oluştur
        new_assignment = Assignment(
            title=data['title'],
            description=data['description'],
            lesson_id=data['lesson_id'],
            due_date=due_date,
            max_points=data['max_points'],
            is_published=data.get('is_published', True)
        )
        
        db.session.add(new_assignment)
        db.session.commit()
        
        # Dersin ait olduğu kursa kayıtlı öğrencilere bildirim gönder
        enrollments = Enrollment.query.filter_by(course_id=course.id).all()
        for enrollment in enrollments:
            notification = Notification(
                user_id=enrollment.student_id,
                course_id=course.id,
                type='new_assignment',
                title='Yeni Ödev',
                message=f'"{course.title}" dersinde yeni bir ödev yayınlandı: {new_assignment.title}',
                reference_id=new_assignment.id
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            "message": "Assignment created successfully",
            "assignment": {
                "id": new_assignment.id,
                "title": new_assignment.title,
                "description": new_assignment.description,
                "lesson_id": new_assignment.lesson_id,
                "course_id": course.id,
                "course_title": course.title,
                "due_date": new_assignment.due_date.isoformat(),
                "max_points": new_assignment.max_points,
                "created_at": new_assignment.created_at.isoformat(),
                "is_published": new_assignment.is_published
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error creating assignment: {str(e)}"}), 500 

@assignments.route('/courses/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>', methods=['PUT'])
@login_required
@instructor_required
def update_assignment(course_id, lesson_id, assignment_id):
    """
    Bir ödevi günceller
    """
    try:
        instructor_id = request.user_id
        
        # Kursun eğitmene ait olduğunu kontrol et
        course = Course.query.get_or_404(course_id)
        
        if int(course.instructor_id) != int(instructor_id):
            return jsonify({"error": "Bu kursu düzenleme yetkiniz yok"}), 403
        
        # Dersin kursa ait olduğunu kontrol et
        lesson = Lesson.query.get_or_404(lesson_id)
        if lesson.course_id != course_id:
            return jsonify({"error": "Bu ders bu kursa ait değil"}), 400
        
        # Ödevin derse ait olduğunu kontrol et
        assignment = Assignment.query.get_or_404(assignment_id)
        if assignment.lesson_id != lesson_id:
            return jsonify({"error": "Bu ödev bu derse ait değil"}), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Güncelleme işlemi
        if 'title' in data:
            assignment.title = data['title']
        if 'description' in data:
            assignment.description = data['description']
        if 'due_date' in data:
            try:
                assignment.due_date = datetime.datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except Exception as e:
                return jsonify({"error": f"Geçersiz tarih formatı: {str(e)}"}), 400
        if 'max_points' in data:
            assignment.max_points = data['max_points']
        if 'is_published' in data:
            assignment.is_published = data['is_published']
        
        try:
            db.session.commit()
            response_data = {
                'id': assignment.id,
                'title': assignment.title,
                'description': assignment.description,
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                'max_points': assignment.max_points,
                'created_at': assignment.created_at.isoformat() if assignment.created_at else None,
                'updated_at': assignment.updated_at.isoformat() if assignment.updated_at else None,
                'lesson_id': assignment.lesson_id,
                'course_id': course_id,
                'course_title': course.title,
                'status': 'draft' if not assignment.is_published else 'active' if assignment.due_date > datetime.datetime.utcnow() else 'expired'
            }
            return jsonify(response_data)
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Ödev güncellenirken bir hata oluştu", "details": str(e)}), 500
            
    except Exception as e:
        return jsonify({"error": "Beklenmeyen bir hata oluştu", "details": str(e)}), 500 