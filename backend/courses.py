from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Course, Lesson, User, Enrollment, Review
from sqlalchemy import or_
from datetime import datetime

courses = Blueprint('courses', __name__)

def is_instructor(user_id): # Kullanıcının eğitmen olup olmadığını kontrol et
    user = User.query.get(user_id)
    return user and user.role == 'instructor'

@courses.route('/courses', methods=['POST']) 
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

@courses.route('/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    # Kursu bul
    course = Course.query.get_or_404(course_id) 
    
    # Kullanıcının kursun sahibi olup olmadığını kontrol et
    user_id = get_jwt_identity()
    if str(course.instructor_id) != str(user_id):
        return jsonify({'error': 'You can only edit your own courses'}), 403
    
    data = request.get_json()
    
    # Alanları güncelle
    if 'title' in data:
        course.title = data['title']
    if 'description' in data:
        course.description = data['description']
    
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({
        'message': 'Course updated successfully',
        'course': {
            'id': course.id,
            'title': course.title,
            'description': course.description
        }
    })

@courses.route('/courses/<int:course_id>', methods=['DELETE'])
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

@courses.route('/courses/<int:course_id>/lessons', methods=['POST'])
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
    
    db.session.add(lesson) # Dersi veritabanına ekliyoruz.
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({
        'message': 'Lesson added successfully',
        'lesson': {
            'id': lesson.id,
            'title': lesson.title,
            'order': lesson.order
        }
    }), 201

@courses.route('/courses/search', methods=['GET'])
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

@courses.route('/courses/categories', methods=['GET'])
def get_categories():
    # Tüm kategorileri getir
    categories = db.session.query(Course.category).distinct().all()
    return jsonify([category[0] for category in categories])

@courses.route('/courses/instructors', methods=['GET'])
def get_instructors():
    # Tüm eğitmenleri getir
    instructors = User.query.filter_by(role='instructor').all()
    return jsonify([{
        'id': instructor.id,
        'username': instructor.username,
        'email': instructor.email
    } for instructor in instructors])

@courses.route('/courses/<int:course_id>/reviews', methods=['GET'])
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

@courses.route('/courses/<int:course_id>/reviews', methods=['POST'])
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

@courses.route('/courses/<int:course_id>/reviews/<int:review_id>', methods=['PUT'])
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

@courses.route('/courses/<int:course_id>/reviews/<int:review_id>', methods=['DELETE'])
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

@courses.route('/courses/<int:course_id>/reviews/<int:review_id>/reply', methods=['POST'])
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