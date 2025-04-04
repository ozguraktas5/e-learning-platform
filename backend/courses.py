from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Course, Lesson, User, Enrollment, Review, Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer, Assignment, AssignmentSubmission, LessonDocument, Notification
from sqlalchemy import or_
from datetime import datetime, timedelta, UTC
from utils import upload_video_to_gcs, upload_document_to_gcs, upload_file_to_gcs
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

courses = Blueprint('courses', __name__)

def is_instructor(user_id): # Kullanıcının eğitmen olup olmadığını kontrol et
    user = User.query.get(user_id)
    return user and user.role == 'instructor'

@courses.route('/', methods=['POST'])  # /courses yerine / kullanıyoruz çünkü prefix zaten /api/courses
@jwt_required()
def create_course():
    # Kullanıcının eğitmen olup olmadığını kontrol et
    user_id = get_jwt_identity()
    if not is_instructor(user_id):
        return jsonify({'error': 'Only instructors can create courses'}), 403

    data = request.get_json()
    
    # Gerekli alanları kontrol et
    if not all(k in data for k in ['title', 'description']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Yeni kurs oluştur
    course = Course(
        title=data['title'],
        description=data['description'],
        instructor_id=user_id
    )
    
    db.session.add(course) # Kursu veritabanına ekliyoruz.
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({
        'message': 'Course created successfully',
        'course': {
            'id': course.id,
            'title': course.title,
            'description': course.description
        }
    }), 201

@courses.route('/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu kursu güncelleme yetkiniz yok'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Güncelleme için veri gerekli'}), 400
        
        # Değişiklikleri kaydet
        changes = []
        if 'title' in data and data['title'] != course.title:
            old_title = course.title
            course.title = data['title']
            changes.append(f'Kurs başlığı "{old_title}" -> "{data["title"]}"')
            
        if 'description' in data and data['description'] != course.description:
            course.description = data['description']
            changes.append('Kurs açıklaması güncellendi')
            
        if 'price' in data and float(data['price']) != course.price:
            old_price = course.price
            course.price = float(data['price'])
            changes.append(f'Kurs fiyatı {old_price}₺ -> {data["price"]}₺')
            
        if 'category' in data and data['category'] != course.category:
            old_category = course.category
            course.category = data['category']
            changes.append(f'Kurs kategorisi "{old_category}" -> "{data["category"]}"')
            
        if 'level' in data and data['level'] != course.level:
            old_level = course.level
            course.level = data['level']
            changes.append(f'Kurs seviyesi "{old_level}" -> "{data["level"]}"')
        
        # Eğer değişiklik varsa, bildirim gönder
        if changes:
            course.updated_at = datetime.now(UTC)
            
            # Kursa kayıtlı öğrencilere bildirim gönder
            enrolled_students = Enrollment.query.filter_by(course_id=course_id).all()
            
            for enrollment in enrolled_students:
                notification = Notification(
                    user_id=enrollment.student_id,
                    course_id=course_id,
                    type='course_update',
                    title=f'Kurs Güncellendi: {course.title}',
                    message=f'{course.title} kursunda yapılan değişiklikler:\n' + '\n'.join(f'• {change}' for change in changes),
                    is_read=False,
                    created_at=datetime.now(UTC)
                )
                db.session.add(notification)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Kurs başarıyla güncellendi',
                'course': course.to_dict(),
                'changes': changes,
                'notifications_sent': len(enrolled_students) if changes else 0
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Kurs güncellenirken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    # Kursu bul
    course = Course.query.get_or_404(course_id)
    
    # Kullanıcının kursun sahibi olup olmadığını kontrol et
    user_id = get_jwt_identity()
    if str(course.instructor_id) != str(user_id):
        return jsonify({'error': 'You can only delete your own courses'}), 403
    
    db.session.delete(course) # Kursu veritabanından siliyoruz.
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({'message': 'Course deleted successfully'})

@courses.route('/<int:course_id>/lessons', methods=['POST'])
@jwt_required()
def add_lesson(course_id):
    # Kursu bul
    course = Course.query.get_or_404(course_id)
    
    # Kullanıcının kursun sahibi olup olmadığını kontrol et
    user_id = get_jwt_identity()
    if str(course.instructor_id) != str(user_id):
        return jsonify({'error': 'You can only add lessons to your own courses'}), 403
    
    data = request.get_json()
    
    # Gerekli alanları kontrol et
    if not all(k in data for k in ['title', 'content', 'order']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Yeni ders oluştur
    lesson = Lesson(
        title=data['title'],
        content=data['content'],
        order=data['order'],
        course_id=course_id
    )
    
    db.session.add(lesson)
    
    # Kursa kayıtlı tüm öğrencilere bildirim gönder
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    for enrollment in enrollments:
        notification = Notification(
            user_id=enrollment.student_id,
            course_id=course_id,
            title=f"Yeni Ders: {lesson.title}",
            message=f"{course.title} kursuna yeni bir ders eklendi: {lesson.title}",
            type="new_lesson"
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson added successfully',
        'lesson': {
            'id': lesson.id,
            'title': lesson.title,
            'order': lesson.order
        }
    }), 201

@courses.route('/search', methods=['GET'])
def search_courses():
    # Arama parametrelerini al
    query = request.args.get('q', '')  # Arama terimi
    category = request.args.get('category')  # Kategori
    instructor_id = request.args.get('instructor_id')  # Eğitmen ID
    sort_by = request.args.get('sort_by', 'created_at')  # Sıralama kriteri
    order = request.args.get('order', 'desc')  # Sıralama yönü

    # Temel sorguyu oluştur
    base_query = Course.query

    # Arama terimi varsa, başlık, açıklama ve eğitmen adında ara
    if query:
        base_query = base_query.join(User).filter(
            or_(
                Course.title.ilike(f'%{query}%'),
                Course.description.ilike(f'%{query}%'),
                User.username.ilike(f'%{query}%')
            )
        )

    # Kategori filtresi
    if category:
        base_query = base_query.filter(Course.category == category)

    # Eğitmen filtresi
    if instructor_id:
        base_query = base_query.filter(Course.instructor_id == instructor_id)

    # Sıralama
    if sort_by == 'title':
        base_query = base_query.order_by(Course.title.desc() if order == 'desc' else Course.title.asc())
    elif sort_by == 'created_at':
        base_query = base_query.order_by(Course.created_at.desc() if order == 'desc' else Course.created_at.asc())
    elif sort_by == 'popularity':
        # Popülerlik için kayıt sayısına göre sıralama
        base_query = base_query.outerjoin(Enrollment).group_by(Course.id).order_by(
            db.func.count(Enrollment.id).desc() if order == 'desc' else db.func.count(Enrollment.id).asc()
        )
    elif sort_by == 'price':
        # Fiyata göre sıralama
        base_query = base_query.order_by(Course.price.desc() if order == 'desc' else Course.price.asc())

    # Kursları getir
    courses = base_query.all()

    # Sonuçları formatla
    return jsonify([{
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'category': course.category,
        'instructor': {
            'id': course.instructor.id,
            'username': course.instructor.username
        },
        'created_at': course.created_at.isoformat(),
        'enrollment_count': len(course.enrollments)
    } for course in courses])

@courses.route('/categories', methods=['GET'])
def get_categories():
    # Tüm kategorileri getir
    categories = db.session.query(Course.category).distinct().all()
    return jsonify([category[0] for category in categories])

@courses.route('/instructors', methods=['GET'])
def get_instructors():
    # Tüm eğitmenleri getir
    instructors = User.query.filter_by(role='instructor').all()
    return jsonify([{
        'id': instructor.id,
        'username': instructor.username,
        'email': instructor.email
    } for instructor in instructors])

@courses.route('/<int:course_id>/reviews', methods=['GET'])
def get_course_reviews(course_id):
    """Kurs değerlendirmelerini getir"""
    course = Course.query.get_or_404(course_id)
    reviews = Review.query.filter_by(course_id=course_id).order_by(Review.created_at.desc()).all()
    
    # Ortalama puanı hesapla
    avg_rating = db.session.query(db.func.avg(Review.rating)).filter_by(course_id=course_id).scalar() or 0
    
    return jsonify({
        'course_id': course_id,
        'average_rating': float(avg_rating),
        'total_reviews': len(reviews),
        'reviews': [review.to_dict() for review in reviews]
    })

@courses.route('/<int:course_id>/reviews', methods=['POST'])
@jwt_required()
def create_course_review(course_id):
    """Kurs değerlendirmesi oluştur"""
    current_user_id = get_jwt_identity()
    
    # Kullanıcının kursa kayıtlı olup olmadığını kontrol et
    enrollment = Enrollment.query.filter_by(
        student_id=current_user_id,
        course_id=course_id
    ).first()
    
    if not enrollment:
        return jsonify({'error': 'Bu kursa değerlendirme yapabilmek için kursa kayıtlı olmalısınız.'}), 403
    
    # Kullanıcının daha önce değerlendirme yapıp yapmadığını kontrol et
    existing_review = Review.query.filter_by(
        user_id=current_user_id,
        course_id=course_id
    ).first()
    
    if existing_review:
        return jsonify({'error': 'Bu kurs için zaten bir değerlendirme yapmışsınız.'}), 400
    
    data = request.get_json()
    
    if not data or 'rating' not in data or 'comment' not in data:
        return jsonify({'error': 'Puan ve yorum alanları zorunludur.'}), 400
    
    rating = data['rating']
    comment = data['comment']
    
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Puan 1 ile 5 arasında olmalıdır.'}), 400
    
    review = Review(
        rating=rating,
        comment=comment,
        course_id=course_id,
        user_id=current_user_id
    )
    
    db.session.add(review)
    db.session.commit()
    
    return jsonify(review.to_dict()), 201

@courses.route('/<int:course_id>/reviews/<int:review_id>', methods=['PUT'])
@jwt_required()
def update_course_review(course_id, review_id):
    """Kurs değerlendirmesini güncelle"""
    current_user_id = int(get_jwt_identity())  # String'i integer'a çevir
    review = Review.query.get_or_404(review_id)
    
    print(f"Debug - current_user_id: {current_user_id}, review.user_id: {review.user_id}")  # Debug log
    
    if review.user_id != current_user_id:
        return jsonify({'error': 'Bu değerlendirmeyi güncelleyemezsiniz.'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Güncellenecek veri bulunamadı.'}), 400
    
    if 'rating' in data:
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Puan 1 ile 5 arasında olmalıdır.'}), 400
        review.rating = rating
    
    if 'comment' in data:
        review.comment = data['comment']
    
    db.session.commit()
    
    return jsonify(review.to_dict())

@courses.route('/<int:course_id>/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_course_review(course_id, review_id):
    """Kurs değerlendirmesini sil"""
    current_user_id = int(get_jwt_identity())  # String'i integer'a çevir
    review = Review.query.get_or_404(review_id)
    
    if review.user_id != current_user_id:
        return jsonify({'error': 'Bu değerlendirmeyi silemezsiniz.'}), 403
    
    db.session.delete(review)
    db.session.commit()
    
    return jsonify({'message': 'Değerlendirme başarıyla silindi'}), 200

@courses.route('/<int:course_id>/reviews/<int:review_id>/reply', methods=['POST'])
@jwt_required()
def reply_to_review(course_id, review_id):
    """Değerlendirmeye eğitmen yanıtı ekle"""
    current_user_id = int(get_jwt_identity())  # String'i integer'a çevir
    review = Review.query.get_or_404(review_id)
    course = Course.query.get_or_404(course_id)
    
    print(f"Debug - current_user_id: {current_user_id}, course.instructor_id: {course.instructor_id}")  # Debug log
    
    # Kullanıcının kursun eğitmeni olup olmadığını kontrol et
    if int(course.instructor_id) != current_user_id:  # Her iki değeri de integer olarak karşılaştır
        return jsonify({'error': 'Bu değerlendirmeye yanıt veremezsiniz.'}), 403
    
    data = request.get_json()
    
    if not data or 'reply' not in data:
        return jsonify({'error': 'Yanıt metni zorunludur.'}), 400
    
    review.instructor_reply = data['reply']
    review.instructor_reply_date = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Yanıt başarıyla eklendi',
        'review': review.to_dict()
    })

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/media', methods=['POST'])
@jwt_required()
def upload_lesson_media(course_id, lesson_id):
    # Kursu ve dersi kontrol et
    course = Course.query.get_or_404(course_id)
    lesson = Lesson.query.get_or_404(lesson_id)
    
    # Eğitmen yetkisi kontrolü
    current_user_id = get_jwt_identity()
    if course.instructor_id != int(current_user_id):
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
        
    if 'video' not in request.files and 'document' not in request.files:
        return jsonify({'error': 'Video veya döküman yüklenmedi'}), 400
        
    media_urls = []
    
    # Video yükleme
    if 'video' in request.files:
        video_file = request.files['video']
        video_url = upload_video_to_gcs(video_file)
        if video_url:
            # Video URL'ini veritabanına kaydet
            lesson.video_url = video_url
            media_urls.append({'type': 'video', 'url': video_url})
            
    # Döküman yükleme
    if 'document' in request.files:
        document_file = request.files['document']
        document_url = upload_document_to_gcs(document_file)
        if document_url:
            # Döküman URL'ini veritabanına kaydet
            new_document = LessonDocument(
                lesson_id=lesson.id,
                file_url=document_url,
                file_name=document_file.filename
            )
            db.session.add(new_document)
            media_urls.append({'type': 'document', 'url': document_url})
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Medya başarıyla yüklendi',
            'media': media_urls
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Medya yüklenirken bir hata oluştu'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz', methods=['POST'])
@jwt_required()
def create_quiz(course_id, lesson_id):
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu derse quiz ekleme yetkiniz yok'}), 403
        
        lesson = Lesson.query.get_or_404(lesson_id)
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
        
        data = request.get_json()
        if not data or not data.get('title') or not data.get('questions'):
            return jsonify({'message': 'Quiz başlığı ve en az bir soru gerekli'}), 400
        
        # Quiz'i oluştur
        quiz = Quiz(
            lesson_id=lesson_id,
            title=data['title'],
            description=data.get('description', ''),
            time_limit=data.get('time_limit'),  # Dakika cinsinden
            passing_score=data.get('passing_score', 60)  # Varsayılan geçme notu: 60
        )
        db.session.add(quiz)
        
        # Soruları ekle
        for q_data in data['questions']:
            question = QuizQuestion(
                quiz=quiz,
                question_text=q_data['question_text'],
                question_type=q_data.get('question_type', 'multiple_choice'),
                points=q_data.get('points', 10)  # Varsayılan puan: 10
            )
            db.session.add(question)
            
            # Çoktan seçmeli soru seçeneklerini ekle
            if question.question_type == 'multiple_choice' and 'options' in q_data:
                for opt_data in q_data['options']:
                    option = QuizOption(
                        question=question,
                        option_text=opt_data['text'],
                        is_correct=opt_data.get('is_correct', False)
                    )
                    db.session.add(option)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Quiz başarıyla oluşturuldu',
                'quiz': {
                    'id': quiz.id,
                    'title': quiz.title,
                    'description': quiz.description,
                    'time_limit': quiz.time_limit,
                    'passing_score': quiz.passing_score,
                    'question_count': len(data['questions'])
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Quiz oluşturulurken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(course_id, lesson_id, quiz_id):
    try:
        # Öğrenci kontrolü
        current_user_id = get_jwt_identity()
        
        # Kursa kayıt kontrolü
        enrollment = Enrollment.query.filter_by(
            student_id=current_user_id,
            course_id=course_id
        ).first()
        
        if not enrollment:
            return jsonify({'message': 'Bu quizi çözmek için kursa kayıtlı olmalısınız'}), 403
        
        # Quiz kontrolü
        quiz = Quiz.query.get_or_404(quiz_id)
        if quiz.lesson_id != lesson_id:
            return jsonify({'message': 'Quiz bu derse ait değil'}), 400
        
        data = request.get_json()
        if not data or not data.get('answers'):
            return jsonify({'message': 'Cevaplar gerekli'}), 400
        
        # Yeni deneme oluştur
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=current_user_id,
            started_at=datetime.now(UTC)
        )
        db.session.add(attempt)
        
        # Cevapları kaydet ve puanla
        total_points = 0
        max_points = 0
        
        for answer_data in data['answers']:
            question = QuizQuestion.query.get_or_404(answer_data['question_id'])
            max_points += question.points
            
            answer = QuizAnswer(
                attempt=attempt,
                question_id=question.id,
                selected_option_id=answer_data.get('selected_option_id'),
                answer_text=answer_data.get('text', '')
            )
            
            # Çoktan seçmeli soru kontrolü
            if question.question_type == 'multiple_choice' and answer.selected_option_id:
                selected_option = QuizOption.query.get(answer.selected_option_id)
                if selected_option and selected_option.is_correct:
                    answer.is_correct = True
                    answer.points_earned = question.points
                    total_points += question.points
            
            db.session.add(answer)
        
        # Quiz denemesini tamamla
        attempt.completed_at = datetime.now(UTC)
        attempt.score = (total_points / max_points * 100) if max_points > 0 else 0
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Quiz başarıyla tamamlandı',
                'attempt': {
                    'id': attempt.id,
                    'score': attempt.score,
                    'started_at': attempt.started_at.isoformat(),
                    'completed_at': attempt.completed_at.isoformat()
                }
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Quiz kaydedilirken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment', methods=['POST'])
@jwt_required()
def create_assignment(course_id, lesson_id):
    """Ders için ödev oluştur"""
    current_user_id = int(get_jwt_identity())
    lesson = Lesson.query.get_or_404(lesson_id)
    course = Course.query.get_or_404(course_id)
    
    # Kullanıcının kursun eğitmeni olup olmadığını kontrol et
    if course.instructor_id != current_user_id:
        return jsonify({'error': 'Bu derse ödev ekleyemezsiniz.'}), 403
    
    data = request.get_json()
    
    if not data or 'title' not in data or 'description' not in data or 'due_date' not in data:
        return jsonify({'error': 'Ödev başlığı, açıklaması ve son tarihi zorunludur.'}), 400
    
    assignment = Assignment(
        title=data['title'],
        description=data['description'],
        lesson_id=lesson_id,
        due_date=datetime.fromisoformat(data['due_date']),
        max_points=data.get('max_points', 100)
    )
    
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({
        'message': 'Ödev başarıyla oluşturuldu',
        'assignment_id': assignment.id
    })

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>/submit', methods=['POST'])
@jwt_required()
def submit_assignment(course_id, lesson_id, assignment_id):
    """Ödevi gönder"""
    current_user_id = int(get_jwt_identity())
    assignment = Assignment.query.get_or_404(assignment_id)
    
    # Kullanıcının kursa kayıtlı olup olmadığını kontrol et
    enrollment = Enrollment.query.filter_by(
        student_id=current_user_id,
        course_id=course_id
    ).first()
    
    if not enrollment:
        return jsonify({'error': 'Bu ödevi göndermek için kursa kayıtlı olmalısınız.'}), 403
    
    # Ödevin son tarihini kontrol et
    if assignment.due_date < datetime.utcnow():
        return jsonify({'error': 'Ödev son tarihi geçmiş.'}), 400
    
    data = request.get_json()
    
    if not data and 'file' not in request.files:
        return jsonify({'error': 'Ödev içeriği veya dosya zorunludur.'}), 400
    
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        user_id=current_user_id
    )
    
    if data and 'text' in data:
        submission.submission_text = data['text']
    
    if 'file' in request.files:
        file = request.files['file']
        # Dosya yükleme işlemi
        # submission.file_url = upload_to_storage(file)
    
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({
        'message': 'Ödev başarıyla gönderildi',
        'submission_id': submission.id
    })

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>/grade', methods=['POST'])
@jwt_required()
def grade_assignment(course_id, lesson_id, assignment_id):
    """Ödevi değerlendir"""
    current_user_id = int(get_jwt_identity())
    assignment = Assignment.query.get_or_404(assignment_id)
    course = Course.query.get_or_404(course_id)
    
    # Kullanıcının kursun eğitmeni olup olmadığını kontrol et
    if course.instructor_id != current_user_id:
        return jsonify({'error': 'Bu ödevi değerlendiremezsiniz.'}), 403
    
    data = request.get_json()
    
    if not data or 'submission_id' not in data or 'grade' not in data:
        return jsonify({'error': 'Değerlendirme bilgileri zorunludur.'}), 400
    
    submission = AssignmentSubmission.query.get_or_404(data['submission_id'])
    
    if submission.assignment_id != assignment_id:
        return jsonify({'error': 'Geçersiz ödev gönderimi.'}), 400
    
    submission.grade = data['grade']
    submission.feedback = data.get('feedback')
    submission.graded_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ödev başarıyla değerlendirildi',
        'grade': submission.grade,
        'feedback': submission.feedback
    })

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>/submission/<int:submission_id>/grade', methods=['POST'])
@jwt_required()
def grade_assignment_submission(course_id, lesson_id, assignment_id, submission_id):
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu ödevi değerlendirme yetkiniz yok'}), 403
        
        submission = AssignmentSubmission.query.get_or_404(submission_id)
        assignment = Assignment.query.get_or_404(assignment_id)
        
        if submission.assignment_id != assignment_id:
            return jsonify({'message': 'Ödev ID uyuşmazlığı'}), 400
        
        data = request.get_json()
        if not data or 'grade' not in data:
            return jsonify({'message': 'Not ve geri bildirim gerekli'}), 400
        
        # Notu ve geri bildirimi güncelle
        submission.grade = float(data['grade'])
        submission.feedback = data.get('feedback', '')
        submission.graded_at = datetime.now(UTC)
        
        # Öğrenciye bildirim gönder
        notification = Notification(
            user_id=submission.user_id,
            course_id=course_id,
            type='assignment_graded',
            title=f'Ödev Değerlendirildi: {assignment.title}',
            message=f'{course.title} kursundaki {assignment.title} ödevinden {submission.grade:.1f} puan aldınız.' + 
                    (f'\n\nGeri Bildirim:\n{submission.feedback}' if submission.feedback else ''),
            is_read=False,
            created_at=datetime.now(UTC)
        )
        db.session.add(notification)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Ödev değerlendirmesi başarıyla kaydedildi',
                'submission': {
                    'id': submission.id,
                    'grade': submission.grade,
                    'feedback': submission.feedback,
                    'graded_at': submission.graded_at.isoformat()
                }
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Ödev değerlendirmesi kaydedilirken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_course(course_id):
    """Öğrenciyi kursa kaydet"""
    current_user_id = get_jwt_identity()
    
    # Kullanıcının öğrenci olup olmadığını kontrol et
    user = User.query.get(current_user_id)
    if not user or user.role != 'student':
        return jsonify({'error': 'Bu işlem için öğrenci olmalısınız'}), 403
    
    # Kursun var olup olmadığını kontrol et
    course = Course.query.get_or_404(course_id)
    
    # Öğrencinin zaten kayıtlı olup olmadığını kontrol et
    existing_enrollment = Enrollment.query.filter_by(
        student_id=current_user_id,
        course_id=course_id
    ).first()
    
    if existing_enrollment:
        return jsonify({'error': 'Bu kursa zaten kayıtlısınız'}), 400
    
    # Yeni kayıt oluştur
    enrollment = Enrollment(
        student_id=current_user_id,
        course_id=course_id
    )
    
    try:
        db.session.add(enrollment)
        db.session.commit()
        return jsonify({
            'message': 'Kursa başarıyla kaydoldunuz',
            'enrollment': {
                'id': enrollment.id,
                'course_id': course_id,
                'enrolled_at': enrollment.enrolled_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Kursa kayıt olurken bir hata oluştu'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz/<int:quiz_id>/results', methods=['GET'])
@jwt_required()
def get_quiz_results(course_id, lesson_id, quiz_id):
    """Öğrencinin quiz sonuçlarını getir"""
    current_user_id = get_jwt_identity()
    
    # Quiz'in var olduğunu kontrol et
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Öğrencinin bu kursa kayıtlı olduğunu kontrol et
    enrollment = Enrollment.query.filter_by(
        student_id=current_user_id,
        course_id=course_id
    ).first()
    
    if not enrollment:
        return jsonify({'error': 'Bu kursa kayıtlı değilsiniz'}), 403
    
    # Öğrencinin quiz denemelerini bul
    attempts = QuizAttempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=current_user_id
    ).order_by(QuizAttempt.started_at.desc()).all()
    
    if not attempts:
        return jsonify({'message': 'Bu quiz için henüz bir denemeniz bulunmuyor'}), 404
    
    results = []
    for attempt in attempts:
        answers = []
        total_points = 0
        total_questions = len(quiz.questions)
        
        for answer in attempt.answers:
            question = QuizQuestion.query.get(answer.question_id)
            correct_answer = None
            
            if question.question_type == 'multiple_choice':
                correct_option = QuizOption.query.filter_by(
                    question_id=question.id,
                    is_correct=True
                ).first()
                correct_answer = correct_option.option_text if correct_option else None
            
            answers.append({
                'question_text': question.question_text,
                'your_answer': answer.answer_text,
                'correct_answer': correct_answer,
                'points_earned': answer.points_earned,
                'is_correct': answer.is_correct
            })
            
            if answer.is_correct:
                total_points += answer.points_earned
        
        results.append({
            'attempt_id': attempt.id,
            'started_at': attempt.started_at.isoformat(),
            'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
            'total_score': total_points,
            'max_possible_score': sum(q.points for q in quiz.questions),
            'percentage': (total_points / sum(q.points for q in quiz.questions)) * 100 if quiz.questions else 0,
            'answers': answers
        })
    
    return jsonify({
        'quiz_title': quiz.title,
        'quiz_description': quiz.description,
        'total_attempts': len(attempts),
        'results': results
    })

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>/submission/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_assignment_submission(course_id, lesson_id, assignment_id, submission_id):
    """Ödev gönderiminin detaylarını görüntüle"""
    current_user_id = int(get_jwt_identity())
    
    # Ödev gönderimini bul
    submission = AssignmentSubmission.query.get_or_404(submission_id)
    assignment = Assignment.query.get_or_404(assignment_id)
    course = Course.query.get_or_404(course_id)
    
    # Kullanıcının yetkisi var mı kontrol et (öğrenci kendi ödevini veya eğitmen kendi kursunun ödevlerini görebilir)
    if submission.user_id != current_user_id and course.instructor_id != current_user_id:
        return jsonify({'error': 'Bu ödevi görüntüleme yetkiniz yok'}), 403
    
    # Ödev detaylarını hazırla
    submission_details = {
        'submission_id': submission.id,
        'submitted_at': submission.submitted_at.isoformat(),
        'submission_text': submission.submission_text,
        'grade': submission.grade,
        'feedback': submission.feedback,
        'graded_at': submission.graded_at.isoformat() if submission.graded_at else None,
        'assignment': {
            'id': assignment.id,
            'title': assignment.title,
            'description': assignment.description,
            'due_date': assignment.due_date.isoformat(),
            'max_points': assignment.max_points
        }
    }
    
    return jsonify(submission_details)

@courses.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Kullanıcının bildirimlerini getir"""
    current_user_id = get_jwt_identity()
    
    # Okunmamış bildirimleri önce göster
    notifications = Notification.query.filter_by(user_id=current_user_id)\
        .order_by(Notification.is_read.asc(), Notification.created_at.desc()).all()
    
    return jsonify({
        'notifications': [notification.to_dict() for notification in notifications]
    })

@courses.route('/notifications/unread', methods=['GET'])
@jwt_required()
def get_unread_notifications():
    """Kullanıcının okunmamış bildirimlerini getir"""
    current_user_id = get_jwt_identity()
    
    notifications = Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).order_by(Notification.created_at.desc()).all()
    
    return jsonify({
        'notifications': [notification.to_dict() for notification in notifications],
        'count': len(notifications)
    })

@courses.route('/notifications/<int:notification_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    try:
        # Kullanıcı kimliğini al
        current_user_id = get_jwt_identity()
        
        # Bildirimi bul
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({
                'message': 'Bildirim bulunamadı veya bu bildirime erişim yetkiniz yok'
            }), 404
        
        # Bildirimi okundu olarak işaretle
        notification.is_read = True
        notification.read_at = datetime.now(UTC)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Bildirim okundu olarak işaretlendi',
                'notification': {
                    'id': notification.id,
                    'title': notification.title,
                    'message': notification.message,
                    'is_read': notification.is_read,
                    'read_at': notification.read_at.isoformat() if notification.read_at else None,
                    'created_at': notification.created_at.isoformat()
                }
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'message': f'Bildirim güncellenirken bir hata oluştu: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'message': f'Bir hata oluştu: {str(e)}'
        }), 500

@courses.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Tüm bildirimleri okundu olarak işaretle"""
    current_user_id = get_jwt_identity()
    
    Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).update({'is_read': True})
    
    db.session.commit()
    
    return jsonify({
        'message': 'Tüm bildirimler okundu olarak işaretlendi'
    })

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz/<int:quiz_id>/attempts/<int:attempt_id>/grade', methods=['POST'])
@jwt_required()
def grade_quiz_attempt(course_id, lesson_id, quiz_id, attempt_id):
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu quizi değerlendirme yetkiniz yok'}), 403
        
        quiz_attempt = QuizAttempt.query.get_or_404(attempt_id)
        
        if quiz_attempt.quiz_id != quiz_id:
            return jsonify({'message': 'Quiz ID uyuşmazlığı'}), 400
        
        data = request.get_json()
        if not data or 'score' not in data:
            return jsonify({'message': 'Puan gerekli'}), 400
        
        # Puanı güncelle
        quiz_attempt.score = float(data['score'])
        quiz_attempt.completed_at = datetime.now(UTC)
        
        # Öğrenciye bildirim gönder
        notification = Notification(
            user_id=quiz_attempt.user_id,
            course_id=course_id,
            type='quiz_graded',
            title=f'Quiz Değerlendirildi: {quiz_attempt.quiz.title}',
            message=f'{course.title} kursundaki {quiz_attempt.quiz.title} quizinden {quiz_attempt.score:.1f} puan aldınız.',
            is_read=False,
            created_at=datetime.now(UTC)
        )
        db.session.add(notification)
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Quiz değerlendirmesi başarıyla kaydedildi',
                'attempt': {
                    'id': quiz_attempt.id,
                    'score': quiz_attempt.score,
                    'completed_at': quiz_attempt.completed_at.isoformat()
                }
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Quiz değerlendirmesi kaydedilirken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

# Ödev teslim tarihi yaklaşan öğrencilere bildirim gönder
@courses.route('/check-assignment-due-dates', methods=['POST'])
@jwt_required()
def check_assignment_due_dates():
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if user.role != 'student':
            return jsonify({'message': 'Bu endpoint sadece öğrenciler için geçerlidir'}), 403
            
        # Öğrencinin kayıtlı olduğu kursları bul
        enrollments = db.session.scalars(
            db.select(Enrollment).filter_by(student_id=current_user_id)
        ).all()
        course_ids = [enrollment.course_id for enrollment in enrollments]
        
        # Yaklaşan ödevleri bul (3 gün içinde teslim tarihi olanlar)
        now = datetime.now(UTC)
        three_days_later = now + timedelta(days=3)
        
        upcoming_assignments = db.session.scalars(
            db.select(Assignment).join(Lesson).filter(
                Lesson.course_id.in_(course_ids),
                Assignment.due_date > now,
                Assignment.due_date <= three_days_later
            )
        ).all()
        
        # Teslim edilmemiş ödevler için bildirim oluştur
        notifications_created = 0
        for assignment in upcoming_assignments:
            # Ödev zaten teslim edilmiş mi kontrol et
            submission = db.session.scalar(
                db.select(AssignmentSubmission).filter_by(
                    assignment_id=assignment.id,
                    user_id=current_user_id
                )
            )
            
            if not submission:
                # Aynı ödev için daha önce bildirim gönderilmiş mi kontrol et
                existing_notification = db.session.scalar(
                    db.select(Notification).filter_by(
                        user_id=current_user_id,
                        type='assignment_due',
                        course_id=assignment.lesson.course_id,
                        reference_id=assignment.id
                    )
                )
                
                if not existing_notification:
                    time_diff = assignment.due_date - now
                    days_left = time_diff.days
                    hours_left = (time_diff.seconds // 3600)
                    
                    notification = Notification(
                        user_id=current_user_id,
                        course_id=assignment.lesson.course_id,
                        type='assignment_due',
                        reference_id=assignment.id,
                        title=f'Ödev Teslim Tarihi Yaklaşıyor: {assignment.title}',
                        message=f'{assignment.lesson.course.title} kursundaki {assignment.title} ödevinin teslim tarihine {days_left} gün {hours_left} saat kaldı.',
                        is_read=False,
                        created_at=now
                    )
                    db.session.add(notification)
                    notifications_created += 1
        
        if notifications_created > 0:
            try:
                db.session.commit()
                return jsonify({
                    'message': f'{notifications_created} adet yaklaşan ödev bildirimi oluşturuldu',
                    'notifications_count': notifications_created
                })
            except Exception as e:
                db.session.rollback()
                return jsonify({'message': f'Bildirimler kaydedilirken bir hata oluştu: {str(e)}'}), 500
        else:
            return jsonify({
                'message': 'Yaklaşan teslim tarihli ödev bulunamadı',
                'notifications_count': 0
            })
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500 