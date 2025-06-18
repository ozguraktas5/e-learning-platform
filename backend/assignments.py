from flask import Blueprint, jsonify, request #flask modülünü import ediyoruz
from models import db, Assignment, AssignmentSubmission, Course, Enrollment, User, Lesson, Notification #models modülünü import ediyoruz
from sqlalchemy import desc, func #sqlalchemy modülünü import ediyoruz
import datetime #datetime modülünü import ediyoruz
from utils import login_required, instructor_required #utils modülünü import ediyoruz
from flask_jwt_extended import get_jwt #flask_jwt_extended modülünü import ediyoruz

assignments = Blueprint('assignments', __name__) #assignments modülünü oluşturuyoruz

@assignments.route('/instructor/assignments', methods=['GET']) #instructor/assignments rotasını tanımlıyoruz
@login_required #login_required decoratorını kullanıyoruz
@instructor_required #instructor_required decoratorını kullanıyoruz
def get_instructor_assignments(): #get_instructor_assignments fonksiyonunu tanımlıyoruz
    """
    Eğitmenin tüm kurslarında bulunan ödevleri getirir. 
    """
    instructor_id = request.user_id #instructor_id'yi alıyoruz
    
    # Eğitmenin kurslarını bul
    instructor_courses = Course.query.filter_by(instructor_id=instructor_id).all() #instructor_courses'u alıyoruz
    course_ids = [course.id for course in instructor_courses] #course_ids'yi alıyoruz

    if not course_ids: #course_ids'in boş olup olmadığını kontrol ediyoruz
        return jsonify([]) #course_ids'in boş olması durumunda boş bir liste döndürüyoruz
    
    # Kurslara ait tüm ödevleri bul
    assignments_list = []
    
    for course in instructor_courses: #instructor_courses'u döngüye sokuyoruz
        # Kursun tüm derslerini bul
        course_lessons = Lesson.query.filter_by(course_id=course.id).all() #course_lessons'u alıyoruz
        lesson_ids = [lesson.id for lesson in course_lessons] #lesson_ids'yi alıyoruz
        
        if not lesson_ids: #lesson_ids'in boş olup olmadığını kontrol ediyoruz
            continue #lesson_ids'in boş olması durumunda döngüyü devam ettiriyoruz
            
        # Bu derslere ait tüm ödevleri bul
        course_assignments = Assignment.query.filter(Assignment.lesson_id.in_(lesson_ids)).all() #course_assignments'u alıyoruz
        
        for assignment in course_assignments: #course_assignments'u döngüye sokuyoruz
            # Ders bilgisini al
            lesson = Lesson.query.get(assignment.lesson_id) #lesson'u alıyoruz
            
            # Her ödev için submission sayısını bul
            submissions_count = AssignmentSubmission.query.filter_by(assignment_id=assignment.id).count() #submissions_count'u alıyoruz
            
            # Değerlendirilen submission sayısını bul
            graded_count = AssignmentSubmission.query.filter( #graded_count'u alıyoruz
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.graded_at.isnot(None)
            ).count() 
            
            # Ödevin durumunu belirle
            now = datetime.datetime.utcnow() #now'u alıyoruz
            status = 'active' #status'u alıyoruz
            
            if assignment.due_date and assignment.due_date < now: #assignment.due_date'in boş olup olmadığını kontrol ediyoruz
                status = 'expired' #status'u alıyoruz
            elif not assignment.is_published: #assignment.is_published'in boş olup olmadığını kontrol ediyoruz
                status = 'draft' #status'u alıyoruz
            
            assignments_list.append({ #assignments_list'e ekle
                'id': assignment.id, #assignment.id'yi alıyoruz
                'title': assignment.title, #assignment.title'yi alıyoruz
                'description': assignment.description, #assignment.description'yi alıyoruz
                'course_id': course.id, #course_id'yi alıyoruz
                'course_title': course.title, #course_title'yi alıyoruz
                'lesson_id': assignment.lesson_id, #lesson_id'yi alıyoruz
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None, #due_date'yi alıyoruz
                'created_at': assignment.created_at.isoformat(), #created_at'yi alıyoruz
                'status': status, #status'u alıyoruz
                'max_points': assignment.max_points, #max_points'yi alıyoruz
                'submissions_count': submissions_count, #submissions_count'yi alıyoruz
                'graded_count': graded_count #graded_count'yi alıyoruz
            })
    
    # Tarihe göre sırala
    sorted_assignments = sorted(assignments_list, key=lambda x: x['due_date'] if x['due_date'] else '9999-12-31', reverse=True) #sorted_assignments'u alıyoruz
    
    return jsonify(sorted_assignments) #sorted_assignments'i döndürüyoruz

@assignments.route('/instructor/assignments/stats', methods=['GET']) #instructor/assignments/stats rotasını tanımlıyoruz
@login_required #login_required decoratorını kullanıyoruz
@instructor_required #instructor_required decoratorını kullanıyoruz
def get_assignment_stats(): #get_assignment_stats fonksiyonunu tanımlıyoruz
    """
    Eğitmenin ödevleriyle ilgili istatistikleri getirir.
    """
    instructor_id = request.user_id #instructor_id'yi alıyoruz
    
    # Eğitmenin kurslarını bul
    instructor_courses = Course.query.filter_by(instructor_id=instructor_id).all() #instructor_courses'u alıyoruz
    course_ids = [course.id for course in instructor_courses] #course_ids'yi alıyoruz
    
    if not course_ids: #course_ids'in boş olup olmadığını kontrol ediyoruz
        return jsonify({ #course_ids'in boş olması durumunda boş bir liste döndürüyoruz
            'total': 0,
            'active': 0,
            'pending_review': 0,
            'average_score': 0
        }) 
    
    # Kurs derslerini bul
    lesson_ids = []
    for course in instructor_courses: #instructor_courses'u döngüye sokuyoruz
        lessons = Lesson.query.filter_by(course_id=course.id).all() #lessons'u alıyoruz
        lesson_ids.extend([lesson.id for lesson in lessons]) #lesson_ids'yi alıyoruz
    
    if not lesson_ids: #lesson_ids'in boş olup olmadığını kontrol ediyoruz
        return jsonify({ #lesson_ids'in boş olması durumunda boş bir liste döndürüyoruz
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
    if assignment_ids: #assignment_ids'in boş olup olmadığını kontrol ediyoruz
        pending_reviews = AssignmentSubmission.query.filter(
            AssignmentSubmission.assignment_id.in_(assignment_ids),
            AssignmentSubmission.graded_at.is_(None)
        ).count()
    
    # Ortalama puan
    average_score = 0
    if assignment_ids: #assignment_ids'in boş olup olmadığını kontrol ediyoruz
        avg_score_query = db.session.query(func.avg(AssignmentSubmission.grade)).filter(
            AssignmentSubmission.assignment_id.in_(assignment_ids),
            AssignmentSubmission.grade.isnot(None)
        ).scalar()
        
        average_score = round((avg_score_query or 0) * 100) / 100 #average_score'u alıyoruz
    
    return jsonify({ #total_assignments'u alıyoruz
        'total': total_assignments, #total_assignments'u alıyoruz
        'active': active_assignments, #active_assignments'u alıyoruz
        'pending_review': pending_reviews, #pending_reviews'u alıyoruz
        'average_score': average_score #average_score'u alıyoruz
    })

@assignments.route('/instructor/assignments/create', methods=['GET', 'POST']) #instructor/assignments/create rotasını tanımlıyoruz
@login_required #login_required decoratorını kullanıyoruz
@instructor_required #instructor_required decoratorını kullanıyoruz
def create_assignment(): #create_assignment fonksiyonunu tanımlıyoruz
    """
    GET: Ödev oluşturma bilgilerini getirir
    POST: Yeni bir ödev oluşturur
    """
    instructor_id = request.user_id #instructor_id'yi alıyoruz
    
    # GET isteği - ödev oluşturma için gerekli verileri döndür
    if request.method == 'GET':
        # Eğitmenin kurslarını ve derslerini getir
        instructor_courses = Course.query.filter_by(instructor_id=instructor_id).all() #instructor_courses'u alıyoruz
        
        courses_with_lessons = [] #courses_with_lessons'u alıyoruz
        for course in instructor_courses: #instructor_courses'u döngüye sokuyoruz
            course_lessons = Lesson.query.filter_by(course_id=course.id).all() #course_lessons'u alıyoruz
            courses_with_lessons.append({ #courses_with_lessons'e ekle
                'id': course.id, #course_id'yi alıyoruz
                'title': course.title, #course_title'yi alıyoruz
                'lessons': [{
                    'id': lesson.id, #lesson_id'yi alıyoruz
                    'title': lesson.title #lesson_title'yi alıyoruz
                } for lesson in course_lessons]
            })
        
        return jsonify({ #courses_with_lessons'u alıyoruz
            'courses': courses_with_lessons #courses_with_lessons'u alıyoruz
        })

    # POST isteği - yeni ödev oluştur
    data = request.get_json() #data'yı alıyoruz
     
    if not data: #data'nın boş olup olmadığını kontrol ediyoruz
        return jsonify({"error": "No data provided"}), 400
    
    required_fields = ['title', 'description', 'lesson_id', 'due_date', 'max_points'] #required_fields'u alıyoruz
    missing_fields = [field for field in required_fields if field not in data] #missing_fields'u alıyoruz
    
    if missing_fields: #missing_fields'in boş olup olmadığını kontrol ediyoruz
        return jsonify({ #missing_fields'in boş olması durumunda boş bir liste döndürüyoruz
            "error": "Missing required fields", #missing_fields'in boş olması durumunda boş bir liste döndürüyoruz
            "missing_fields": missing_fields #missing_fields'in boş olması durumunda boş bir liste döndürüyoruz
        }), 400
    
    # Dersin eğitmene ait olup olmadığını kontrol et
    lesson = Lesson.query.get(data['lesson_id']) #lesson'u alıyoruz
    if not lesson: #lesson'un boş olup olmadığını kontrol ediyoruz
        return jsonify({"error": "Lesson not found"}), 404 #lesson'un boş olması durumunda boş bir liste döndürüyoruz
    
    # Dersin ait olduğu kursu kontrol et
    course = Course.query.get(lesson.course_id) #course'u alıyoruz
    if not course or course.instructor_id != int(instructor_id): #course'un boş olup olmadığını kontrol ediyoruz
        return jsonify({"error": "You don't have permission to create an assignment for this lesson"}), 403 #course'un boş olması durumunda boş bir liste döndürüyoruz
    
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
        
        db.session.add(new_assignment) #new_assignment'i ekle
        db.session.commit() #commit işlemi yap
        
        # Dersin ait olduğu kursa kayıtlı öğrencilere bildirim gönder
        enrollments = Enrollment.query.filter_by(course_id=course.id).all() #enrollments'u alıyoruz
        for enrollment in enrollments: #enrollments'u döngüye sokuyoruz
            notification = Notification( #notification'u alıyoruz
                user_id=enrollment.student_id, #user_id'yi alıyoruz
                course_id=course.id, #course_id'yi alıyoruz
                type='new_assignment', #type'yi alıyoruz
                title='Yeni Ödev', #title'yi alıyoruz
                message=f'"{course.title}" dersinde yeni bir ödev yayınlandı: {new_assignment.title}', #message'yi alıyoruz
                reference_id=new_assignment.id #reference_id'yi alıyoruz
            )
            db.session.add(notification) #notification'i ekle
        
        db.session.commit() #commit işlemi yap
        
        return jsonify({ #new_assignment'u alıyoruz
            "message": "Assignment created successfully", #message'yi alıyoruz
            "assignment": {
                "id": new_assignment.id, #new_assignment.id'yi alıyoruz
                "title": new_assignment.title, #new_assignment.title'yi alıyoruz
                "description": new_assignment.description, #new_assignment.description'yi alıyoruz
                "lesson_id": new_assignment.lesson_id, #new_assignment.lesson_id'yi alıyoruz
                "course_id": course.id, #course_id'yi alıyoruz
                "course_title": course.title, #course_title'yi alıyoruz
                "due_date": new_assignment.due_date.isoformat(), #due_date'yi alıyoruz
                "max_points": new_assignment.max_points, #max_points'yi alıyoruz
                "created_at": new_assignment.created_at.isoformat(), #created_at'yi alıyoruz
                "is_published": new_assignment.is_published #is_published'yi alıyoruz
            }
        }), 201
    except Exception as e: #hata durumunda
        db.session.rollback() #rollback işlemi yap
        return jsonify({"error": f"Error creating assignment: {str(e)}"}), 500 #hata durumunda boş bir liste döndürüyoruz

@assignments.route('/courses/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>', methods=['PUT']) #courses/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id> rotasını tanımlıyoruz
@login_required #login_required decoratorını kullanıyoruz
@instructor_required #instructor_required decoratorını kullanıyoruz
def update_assignment(course_id, lesson_id, assignment_id): #update_assignment fonksiyonunu tanımlıyoruz
    """
    Bir ödevi günceller
    """
    try:
        instructor_id = request.user_id #instructor_id'yi alıyoruz
        
        # Kursun eğitmene ait olduğunu kontrol et
        course = Course.query.get_or_404(course_id) #course'u alıyoruz
        
        if int(course.instructor_id) != int(instructor_id): #course.instructor_id'in eğitmenin id'siyle eşleşip eşleşmediğini kontrol ediyoruz
            return jsonify({"error": "Bu kursu düzenleme yetkiniz yok"}), 403 #course.instructor_id'in eğitmenin id'siyle eşleşmediği durumda boş bir liste döndürüyoruz
        
        # Dersin kursa ait olduğunu kontrol et
        lesson = Lesson.query.get_or_404(lesson_id) #lesson'u alıyoruz
        if lesson.course_id != course_id: #lesson.course_id'in course_id'ye eşit olup olmadığını kontrol ediyoruz
            return jsonify({"error": "Bu ders bu kursa ait değil"}), 400 #lesson.course_id'in course_id'ye eşit olmadığı durumda boş bir liste döndürüyoruz
        
        # Ödevin derse ait olduğunu kontrol et
        assignment = Assignment.query.get_or_404(assignment_id) #assignment'u alıyoruz
        if assignment.lesson_id != lesson_id: #assignment.lesson_id'in lesson_id'ye eşit olup olmadığını kontrol ediyoruz
            return jsonify({"error": "Bu ödev bu derse ait değil"}), 400 #assignment.lesson_id'in lesson_id'ye eşit olmadığı durumda boş bir liste döndürüyoruz
        
        data = request.get_json() #data'yı alıyoruz
        
        if not data: #data'nın boş olup olmadığını kontrol ediyoruz
            return jsonify({"error": "No data provided"}), 400 #data'nın boş olması durumunda boş bir liste döndürüyoruz
        
        # Güncelleme işlemi
        if 'title' in data: #title'in boş olup olmadığını kontrol ediyoruz
            assignment.title = data['title'] #assignment.title'i güncelliyoruz
        if 'description' in data: #description'in boş olup olmadığını kontrol ediyoruz
            assignment.description = data['description'] #assignment.description'i güncelliyoruz
        if 'due_date' in data: #due_date'in boş olup olmadığını kontrol ediyoruz
            try:
                assignment.due_date = datetime.datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')) #assignment.due_date'i güncelliyoruz
            except Exception as e: #hata durumunda
                return jsonify({"error": f"Geçersiz tarih formatı: {str(e)}"}), 400 #hata durumunda boş bir liste döndürüyoruz
        if 'max_points' in data: #max_points'in boş olup olmadığını kontrol ediyoruz
            assignment.max_points = data['max_points'] #assignment.max_points'i güncelliyoruz
        if 'is_published' in data: #is_published'in boş olup olmadığını kontrol ediyoruz
            assignment.is_published = data['is_published'] #assignment.is_published'i güncelliyoruz
        
        try:
            db.session.commit() #commit işlemi yap
            response_data = { #response_data'u alıyoruz
                'id': assignment.id, #assignment.id'yi alıyoruz
                'title': assignment.title, #assignment.title'yi alıyoruz
                'description': assignment.description, #assignment.description'yi alıyoruz
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None, #due_date'yi alıyoruz
                'max_points': assignment.max_points, #assignment.max_points'yi alıyoruz
                'created_at': assignment.created_at.isoformat() if assignment.created_at else None, #created_at'yi alıyoruz
                'updated_at': assignment.updated_at.isoformat() if assignment.updated_at else None, #updated_at'yi alıyoruz
                'lesson_id': assignment.lesson_id, #lesson_id'yi alıyoruz
                'course_id': course_id, #course_id'yi alıyoruz
                'course_title': course.title, #course_title'yi alıyoruz
                'status': 'draft' if not assignment.is_published else 'active' if assignment.due_date > datetime.datetime.utcnow() else 'expired' #status'yi alıyoruz
            }
            return jsonify(response_data) #response_data'yı döndürüyoruz
        except Exception as e: #hata durumunda
            db.session.rollback() #rollback işlemi yap
            return jsonify({"error": "Ödev güncellenirken bir hata oluştu", "details": str(e)}), 500 #hata durumunda boş bir liste döndürüyoruz
            
    except Exception as e: #hata durumunda
        return jsonify({"error": "Beklenmeyen bir hata oluştu", "details": str(e)}), 500 #hata durumunda boş bir liste döndürüyoruz