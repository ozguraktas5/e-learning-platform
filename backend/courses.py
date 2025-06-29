from flask import Blueprint, jsonify, request, current_app, url_for, render_template, send_from_directory, make_response #flask modülünü import ediyoruz
from models import db, Course, Lesson, User, Enrollment, Review, Progress, Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer, Assignment, AssignmentSubmission, Notification, LessonDocument #models modülünü import ediyoruz
from flask_jwt_extended import jwt_required, get_jwt_identity #flask_jwt_extended modülünü import ediyoruz
from werkzeug.utils import secure_filename #werkzeug modülünü import ediyoruz
import os #os modülünü import ediyoruz
import re #re modülünü import ediyoruz
from datetime import datetime, timedelta, timezone, UTC #datetime modülünü import ediyoruz
import mimetypes #mimetypes modülünü import ediyoruz
import random #random modülünü import ediyoruz
import json #json modülünü import ediyoruz
import uuid #uuid modülünü import ediyoruz
import bleach #bleach modülünü import ediyoruz
from sqlalchemy import or_, and_, func, desc #sqlalchemy modülünü import ediyoruz#sqlalchemy modülünü import ediyoruz
import logging
from utils import upload_image_local, upload_video_local, upload_document_local

# İstanbul/Türkiye saat dilimini tanımla (UTC+3)
TURKEY_TZ = timezone(timedelta(hours=3)) #Türkiye saat dilimini tanımlıyoruz.

# Blueprint oluştur
courses = Blueprint('courses', __name__) #courses modülünü oluşturuyoruz.

# HTML temizleme için izin verilen etiketler
ALLOWED_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'img', 'div', 'span', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td'] #HTML temizleme için izin verilen etiketleri tanımlıyoruz.

# İzin verilen HTML özellikleri  
ALLOWED_ATTRIBUTES = { 
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'class'],
    'div': ['class', 'id', 'style'],
    'span': ['class', 'id', 'style'],
    '*': ['class', 'id']
}

def sanitize_html(content):
    """HTML içeriğini temizle ve güvenli hale getir"""
    # Eğer içerik HTML etiketleri içermiyorsa, olduğu gibi döndür
    if not any(f'<{tag}' in content.lower() for tag in ALLOWED_TAGS + ['script', 'style', 'iframe']):
        return content
        
    return bleach.clean( 
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )

def is_instructor(user_id): # Kullanıcının eğitmen olup olmadığını kontrol et
    user = User.query.get(user_id) #user'u alıyoruz
    return user and user.role == 'instructor' #user'un role'u instructor ise True döndürüyoruz.

@courses.route('/', methods=['POST'])
@jwt_required() #jwt_required decoratorını kullanıyoruz
def create_course(): #create_course fonksiyonunu tanımlıyoruz
    try:
        # Kullanıcının eğitmen olup olmadığını kontrol et
        user_id = get_jwt_identity() #user_id'yi alıyoruz
        current_app.logger.info(f'Creating course request from user: {user_id}') #user_id'yi logluyoruz
        
        if not is_instructor(user_id): #user_id'nin instructor olup olmadığını kontrol ediyoruz
            current_app.logger.warning(f'User {user_id} is not an instructor') #user_id'nin instructor olmadığını logluyoruz
            return jsonify({'error': 'Only instructors can create courses'}), 403 #user_id'nin instructor olmadığı durumda boş bir liste döndürüyoruz

        # Form verilerini al
        title = request.form.get('title') #title'yi alıyoruz
        description = request.form.get('description') #description'yi alıyoruz
        price = request.form.get('price', 0) #price'yi alıyoruz
        category = request.form.get('category') #category'yi alıyoruz
        level = request.form.get('level') #level'yi alıyoruz
        
        # Gerekli alanları kontrol et
        if not title or not description:
            current_app.logger.warning('Missing required fields in request') #gerekli alanların olmadığını logluyoruz
            return jsonify({'error': 'Missing required fields'}), 400 #gerekli alanların olmadığı durumda boş bir liste döndürüyoruz
        
        # Resim dosyasını kontrol et ve yükle
        image_url = None #image_url'yi alıyoruz
        if 'image' in request.files: #image'in request.files'ta olup olmadığını kontrol ediyoruz
            file = request.files['image'] #file'yi alıyoruz
            if file and file.filename: #file'in filename'inin boş olup olmadığını kontrol ediyoruz
                try:
                    # Local uploads kullanarak file'ı yüklüyoruz
                    image_url = upload_image_local(file) 
                    if image_url is None: #image_url'in boş olup olmadığını kontrol ediyoruz
                         raise ValueError("File upload failed.") #file upload failed durumunda hata fırlatıyoruz
                except Exception as e: #hata durumunda
                    current_app.logger.error(f'Error uploading image: {str(e)}') #hata durumunda logluyoruz
                    return jsonify({'error': f'Error uploading image: {str(e)}'}), 500
        
        # Yeni kurs oluştur
        course = Course(
            title=title, #title'yi alıyoruz
            description=sanitize_html(description), #description'yi alıyoruz
            instructor_id=user_id, #user_id'yi alıyoruz
            price=float(price), #price'yi alıyoruz
            category=category, #category'yi alıyoruz
            level=level, #level'yi alıyoruz
            image_url=image_url #image_url'yi alıyoruz
        )
        
        current_app.logger.info(f'Created course object: {course.title}') #course.title'yi logluyoruz
        
        try:
            db.session.add(course) #course'ı veritabanına ekle
            current_app.logger.info('Added course to session') #course'ı veritabanına ekleme işlemi başarılı olduğunu logluyoruz
            db.session.commit() #commit işlemi yap
            current_app.logger.info(f'Successfully committed course to database with ID: {course.id}') #course.id'yi logluyoruz
            
            # Veritabanından kursu tekrar kontrol et
            saved_course = Course.query.get(course.id) #course.id'yi alıyoruz
            if saved_course: #saved_course'in boş olup olmadığını kontrol ediyoruz
                current_app.logger.info(f'Verified course in database: {saved_course.title}') #saved_course.title'yi logluyoruz
            else: #saved_course'in boş olması durumunda
                current_app.logger.error('Course not found in database after commit!') #course not found in database after commit! durumunda hata fırlatıyoruz
            
            return jsonify({
                'message': 'Course created successfully', #course created successfully durumunda boş bir liste döndürüyoruz
                'course': course.to_dict() #course.to_dict()'yi alıyoruz
            }), 201
            
        except Exception as e:
            db.session.rollback() #rollback işlemi yap
            current_app.logger.error(f'Database error while creating course: {str(e)}') #hata durumunda logluyoruz
            return jsonify({'error': f'Database error: {str(e)}'}), 500 #hata durumunda boş bir liste döndürüyoruz
            
    except Exception as e:
        current_app.logger.error(f'Error in create_course: {str(e)}') #hata durumunda logluyoruz
        return jsonify({'error': f'Server error: {str(e)}'}), 500 #hata durumunda boş bir liste döndürüyoruz

@courses.route('/<int:course_id>', methods=['PUT'])
@jwt_required() #jwt_required decoratorını kullanıyoruz
def update_course(course_id): #update_course fonksiyonunu tanımlıyoruz
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity() #current_user_id'yi alıyoruz
        course = Course.query.get_or_404(course_id) #course.id'yi alıyoruz
        
        if str(course.instructor_id) != current_user_id: #course.instructor_id'nin current_user_id'ye eşit olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'Bu kursu güncelleme yetkiniz yok'}), 403 #bu kursu güncelleme yetkiniz yok durumunda boş bir liste döndürüyoruz
        
        # JSON ve multipart/form-data için destek
        if request.mimetype and request.mimetype.startswith('multipart/form-data'):
            data = request.form.to_dict() #request.form.to_dict()'yi alıyoruz
        else:
            data = request.get_json() or {} #request.get_json()'yi alıyoruz
        if not data and 'image' not in request.files: #data'nın boş olup olmadığını kontrol ediyoruz ve image'in request.files'ta olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'Güncelleme için veri gerekli'}), 400 #güncelleme için veri gerekli durumunda boş bir liste döndürüyoruz
        
        # Değişiklikleri kaydet
        changes = [] #changes'i alıyoruz
        if 'title' in data and data['title'] != course.title: #title'in data'da olup olmadığını kontrol ediyoruz ve title'in course.title'ye eşit olup olmadığını kontrol ediyoruz
            old_title = course.title #old_title'yi alıyoruz
            course.title = data['title'] #course.title'yi alıyoruz
            changes.append(f'Kurs başlığı "{old_title}" -> "{data["title"]}"') #Kurs başlığı "{old_title}" -> "{data["title"]}" durumunda changes'e ekle
            
        if 'description' in data and data['description'] != course.description: #description'in data'da olup olmadığını kontrol ediyoruz ve description'in course.description'ye eşit olup olmadığını kontrol ediyoruz
            course.description = data['description'] #course.description'yi alıyoruz
            changes.append('Kurs açıklaması güncellendi') #Kurs açıklaması güncellendi durumunda changes'e ekle
            
        if 'price' in data and float(data['price']) != course.price: #price'in data'da olup olmadığını kontrol ediyoruz ve price'in course.price'ye eşit olup olmadığını kontrol ediyoruz
            old_price = course.price #old_price'yi alıyoruz
            course.price = float(data['price']) #course.price'yi alıyoruz
            changes.append(f'Kurs fiyatı {old_price}₺ -> {data["price"]}₺') #Kurs fiyatı {old_price}₺ -> {data["price"]}₺ durumunda changes'e ekle
            
        if 'category' in data and data['category'] != course.category: #category'in data'da olup olmadığını kontrol ediyoruz ve category'in course.category'ye eşit olup olmadığını kontrol ediyoruz
            old_category = course.category #old_category'yi alıyoruz
            course.category = data['category'] #course.category'yi alıyoruz
            changes.append(f'Kurs kategorisi "{old_category}" -> "{data["category"]}"') #Kurs kategorisi "{old_category}" -> "{data["category"]}" durumunda changes'e ekle
            
        if 'level' in data and data['level'] != course.level: #level'in data'da olup olmadığını kontrol ediyoruz ve level'in course.level'ye eşit olup olmadığını kontrol ediyoruz
            old_level = course.level #old_level'yi alıyoruz
            course.level = data['level'] #course.level'yi alıyoruz
            changes.append(f'Kurs seviyesi "{old_level}" -> "{data["level"]}"') #Kurs seviyesi "{old_level}" -> "{data["level"]}" durumunda changes'e ekle
        
        # İsteğe bağlı resim güncellemesi
        if 'image' in request.files: #image'in request.files'ta olup olmadığını kontrol ediyoruz
            file = request.files['image'] #file'yi alıyoruz
            if file and file.filename: #file'in filename'inin boş olup olmadığını kontrol ediyoruz
                try:
                    new_url = upload_image_local(file) #Local uploads kullanarak file'ı yüklüyoruz
                    course.image_url = new_url #course.image_url'yi alıyoruz
                    changes.append('Kurs görseli güncellendi') #Kurs görseli güncellendi durumunda changes'e ekle
                except Exception as e: #hata durumunda
                    current_app.logger.error(f'Error uploading new image: {str(e)}') #hata durumunda logluyoruz
        
        # Eğer değişiklikler varsa, bildirim gönder
        if changes: #changes'in boş olup olmadığını kontrol ediyoruz
            course.updated_at = datetime.now(TURKEY_TZ) #course.updated_at'yi alıyoruz
            
            # Kursa kayıtlı öğrencilere bildirim gönder
            enrolled_students = Enrollment.query.filter_by(course_id=course_id).all() #Enrollment.query.filter_by(course_id=course_id).all()'yi alıyoruz
            
            for enrollment in enrolled_students: #enrolled_students'in boş olup olmadığını kontrol ediyoruz
                notification = Notification(
                    user_id=enrollment.student_id, #enrollment.student_id'yi alıyoruz
                    course_id=course_id, #course_id'yi alıyoruz
                    type='course_update', #type'yi alıyoruz
                    title=f'Kurs Güncellendi: {course.title}', #Kurs Güncellendi: {course.title} durumunda title'e ekle
                    message=f'{course.title} kursunda yapılan değişiklikler:\n' + '\n'.join(f'• {change}' for change in changes),
                    is_read=False,
                    created_at=datetime.now(TURKEY_TZ)
                )
                db.session.add(notification) #notification'ı veritabanına ekle
        
        try:
            db.session.commit() #commit işlemi yap
            return jsonify({
                'message': 'Kurs başarıyla güncellendi', #Kurs başarıyla güncellendi durumunda boş bir liste döndürüyoruz
                'course': course.to_dict(), #course.to_dict()'yi alıyoruz
                'changes': changes, #changes'i alıyoruz
                'notifications_sent': len(enrolled_students) if changes else 0 #notifications_sent'i alıyoruz
            })
        except Exception as e: #hata durumunda
            db.session.rollback() #rollback işlemi yap
            return jsonify({'message': f'Kurs güncellenirken bir hata oluştu: {str(e)}'}), 500 #Kurs güncellenirken bir hata oluştu: {str(e)} durumunda boş bir liste döndürüyoruz
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500 #Bir hata oluştu: {str(e)} durumunda boş bir liste döndürüyoruz

@courses.route('/<int:course_id>', methods=['DELETE'])
@jwt_required() #jwt_required decoratorını kullanıyoruz
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
@jwt_required() #jwt_required decoratorını kullanıyoruz
def add_lesson(course_id): #add_lesson fonksiyonunu tanımlıyoruz
    # Kursu bul
    course = Course.query.get_or_404(course_id) #course.id'yi alıyoruz
    
    # Kullanıcının kursun sahibi olup olmadığını kontrol et
    user_id = get_jwt_identity() #user_id'yi alıyoruz
    if str(course.instructor_id) != str(user_id): #course.instructor_id'nin user_id'ye eşit olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'You can only add lessons to your own courses'}), 403 #You can only add lessons to your own courses durumunda boş bir liste döndürüyoruz
    
    data = request.get_json() #request.get_json()'yi alıyoruz
    
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
    
    db.session.add(lesson) #lesson'ı veritabanına ekle
    
    # Kursa kayıtlı tüm öğrencilere bildirim gönder
    enrollments = Enrollment.query.filter_by(course_id=course_id).all() #Enrollment.query.filter_by(course_id=course_id).all()'yi alıyoruz
    for enrollment in enrollments:
        notification = Notification(
            user_id=enrollment.student_id,
            course_id=course_id,
            title=f"Yeni Ders: {lesson.title}",
            message=f"{course.title} kursuna yeni bir ders eklendi: {lesson.title}",
            type="new_lesson"
        )
        db.session.add(notification) #notification'ı veritabanına ekle
    
    db.session.commit() #commit işlemi yap
    
    return jsonify({
        'message': 'Lesson added successfully', #Lesson added successfully durumunda boş bir liste döndürüyoruz
        'lesson': {
            'id': lesson.id, #lesson.id'yi alıyoruz
            'title': lesson.title, #lesson.title'yi alıyoruz
            'order': lesson.order #lesson.order'yi alıyoruz
        }
    }), 201

@courses.route('/<int:course_id>/lessons', methods=['GET']) #courses.route('/<int:course_id>/lessons', methods=['GET']) fonksiyonunu tanımlıyoruz
def get_course_lessons(course_id): #get_course_lessons fonksiyonunu tanımlıyoruz
    """Bir kursa ait tüm dersleri getirir."""
    try:
        # Kursun var olup olmadığını kontrol et
        course = Course.query.get_or_404(course_id) #course.id'yi alıyoruz
        
        # Kursa ait dersleri getir ve sırala
        lessons = Lesson.query.filter_by(course_id=course_id).order_by(Lesson.order.asc()).all() #Lesson.query.filter_by(course_id=course_id).order_by(Lesson.order.asc()).all()'yi alıyoruz
        
        # Dersleri dictionary formatına çevir
        lesson_list = [lesson.to_dict() for lesson in lessons]
        
        return jsonify(lesson_list), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching lessons for course {course_id}: {str(e)}")
        return jsonify({'error': 'Dersler getirilirken bir hata oluştu'}), 500

@courses.route('/search', methods=['GET']) #courses.route('/search', methods=['GET']) fonksiyonunu tanımlıyoruz
@jwt_required() #jwt_required decoratorını kullanıyoruz
def search_courses(): #search_courses fonksiyonunu tanımlıyoruz
    try:
        # Arama parametrelerini al
        query = request.args.get('q', '').strip() #query'yi alıyoruz
        category = request.args.get('category') #category'yi alıyoruz
        level = request.args.get('level') #level'yi alıyoruz
        min_price = request.args.get('min_price', type=float) #min_price'yi alıyoruz
        max_price = request.args.get('max_price', type=float) #max_price'yi alıyoruz
        instructor_id = request.args.get('instructor_id', type=int) #instructor_id'yi alıyoruz
        sort_by = request.args.get('sort_by', 'created_at')  # created_at, title, price, popularity
        order = request.args.get('order', 'desc')  # asc, desc
        page = request.args.get('page', 1, type=int) #page'yi alıyoruz
        per_page = request.args.get('per_page', 10, type=int) #per_page'yi alıyoruz

        # Sayfalama parametrelerini doğrula
        if page < 1:
            return jsonify({'message': 'Sayfa numarası 1 veya daha büyük olmalıdır'}), 400
        if per_page < 1 or per_page > 50:
            return jsonify({'message': 'Sayfa boyutu 1-50 arasında olmalıdır'}), 400

        # Temel sorguyu oluştur
        query_obj = Course.query.join(User, Course.instructor_id == User.id)

        # Arama filtrelerini uygula
        if query:
            search_filter = or_(
                Course.title.ilike(f'%{query}%'),
                Course.description.ilike(f'%{query}%'),
                User.username.ilike(f'%{query}%')
            )
            query_obj = query_obj.filter(search_filter)

        if category: #category'nin boş olup olmadığını kontrol ediyoruz
            query_obj = query_obj.filter(Course.category == category) #Course.category == category durumunda query_obj'e ekle

        if level: #level'in boş olup olmadığını kontrol ediyoruz
            query_obj = query_obj.filter(Course.level == level) #Course.level == level durumunda query_obj'e ekle

        if min_price is not None: #min_price'in boş olup olmadığını kontrol ediyoruz
            query_obj = query_obj.filter(Course.price >= min_price) #Course.price >= min_price durumunda query_obj'e ekle

        if max_price is not None: #max_price'in boş olup olmadığını kontrol ediyoruz
            query_obj = query_obj.filter(Course.price <= max_price) #Course.price <= max_price durumunda query_obj'e ekle

        if instructor_id: #instructor_id'in boş olup olmadığını kontrol ediyoruz
            query_obj = query_obj.filter(Course.instructor_id == instructor_id) #Course.instructor_id == instructor_id durumunda query_obj'e ekle

        # Sıralama
        if sort_by == 'title': #sort_by'in title olup olmadığını kontrol ediyoruz
            query_obj = query_obj.order_by(Course.title.desc() if order == 'desc' else Course.title.asc()) #Course.title.desc() if order == 'desc' else Course.title.asc() durumunda query_obj'e ekle
        elif sort_by == 'price': #sort_by'in price olup olmadığını kontrol ediyoruz
            query_obj = query_obj.order_by(Course.price.desc() if order == 'desc' else Course.price.asc())
        elif sort_by == 'popularity': #sort_by'in popularity olup olmadığını kontrol ediyoruz
            # Popülerlik için kayıt sayısına göre sıralama
            query_obj = query_obj.outerjoin(Enrollment).group_by(Course.id, User.id) #Enrollment.outerjoin(Course.id, User.id) durumunda query_obj'e ekle
            if order == 'desc': #order'in desc olup olmadığını kontrol ediyoruz
                query_obj = query_obj.order_by(db.func.count(Enrollment.id).desc()) #db.func.count(Enrollment.id).desc() durumunda query_obj'e ekle
            else: #order'in desc olması durumunda
                query_obj = query_obj.order_by(db.func.count(Enrollment.id).asc()) #db.func.count(Enrollment.id).asc() durumunda query_obj'e ekle
        else:  # default: created_at
            query_obj = query_obj.order_by(Course.created_at.desc() if order == 'desc' else Course.created_at.asc())

        # Toplam kayıt sayısını al
        total = query_obj.count()

        # Sayfalama uygula
        courses = query_obj.offset((page - 1) * per_page).limit(per_page).all()

        # Sonuçları formatla
        results = [] #results'i alıyoruz
        for course in courses: #courses'in boş olup olmadığını kontrol ediyoruz
            course_dict = {
                'id': course.id, #course.id'yi alıyoruz
                'title': course.title, #course.title'yi alıyoruz
                'description': course.description, #course.description'yi alıyoruz
                'category': course.category, #course.category'yi alıyoruz
                'level': course.level, #course.level'yi alıyoruz
                'price': course.price, #course.price'yi alıyoruz
                'image_url': course.image_url, #course.image_url'yi alıyoruz
                'created_at': course.created_at.isoformat() if course.created_at else None, #course.created_at.isoformat() if course.created_at else None'yi alıyoruz
                'instructor_id': course.instructor.id, #course.instructor.id'yi alıyoruz
                'instructor_name': course.instructor.username, #course.instructor.username'yi alıyoruz
                'instructor': {
                    'id': course.instructor.id, #course.instructor.id'yi alıyoruz
                    'username': course.instructor.username #course.instructor.username'yi alıyoruz
                },
                'enrollment_count': len(course.enrollments) #course.enrollments'in uzunluğunu alıyoruz
            }
            results.append(course_dict) #course_dict'i results'e ekle

        return jsonify({
            'courses': results, #results'i alıyoruz
            'total': total, #total'i alıyoruz
            'page': page, #page'yi alıyoruz
            'per_page': per_page, #per_page'yi alıyoruz
            'total_pages': (total + per_page - 1) // per_page #(total + per_page - 1) // per_page'yi alıyoruz
        })

    except Exception as e: #hata durumunda
        current_app.logger.error(f"Error in search_courses: {str(e)}") #hata durumunda logluyoruz
        return jsonify({'message': 'Kurslar aranırken bir hata oluştu', 'error': str(e)}), 500 #Kurslar aranırken bir hata oluştu: {str(e)} durumunda boş bir liste döndürüyoruz

@courses.route('/categories', methods=['GET'])
def get_categories(): #get_categories fonksiyonunu tanımlıyoruz
    # Tüm kategorileri getir
    categories = db.session.query(Course.category).distinct().all() #Course.category.distinct().all()'yi alıyoruz
    return jsonify([category[0] for category in categories]) #category[0] for category in categories'yi alıyoruz

@courses.route('/instructors', methods=['GET']) #courses.route('/instructors', methods=['GET']) fonksiyonunu tanımlıyoruz
def get_instructors(): #get_instructors fonksiyonunu tanımlıyoruz
    # Tüm eğitmenleri getir
    instructors = User.query.filter_by(role='instructor').all() #User.query.filter_by(role='instructor').all()'yi alıyoruz
    return jsonify([{
        'id': instructor.id, #instructor.id'yi alıyoruz
        'username': instructor.username, #instructor.username'yi alıyoruz
        'email': instructor.email #instructor.email'yi alıyoruz
    } for instructor in instructors]) #instructor[0] for instructor in instructors'yi alıyoruz

@courses.route('/<int:course_id>/reviews', methods=['GET']) #courses.route('/<int:course_id>/reviews', methods=['GET']) fonksiyonunu tanımlıyoruz
def get_course_reviews(course_id): #get_course_reviews fonksiyonunu tanımlıyoruz
    """Kurs değerlendirmelerini getir"""
    course = Course.query.get_or_404(course_id) #course.id'yi alıyoruz
    reviews = Review.query.filter_by(course_id=course_id).order_by(Review.created_at.desc()).all() #Review.query.filter_by(course_id=course_id).order_by(Review.created_at.desc()).all()'yi alıyoruz
    
    # Ortalama puanı hesapla
    avg_rating = db.session.query(db.func.avg(Review.rating)).filter_by(course_id=course_id).scalar() or 0 #db.session.query(db.func.avg(Review.rating)).filter_by(course_id=course_id).scalar() or 0'yi alıyoruz
    
    return jsonify({
        'course_id': course_id, #course_id'yi alıyoruz
        'average_rating': float(avg_rating), #float(avg_rating)'yi alıyoruz
        'total_reviews': len(reviews), #len(reviews)'yi alıyoruz
        'reviews': [review.to_dict() for review in reviews] #review.to_dict() for review in reviews'yi alıyoruz
    })

@courses.route('/<int:course_id>/reviews', methods=['POST']) #courses.route('/<int:course_id>/reviews', methods=['POST']) fonksiyonunu tanımlıyoruz#courses.route('/<int:course_id>/reviews', methods=['POST']) fonksiyonunu tanımlıyoruz
@jwt_required()
def create_course_review(course_id):
    """Kurs değerlendirmesi oluştur"""
    current_user_id = get_jwt_identity() #current_user_id'yi alıyoruz
    
    # Kullanıcının kursa kayıtlı olup olmadığını kontrol et
    enrollment = Enrollment.query.filter_by( #Enrollment.query.filter_by()'yi alıyoruz
        student_id=current_user_id, #current_user_id'yi alıyoruz
        course_id=course_id #course_id'yi alıyoruz
    ).first() #.first()'yi alıyoruz
    
    if not enrollment: #enrollment'in boş olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'Bu kursa değerlendirme yapabilmek için kursa kayıtlı olmalısınız.'}), 403
    
    # Kullanıcının daha önce değerlendirme yapıp yapmadığını kontrol et
    existing_review = Review.query.filter_by(
        user_id=current_user_id,
        course_id=course_id
    ).first()
    
    if existing_review: #existing_review'in boş olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'Bu kurs için zaten bir değerlendirme yapmışsınız.'}), 400
    
    data = request.get_json() #request.get_json()'yi alıyoruz
    
    if not data or 'rating' not in data or 'comment' not in data: #data'nin boş olup olmadığını kontrol ediyoruz ve rating'in data'da olup olmadığını kontrol ediyoruz ve comment'in data'da olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'Puan ve yorum alanları zorunludur.'}), 400 #Puan ve yorum alanları zorunludur. durumunda boş bir liste döndürüyoruz
    
    rating = data['rating'] #rating'i alıyoruz
    comment = data['comment'] #comment'i alıyoruz
    
    if not isinstance(rating, int) or rating < 1 or rating > 5: #rating'in int olup olmadığını kontrol ediyoruz ve rating'in 1'den küçük olup olmadığını kontrol ediyoruz ve rating'in 5'ten büyük olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'Puan 1 ile 5 arasında olmalıdır.'}), 400 #Puan 1 ile 5 arasında olmalıdır. durumunda boş bir liste döndürüyoruz
    
    review = Review( #Review()'yi alıyoruz
        rating=rating, #rating'i alıyoruz
        comment=comment, #comment'i alıyoruz
        course_id=course_id, #course_id'yi alıyoruz
        user_id=current_user_id #current_user_id'yi alıyoruz
    ) #Review()'yi alıyoruz
    
    db.session.add(review) #review'ı veritabanına ekle
    db.session.commit() #commit işlemi yap
    
    return jsonify(review.to_dict()), 201 #review.to_dict()'yi alıyoruz

@courses.route('/<int:course_id>/reviews/<int:review_id>', methods=['PUT']) #courses.route('/<int:course_id>/reviews/<int:review_id>', methods=['PUT']) fonksiyonunu tanımlıyoruz
@jwt_required() #jwt_required decoratorını kullanıyoruz
def update_course_review(course_id, review_id): #update_course_review fonksiyonunu tanımlıyoruz
    """Kurs değerlendirmesini güncelle"""
    current_user_id = int(get_jwt_identity())  # String'i integer'a çevir
    review = Review.query.get_or_404(review_id)
    
    if review.user_id != current_user_id: #review.user_id'nin current_user_id'ye eşit olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'Bu değerlendirmeyi güncelleyemezsiniz.'}), 403 #Bu değerlendirmeyi güncelleyemezsiniz. durumunda boş bir liste döndürüyoruz
    
    data = request.get_json() #request.get_json()'yi alıyoruz
    
    if not data: #data'nin boş olup olmadığını kontrol ediyoruz
        return jsonify({'error': 'Güncellenecek veri bulunamadı.'}), 400 #Güncellenecek veri bulunamadı. durumunda boş bir liste döndürüyoruz
    
    if 'rating' in data: #rating'in data'da olup olmadığını kontrol ediyoruz
        rating = data['rating'] #rating'i alıyoruz
        if not isinstance(rating, int) or rating < 1 or rating > 5: #rating'in int olup olmadığını kontrol ediyoruz ve rating'in 1'den küçük olup olmadığını kontrol ediyoruz ve rating'in 5'ten büyük olup olmadığını kontrol ediyoruz
            return jsonify({'error': 'Puan 1 ile 5 arasında olmalıdır.'}), 400 #Puan 1 ile 5 arasında olmalıdır. durumunda boş bir liste döndürüyoruz
        review.rating = rating #review.rating'i rating'e ekle
    
    if 'comment' in data: #comment'in data'da olup olmadığını kontrol ediyoruz
        review.comment = data['comment'] #review.comment'i comment'e ekle
    
    db.session.commit() #commit işlemi yap
    
    return jsonify(review.to_dict()) #review.to_dict()'yi alıyoruz

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
    
    # Kullanıcının kursun eğitmeni olup olmadığını kontrol et
    if int(course.instructor_id) != current_user_id:  # Her iki değeri de integer olarak karşılaştır
        return jsonify({'error': 'Bu değerlendirmeye yanıt veremezsiniz.'}), 403
    
    data = request.get_json()
    
    if not data or 'reply' not in data:
        return jsonify({'error': 'Yanıt metni zorunludur.'}), 400
    
    # Yanıtı kaydet
    review.instructor_reply = data['reply']
    review.instructor_reply_date = datetime.now(TURKEY_TZ)
    
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
        
    media_updates = []
    
    # Video yükleme
    if 'video' in request.files:
        video_file = request.files['video']
        # upload_video_local returns only the video_url
        video_url = upload_video_local(video_file)
        if video_url:
            # Save only the video URL
            lesson.video_url = video_url
            # Remove thumbnail logic
            media_updates.append({'type': 'video', 'url': video_url})
            
    # Döküman yükleme
    if 'document' in request.files:
        document_file = request.files['document']
        # upload_document_local returns only the doc_url
        document_url = upload_document_local(document_file) 
        if document_url:
            # Döküman URL'ini veritabanına kaydet
            new_document = LessonDocument(
                lesson_id=lesson.id,
                file_url=document_url,
                file_name=secure_filename(document_file.filename) # Use secure_filename
            )
            db.session.add(new_document)
            media_updates.append({'type': 'document', 'url': document_url})
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Medya başarıyla yüklendi',
            'media': media_updates
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading media for lesson {lesson_id}: {e}")
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
            # Kursa kayıtlı öğrencilere bildirim gönder
            enrollments = Enrollment.query.filter_by(course_id=course_id).all()
            for enrollment in enrollments:
                notification = Notification(
                    user_id=enrollment.student_id,
                    course_id=course_id,
                    type='new_quiz',
                    title=f'Yeni Quiz: {quiz.title}',
                    message=f'{course.title} kursuna yeni bir quiz eklendi: {quiz.title}',
                    is_read=False,
                    created_at=datetime.now(TURKEY_TZ),
                    reference_id=quiz.id
                )
                db.session.add(notification)
            
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
        
        # Quiz denemesi oluştur
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=current_user_id,
            started_at=datetime.now(TURKEY_TZ)
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
        attempt.completed_at = datetime.now(TURKEY_TZ)
        attempt.score = (total_points / max_points * 100) if max_points > 0 else 0
        
        # Kurs ve quiz bilgilerini al
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Öğrenci bilgilerini al
        student = User.query.get(current_user_id)
        
        # Instructor'a bildirim gönder
        instructor_notification = Notification(
            user_id=course.instructor_id,
            course_id=course_id,
            type='quiz_submitted',
            title=f'Yeni Quiz Tamamlandı: {quiz.title}',
            message=f'{student.username} adlı öğrenci "{course.title}" kursundaki "{quiz.title}" quiz\'ini tamamladı. Puan: %{attempt.score:.1f}',
            is_read=False,
            created_at=datetime.now(TURKEY_TZ),
            reference_id=quiz_id
        )
        db.session.add(instructor_notification)
        
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
    
    # Kursa kayıtlı öğrencilere bildirim gönder
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    for enrollment in enrollments:
        notification = Notification(
            user_id=enrollment.student_id,
            course_id=course_id,
            type='new_assignment',
            title=f'Yeni Ödev: {assignment.title}',
            message=f'{course.title} kursuna yeni bir ödev eklendi: {assignment.title}. Son teslim tarihi: {assignment.due_date.strftime("%d.%m.%Y %H:%M")}',
            is_read=False,
            created_at=datetime.now(TURKEY_TZ),
            reference_id=assignment.id
        )
        db.session.add(notification)
    
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
    
    # Ödevin son tarihini kontrol et - Hata düzeltmesi: timezone bilgilerinin kontrolü
    now = datetime.now(TURKEY_TZ)
    # Eğer assignment.due_date zaten timezone bilgisine sahipse kullan, değilse UTC ekle
    due_date = assignment.due_date if assignment.due_date.tzinfo else assignment.due_date.replace(tzinfo=UTC)
    
    if due_date < now:
        return jsonify({"error": "Bu ödev için son teslim tarihi geçmiş. Artık gönderim yapamazsınız."}), 400
    
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
    
    # Kurs ve ders bilgilerini al
    course = Course.query.get_or_404(course_id)
    lesson = Lesson.query.get_or_404(lesson_id)
    
    # Öğrenci bilgilerini al
    student = User.query.get(current_user_id)
    
    # Instructor'a bildirim gönder
    instructor_notification = Notification(
        user_id=course.instructor_id,
        course_id=course_id,
        type='assignment_submitted',
        title=f'Yeni Ödev Gönderimi: {assignment.title}',
        message=f'{student.username} adlı öğrenci "{course.title}" kursundaki "{assignment.title}" ödevini gönderdi.',
        is_read=False,
        created_at=now,
        reference_id=assignment_id
    )
    db.session.add(instructor_notification)
    
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
    submission.graded_at = datetime.now(TURKEY_TZ)
    
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
        submission.graded_at = datetime.now(TURKEY_TZ)
        
        # Öğrenciye bildirim gönder
        notification = Notification(
            user_id=submission.user_id,
            course_id=course_id,
            type='assignment_graded',
            title=f'Ödev Değerlendirildi: {assignment.title}',
            message=f'{course.title} kursundaki {assignment.title} ödevinden {submission.grade:.1f} puan aldınız.' + 
                    (f'\n\nGeri Bildirim:\n{submission.feedback}' if submission.feedback else ''),
            is_read=False,
            created_at=datetime.now(TURKEY_TZ)
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
    try:
        current_user_id = get_jwt_identity()
        
        # Sayfalandırma parametrelerini al ve doğrula
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        if page < 1:
            return jsonify({'message': 'Sayfa numarası 1 veya daha büyük olmalıdır'}), 400
        if per_page < 1:
            return jsonify({'message': 'Sayfa boyutu 1 veya daha büyük olmalıdır'}), 400
        
        # Filtreleme parametrelerini al
        course_id = request.args.get('course_id', type=int)
        notification_type = request.args.get('type')
        since = request.args.get('since')
        
        # Base query oluştur
        base_query = db.select(Notification).filter_by(
            user_id=current_user_id,
            is_read=False
        )
        
        # Kurs filtresi
        if course_id:
            base_query = base_query.filter_by(course_id=course_id)
            
        # Tip filtresi
        if notification_type:
            base_query = base_query.filter_by(type=notification_type)
            
        # Tarih filtresi
        if since:
            now = datetime.now(TURKEY_TZ)
            if since == '24h':
                since_date = now - timedelta(hours=24)
            elif since == '7d':
                since_date = now - timedelta(days=7)
            elif since == '30d':
                since_date = now - timedelta(days=30)
            else:
                return jsonify({'message': 'Geçersiz tarih filtresi. Geçerli değerler: 24h, 7d, 30d'}), 400
            
            # Tarih aralığı kontrolü - tam gün karşılaştırması için
            since_date = since_date.replace(hour=0, minute=0, second=0, microsecond=0)
            base_query = base_query.filter(Notification.created_at >= since_date)
        
        # Toplam kayıt sayısını al
        count_query = db.select(db.func.count()).select_from(Notification)
        for criterion in base_query.whereclause.clauses:
            count_query = count_query.where(criterion)
        total_count = db.session.scalar(count_query)
        
        # Sayfalandırılmış ve sıralanmış sonuçları al
        notifications = db.session.scalars(
            base_query.order_by(Notification.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        ).all()
        
        # Bildirimleri temizle ve dönüştür
        notification_list = []
        for notification in notifications:
            notification_dict = notification.to_dict()
            notification_dict['message'] = sanitize_html(notification_dict['message'])
            notification_list.append(notification_dict)
        
        # Toplam sayfa sayısını hesapla
        total_pages = (total_count + per_page - 1) // per_page
        
        return jsonify({
            'notifications': notification_list,
            'count': len(notification_list),
            'total_count': total_count,
            'current_page': page,
            'total_pages': total_pages,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/notifications/mark-selected-read', methods=['POST']) 
@jwt_required() 
def mark_selected_notifications_read():
    try:
        current_user_id = get_jwt_identity()
        notification_ids = request.json.get('notification_ids', [])
        
        if not notification_ids:
            return jsonify({'message': 'İşaretlenecek bildirim seçilmedi'}), 400
            
        now = datetime.now(TURKEY_TZ)
        
        # Seçili bildirimleri güncelle
        result = db.session.execute(
            db.update(Notification)
            .where(
                Notification.id.in_(notification_ids),
                Notification.user_id == current_user_id,
                Notification.is_read == False
            )
            .values(is_read=True, read_at=now)
        )
        
        db.session.commit()
        
        updated_count = result.rowcount
        return jsonify({
            'message': f'{updated_count} bildirim okundu olarak işaretlendi',
            'updated_count': updated_count
        })
        
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    try:
        current_user_id = get_jwt_identity()
        
        
        stmt = db.select(Notification).where(
            Notification.id == notification_id
        ).with_for_update(nowait=True)
        
        try:
            notification = db.session.execute(stmt).scalar_one()
        except exc.NoResultFound:
            return jsonify({'message': 'Notification not found'}), 404
        except exc.OperationalError as e:
            if 'could not obtain lock' in str(e).lower():
                return jsonify({'message': 'Notification is being processed by another request'}), 409
            raise
            
        
        if str(notification.user_id) != str(current_user_id):
            return jsonify({'message': 'You do not have permission to read this notification'}), 403
            
        
        if notification.is_read:
            return jsonify({'message': 'Notification is already marked as read'}), 409
            
    
        notification.is_read = True
        notification.read_at = datetime.now(TURKEY_TZ)
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({'message': 'An error occurred while processing the request'}), 500

@courses.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    try:
        current_user_id = get_jwt_identity()
        now = datetime.now(TURKEY_TZ)
        
        # Tüm okunmamış bildirimleri güncelle
        result = db.session.execute(
            db.update(Notification)
            .where(
                Notification.user_id == current_user_id,
                Notification.is_read == False
            )
            .values(is_read=True, read_at=now)
        )
        
        db.session.commit()
        
        updated_count = result.rowcount
        return jsonify({
            'message': f'{updated_count} bildirim okundu olarak işaretlendi',
            'updated_count': updated_count
        })
        
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

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
        quiz_attempt.completed_at = datetime.now(TURKEY_TZ)
        
        # Öğrenciye bildirim gönder
        notification = Notification(
            user_id=quiz_attempt.user_id,
            course_id=course_id,
            type='quiz_graded',
            title=f'Quiz Değerlendirildi: {quiz_attempt.quiz.title}',
            message=f'{course.title} kursundaki {quiz_attempt.quiz.title} quiz\'inden {quiz_attempt.score:.1f}% aldınız.',
            is_read=False,
            created_at=datetime.now(TURKEY_TZ)
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
        
        if not course_ids:
            return jsonify({'message': 'Kayıtlı olduğunuz kurs bulunmamaktadır'}), 404
        
        # Yaklaşan ödevleri bul (3 gün içinde teslim tarihi olanlar)
        now = datetime.now(TURKEY_TZ)
        three_days_later = now + timedelta(days=3)
        
        try:
            upcoming_assignments = db.session.scalars(
                db.select(Assignment)
                .join(Lesson)
                .options(db.joinedload(Assignment.lesson).joinedload(Lesson.course))
                .filter(
                    Lesson.course_id.in_(course_ids),
                    Assignment.due_date > now,
                    Assignment.due_date <= three_days_later
                )
            ).all()
                
        except Exception as e:
            return jsonify({'message': f'Ödevler yüklenirken hata oluştu: {str(e)}'}), 500
        
        # Teslim edilmemiş ödevler için bildirim oluştur
        notifications_created = 0
        created_notifications = []  # Oluşturulan bildirimleri takip et
        
        for assignment in upcoming_assignments:
            try:
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
                        # Tarihleri UTC'ye çevir
                        due_date = assignment.due_date if assignment.due_date.tzinfo else assignment.due_date.replace(tzinfo=UTC)
                        time_diff = due_date - now
                        days_left = time_diff.days
                        hours_left = (time_diff.seconds // 3600)
                        
                        try:
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
                            created_notifications.append(assignment.title)  # Ödev başlığını listeye ekle
                            
                        except Exception as e:
                            
                            continue
            except Exception as e:
                
                continue
        
        if notifications_created > 0:
            try:
                db.session.commit()
                # Oluşturulan bildirimlerin ödev başlıklarını mesaja ekle
                assignments_str = ", ".join(created_notifications)
                return jsonify({
                    'message': f'{notifications_created} adet yaklaşan ödev bildirimi oluşturuldu: {assignments_str}',
                    'notifications_count': notifications_created,
                    'assignments': created_notifications  # Ödev başlıklarını da döndür
                })
            except Exception as e:
                db.session.rollback()
                
                return jsonify({'message': f'Bildirimler kaydedilirken bir hata oluştu: {str(e)}'}), 500
        else:
            return jsonify({
                'message': 'Yaklaşan teslim tarihli ödev bulunamadı',
                'notifications_count': 0,
                'assignments': []  # Boş ödev listesi döndür
            })
            
    except Exception as e:
        
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/notifications/performance-test', methods=['POST'])
@jwt_required()
def create_test_notifications():
    """Performans testi için çok sayıda bildirim oluştur"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'Kullanıcı bulunamadı'}), 404

        # İstek parametrelerini al
        data = request.get_json()
        count = data.get('count', 100)  # Varsayılan 100 bildirim
        if count > 1000:  # Maksimum limit
            return jsonify({'message': 'En fazla 1000 test bildirimi oluşturulabilir'}), 400

        # Test bildirimlerini oluştur
        notifications = []
        now = datetime.now(TURKEY_TZ)
        for i in range(count):
            notification = Notification(
                user_id=current_user_id,
                course_id=data.get('course_id'),
                type='performance_test',
                title=f'Performance Test Notification {i+1}',
                message=f'Test Message {i+1}',
                is_read=False,
                created_at=now - timedelta(minutes=i)  # Her bildirim 1 dakika arayla
            )
            notifications.append(notification)

        # Bildirimleri veritabanına kaydet
        db.session.add_all(notifications)
        db.session.commit()

        # Performans metriklerini hesapla
        end_time = datetime.now(TURKEY_TZ)
        creation_time = (end_time - now).total_seconds()

        return jsonify({
            'message': f'{count} test bildirimi başarıyla oluşturuldu',
            'metrics': {
                'notification_count': count,
                'creation_time_seconds': creation_time,
                'notifications_per_second': count / creation_time if creation_time > 0 else count
            }
        })

    except Exception as e:
        db.session.rollback()
        
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/notifications/create-mixed', methods=['POST'])
@jwt_required()
def create_mixed_content_notification():
    """Farklı içerik türleri içeren bildirimler oluştur"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'Kullanıcı bulunamadı'}), 404

        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'message': 'İçerik gerekli'}), 400

        content = data['content']
        content_type = data.get('content_type', 'text')  # Varsayılan tip: text

        # Tehlikeli SQL anahtar kelimelerini kontrol et
        sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'ALTER', '--']
        if any(keyword.lower() in str(content).lower() for keyword in sql_keywords):
            return jsonify({'message': 'Güvenlik ihlali: SQL komutları içeremez'}), 400

        # İçerik tipine göre doğrulama ve temizleme
        if content_type == 'json':
            try:
                if isinstance(content, str):
                    content = json.loads(content)
                # JSON içeriğini recursive olarak kontrol et
                def sanitize_json(obj):
                    if isinstance(obj, dict):
                        return {k: sanitize_json(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [sanitize_json(item) for item in obj]
                    elif isinstance(obj, str):
                        # String içindeki tehlikeli karakterleri escape et
                        return html.escape(obj)
                    return obj
                content = sanitize_json(content)
                content = json.dumps(content)
            except json.JSONDecodeError:
                return jsonify({'message': 'Geçersiz JSON içeriği'}), 400

        elif content_type == 'html':
            # HTML içeriğini güvenli etiketlerle sınırla
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li']
            content = bleach.clean(content, tags=allowed_tags, strip=True)

        elif content_type == 'markdown':
            # Markdown içeriğindeki tehlikeli karakterleri escape et
            content = html.escape(content)
            # Kod bloklarını güvenli hale getir
            content = re.sub(r'```.*?```', lambda m: html.escape(m.group(0)), content, flags=re.DOTALL)

        elif content_type == 'url':
            # URL formatını ve güvenliğini kontrol et
            if not content.startswith(('http://', 'https://')):
                return jsonify({'message': 'Sadece HTTP ve HTTPS URL\'leri kabul edilir'}), 400
            # URL'deki tehlikeli karakterleri kontrol et
            if re.search(r'[<>"\']', content):
                return jsonify({'message': 'URL geçersiz karakterler içeriyor'}), 400
            # URL uzunluğunu kontrol et
            if len(content) > 2048:
                return jsonify({'message': 'URL çok uzun'}), 400

        elif content_type == 'base64':
            # Base64 formatını kontrol et
            try:
                if not content.startswith('data:'):
                    return jsonify({'message': 'Geçersiz Base64 formatı'}), 400
                # Base64 içeriğini decode et ve kontrol et
                header, encoded = content.split(',', 1)
                if not all(c in string.printable for c in encoded):
                    return jsonify({'message': 'Geçersiz Base64 içeriği'}), 400
            except Exception:
                return jsonify({'message': 'Geçersiz Base64 içeriği'}), 400

        # Bildirimi oluştur
        notification = Notification(
            user_id=current_user_id,
            course_id=data.get('course_id'),
            type=f'mixed_content_{content_type}',
            title=html.escape(data.get('title', f'Mixed Content: {content_type.upper()}')),
            message=content,
            is_read=False
        )
        
        db.session.add(notification)
        db.session.commit()

        return jsonify({
            'message': 'Bildirim başarıyla oluşturuldu',
            'notification': notification.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/notifications/cleanup', methods=['POST'])
@jwt_required()
def cleanup_old_notifications():
    """Clean up old notifications based on a threshold date"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        days_threshold = data.get('days_threshold', 90)  # Default 90 days

        if not isinstance(days_threshold, (int, float)) or days_threshold <= 0:
            return jsonify({'message': 'days_threshold must be a positive number'}), 400

        # Belirlenen gün sayısından daha eski bildirimleri sil
        threshold_date = datetime.now(TURKEY_TZ) - timedelta(days=days_threshold)

        # Delete old notifications that are read
        result = db.session.execute(
            db.delete(Notification)
            .where(
                Notification.user_id == current_user_id,
                Notification.is_read == True,
                Notification.created_at < threshold_date
            )
        )
        
        deleted_count = result.rowcount
        db.session.commit()

        return jsonify({
            'message': f'Successfully deleted {deleted_count} old notifications',
            'deleted_count': deleted_count,
            'threshold_date': threshold_date.isoformat()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error cleaning up old notifications: {str(e)}")
        return jsonify({'message': 'An error occurred while cleaning up notifications'}), 500

@courses.route('/notifications/bulk-update', methods=['POST'])
@jwt_required()
def bulk_update_notifications():
    """Toplu bildirim güncelleme endpoint'i"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'notification_ids' not in data:
            return jsonify({'message': 'notification_ids gereklidir'}), 400
            
        notification_ids = data.get('notification_ids', [])
        is_read = data.get('is_read')
        notification_type = data.get('type')
        
        if not notification_ids:
            return jsonify({'message': 'En az bir bildirim IDsi gereklidir'}), 400
            
        # Bildirimleri güncelle
        update_data = {}
        if is_read is not None:
            update_data['is_read'] = is_read
            if is_read:
                update_data['read_at'] = datetime.now(TURKEY_TZ)
        if notification_type:
            update_data['type'] = notification_type
            
        if not update_data:
            return jsonify({'message': 'Güncellenecek alan belirtilmedi'}), 400
            
        # Kullanıcının bildirimlerini güncelle
        result = db.session.execute(
            db.update(Notification)
            .where(
                Notification.id.in_(notification_ids),
                Notification.user_id == current_user_id
            )
            .values(**update_data)
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Bildirimler başarıyla güncellendi',
            'updated_count': result.rowcount
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating notifications: {str(e)}")
        return jsonify({'message': 'Bildirimler güncellenirken bir hata oluştu'}), 500

@courses.route('/', methods=['GET'])
@jwt_required()
def get_courses():
    try:
        current_app.logger.info('Getting all courses')
        
        # Veritabanı sorgusunu try-except bloğu içine al
        courses = db.session.execute(
            db.select(Course).order_by(Course.created_at.desc())
        ).scalars().all()
        
        current_app.logger.info(f'Found {len(courses)} courses')
        
        # Her bir kurs için detaylı bilgi logla
        course_list = []
        for course in courses:
            course_data = {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'instructor_id': course.instructor_id,
                'instructor_name': course.instructor.username,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'image_url': course.image_url if hasattr(course, 'image_url') else None,
                'price': course.price,
                'category': course.category,
                'level': course.level
            }
            current_app.logger.info(f'Course details: {course_data}')
            course_list.append(course_data)

        return jsonify(course_list), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error fetching courses: {str(e)}")
        return jsonify({'message': 'Kurslar yüklenirken bir hata oluştu', 'error': str(e)}), 500

@courses.route('/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        instructor = User.query.get(course.instructor_id)
        
        # Kurs detaylarını döndür
        return jsonify({
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'category': course.category,
            'level': course.level,
            'price': course.price,
            'instructor_id': course.instructor_id,
            'instructor_name': instructor.username if instructor else None,
            'created_at': course.created_at.isoformat() if course.created_at else None,
            'updated_at': course.updated_at.isoformat() if course.updated_at else None,
            'image_url': getattr(course, 'image_url', None)  # Güvenli bir şekilde image_url'i al
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching course {course_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch course details'}), 500 

@courses.route('/<int:course_id>/lessons/<int:lesson_id>', methods=['DELETE'])
@jwt_required()
def delete_lesson(course_id, lesson_id):
    """Dersi sil"""
    try:
        # Kursu ve dersi kontrol et
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Eğitmen yetkisi kontrolü
        current_user_id = get_jwt_identity()
        if course.instructor_id != int(current_user_id):
            return jsonify({'error': 'Bu dersi silme yetkiniz yok'}), 403
            
        # İlişkili belgeleri sil
        documents = LessonDocument.query.filter_by(lesson_id=lesson_id).all()
        for document in documents:
            db.session.delete(document)
            
        # İlişkili quizleri sil
        quizzes = Quiz.query.filter_by(lesson_id=lesson_id).all()
        for quiz in quizzes:
            # Quiz sorularını ve cevaplarını sil
            questions = QuizQuestion.query.filter_by(quiz_id=quiz.id).all()
            for question in questions:
                # Sorunun şıklarını sil
                options = QuizOption.query.filter_by(question_id=question.id).all()
                for option in options:
                    db.session.delete(option)
                db.session.delete(question)
                
            # Quiz denemelerini sil
            attempts = QuizAttempt.query.filter_by(quiz_id=quiz.id).all()
            for attempt in attempts:
                # Denemeye ait cevapları sil
                answers = QuizAnswer.query.filter_by(attempt_id=attempt.id).all()
                for answer in answers:
                    db.session.delete(answer)
                db.session.delete(attempt)
                
            db.session.delete(quiz)
            
        # İlişkili ödevleri sil
        assignments = Assignment.query.filter_by(lesson_id=lesson_id).all()
        for assignment in assignments:
            # Ödev gönderimlerini sil
            submissions = AssignmentSubmission.query.filter_by(assignment_id=assignment.id).all()
            for submission in submissions:
                db.session.delete(submission)
            db.session.delete(assignment)
        
        # Dersi sil
        db.session.delete(lesson)
        db.session.commit()
        
        return jsonify({
            'message': 'Ders ve ilişkili tüm içerikler başarıyla silindi'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting lesson {lesson_id} for course {course_id}: {str(e)}")
        return jsonify({'error': f'Ders silinirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>', methods=['GET'])
@jwt_required()
def get_lesson(course_id, lesson_id):
    """Belirli bir dersin detaylarını getir"""
    try:
        # Kursu ve dersi kontrol et
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Dersin bu kursa ait olduğunu kontrol et
        if lesson.course_id != course_id:
            return jsonify({'error': 'Bu ders bu kursa ait değil'}), 400
            
        # Derse ait belgeleri getir
        documents = LessonDocument.query.filter_by(lesson_id=lesson_id).all()
        document_list = [doc.to_dict() for doc in documents]
        
        # Derse ait quizleri getir
        quizzes = Quiz.query.filter_by(lesson_id=lesson_id).all()
        quiz_list = [quiz.to_dict() for quiz in quizzes]
        
        # Derse ait ödevleri getir
        assignments = Assignment.query.filter_by(lesson_id=lesson_id).all()
        assignment_list = [assignment.to_dict() for assignment in assignments]
        
        # Ders detaylarını döndür
        lesson_data = lesson.to_dict()
        lesson_data.update({
            'documents': document_list,
            'quizzes': quiz_list,
            'assignments': assignment_list
        })
        
        return jsonify(lesson_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching lesson {lesson_id} for course {course_id}: {str(e)}")
        return jsonify({'error': f'Ders getirilirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>', methods=['PUT'])
@jwt_required()
def update_lesson(course_id, lesson_id):
    """Dersi güncelle"""
    try:
        # Kursu ve dersi kontrol et
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Eğitmen yetkisi kontrolü
        current_user_id = get_jwt_identity()
        if course.instructor_id != int(current_user_id):
            return jsonify({'error': 'Bu dersi güncelleme yetkiniz yok'}), 403
            
        # Dersin bu kursa ait olduğunu kontrol et
        if lesson.course_id != course_id:
            return jsonify({'error': 'Bu ders bu kursa ait değil'}), 400
            
        # İstek verilerini al
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Güncelleme için veri gerekli'}), 400
            
        # Değişiklikleri kaydet
        changes = []
        
        if 'title' in data and data['title'] != lesson.title:
            lesson.title = data['title']
            changes.append('Ders başlığı güncellendi')
            
        if 'content' in data and data['content'] != lesson.content:
            lesson.content = data['content']
            changes.append('Ders içeriği güncellendi')
            
        if 'order' in data and data['order'] != lesson.order:
            lesson.order = data['order']
            changes.append('Ders sırası güncellendi')
            
        # Değişiklik yapıldıysa
        if changes:
            lesson.updated_at = datetime.now(TURKEY_TZ)
            
            # Kursa kayıtlı öğrencilere bildirim gönder
            enrollments = Enrollment.query.filter_by(course_id=course_id).all()
            for enrollment in enrollments:
                notification = Notification(
                    user_id=enrollment.student_id,
                    course_id=course_id,
                    type='lesson_update',
                    title=f'Ders Güncellendi: {lesson.title}',
                    message=f'{course.title} kursundaki {lesson.title} dersi güncellendi.',
                    is_read=False,
                    created_at=datetime.now(TURKEY_TZ)
                )
                db.session.add(notification)
                
        db.session.commit()
        
        return jsonify({
            'message': 'Ders başarıyla güncellendi' if changes else 'Değişiklik yapılmadı',
            'lesson': lesson.to_dict(),
            'changes': changes
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating lesson {lesson_id} for course {course_id}: {str(e)}")
        return jsonify({'error': f'Ders güncellenirken bir hata oluştu: {str(e)}'}), 500
        
@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quizzes', methods=['GET'])
@jwt_required()
def get_lesson_quizzes(course_id, lesson_id):
    """Derse ait tüm quizleri getir"""
    try:
        # Kursu ve dersi kontrol et
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Dersin bu kursa ait olduğunu kontrol et
        if lesson.course_id != course_id:
            return jsonify({'error': 'Bu ders bu kursa ait değil'}), 400
        
        # Derse ait quizleri getir
        quizzes = Quiz.query.filter_by(lesson_id=lesson_id).all()
        quiz_list = [quiz.to_dict() for quiz in quizzes]
        
        return jsonify(quiz_list), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching quizzes for lesson {lesson_id} in course {course_id}: {str(e)}")
        return jsonify({'error': f'Quizler getirilirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz/<int:quiz_id>', methods=['DELETE'])
@jwt_required()
def delete_quiz(course_id, lesson_id, quiz_id):
    """Quiz'i sil"""
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu quizi silme yetkiniz yok'}), 403
        
        lesson = Lesson.query.get_or_404(lesson_id)
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
            
        # Quiz'i bul
        quiz = Quiz.query.get_or_404(quiz_id)
        if quiz.lesson_id != lesson_id:
            return jsonify({'message': 'Quiz bu derse ait değil'}), 400
        
        # Önce tüm quiz denemelerini ve cevapları sil
        attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id).all()
        for attempt in attempts:
            # Denemeye ait cevapları sil
            answers = QuizAnswer.query.filter_by(attempt_id=attempt.id).all()
            for answer in answers:
                db.session.delete(answer)
            db.session.delete(attempt)
            
        # Cevaplar silindikten sonra quiz sorularını sil
        questions = QuizQuestion.query.filter_by(quiz_id=quiz_id).all()
        for question in questions:
            # Sorunun şıklarını sil
            options = QuizOption.query.filter_by(question_id=question.id).all()
            for option in options:
                db.session.delete(option)
            db.session.delete(question)
        
        # Son olarak quiz'i sil
        db.session.delete(quiz)
        db.session.commit()
        
        return jsonify({'message': 'Quiz başarıyla silindi'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting quiz {quiz_id} for lesson {lesson_id}: {str(e)}")
        return jsonify({'message': f'Quiz silinirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(course_id, lesson_id, quiz_id):
    """Quiz detaylarını getir"""
    try:
        # Kursu ve dersi kontrol et
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Dersin bu kursa ait olduğunu kontrol et
        if lesson.course_id != course_id:
            return jsonify({'error': 'Bu ders bu kursa ait değil'}), 400
            
        # Quiz'i bul (get_or_404 yerine get kullanılıyor)
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'error': 'Quiz bulunamadı', 'not_found': True}), 404
            
        if quiz.lesson_id != lesson_id:
            return jsonify({'error': 'Quiz bu derse ait değil'}), 400
            
        # Quiz sorularını ve seçeneklerini getir
        questions = []
        for question in quiz.questions:
            question_data = question.to_dict()
            questions.append(question_data)
            
        # Quiz detaylarını döndür
        quiz_data = quiz.to_dict()
        quiz_data['questions'] = questions
        
        return jsonify(quiz_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching quiz {quiz_id} for lesson {lesson_id}: {str(e)}")
        return jsonify({'error': f'Quiz getirilirken bir hata oluştu', 'details': str(e)}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/quiz/<int:quiz_id>', methods=['PUT'])
@jwt_required()
def update_quiz(course_id, lesson_id, quiz_id):
    """Quiz'i güncelle"""
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu quizi güncelleme yetkiniz yok'}), 403
        
        lesson = Lesson.query.get_or_404(lesson_id)
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
            
        # Quiz'i bul
        quiz = Quiz.query.get_or_404(quiz_id)
        if quiz.lesson_id != lesson_id:
            return jsonify({'message': 'Quiz bu derse ait değil'}), 400
        
        data = request.get_json()
        if not data or not data.get('title') or not data.get('questions'):
            return jsonify({'message': 'Quiz başlığı ve en az bir soru gerekli'}), 400
        
        # Quiz'i güncelle
        quiz.title = data['title']
        quiz.description = data.get('description', '')
        quiz.time_limit = data.get('time_limit')
        quiz.passing_score = data.get('passing_score', 60)
        
        # Mevcut soruları ve seçenekleri sil
        for question in quiz.questions:
            for option in question.options:
                db.session.delete(option)
            db.session.delete(question)
        
        # Yeni soruları ekle
        for q_data in data['questions']:
            question = QuizQuestion(
                quiz=quiz,
                question_text=q_data['question_text'],
                question_type=q_data.get('question_type', 'multiple_choice'),
                points=q_data.get('points', 10)
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
                'message': 'Quiz başarıyla güncellendi',
                'quiz': {
                    'id': quiz.id,
                    'title': quiz.title,
                    'description': quiz.description,
                    'time_limit': quiz.time_limit,
                    'passing_score': quiz.passing_score,
                    'question_count': len(data['questions'])
                }
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Quiz güncellenirken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignments', methods=['GET'])
@jwt_required()
def get_lesson_assignments(course_id, lesson_id):
    """Ders için tüm ödevleri getir"""
    try:
        # Dersi ve kursu kontrol et
        lesson = Lesson.query.get_or_404(lesson_id)
        course = Course.query.get_or_404(course_id)
        
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
        
        # Dersin tüm ödevlerini getir
        assignments = Assignment.query.filter_by(lesson_id=lesson_id).all()
        
        # Ödevleri JSON formatına dönüştür
        assignments_data = []
        for assignment in assignments:
            assignments_data.append({
                'id': assignment.id,
                'title': assignment.title,
                'description': assignment.description,
                'due_date': assignment.due_date.isoformat(),
                'max_points': assignment.max_points,
                'created_at': assignment.created_at.isoformat(),
                'updated_at': assignment.created_at.isoformat(),
                'lesson_id': assignment.lesson_id
            })
        
        return jsonify(assignments_data)
        
    except Exception as e:
        return jsonify({'message': f'Ödevler yüklenirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>', methods=['GET'])
@jwt_required()
def get_assignment(course_id, lesson_id, assignment_id):
    """Belirli bir ödevi getir"""
    try:
        # Dersi ve kursu kontrol et
        lesson = Lesson.query.get_or_404(lesson_id)
        course = Course.query.get_or_404(course_id)
        
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
            
        # Ödevi getir
        assignment = Assignment.query.get_or_404(assignment_id)
        
        if assignment.lesson_id != lesson_id:
            return jsonify({'message': 'Ödev bu derse ait değil'}), 400
            
        return jsonify(assignment.to_dict())
        
    except Exception as e:
        return jsonify({'message': f'Ödev yüklenirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>/submissions', methods=['GET'])
@jwt_required()
def get_assignment_submissions(course_id, lesson_id, assignment_id):
    """Ödev için tüm gönderileri getir"""
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu ödev gönderilerini görüntüleme yetkiniz yok'}), 403
        
        lesson = Lesson.query.get_or_404(lesson_id)
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
            
        assignment = Assignment.query.get_or_404(assignment_id)
        if assignment.lesson_id != lesson_id:
            return jsonify({'message': 'Ödev bu derse ait değil'}), 400
        
        # Tüm gönderileri getir
        submissions = AssignmentSubmission.query.filter_by(assignment_id=assignment_id).all()
        
        submissions_data = []
        for submission in submissions:
            submissions_data.append({
                'id': submission.id,
                'assignment_id': submission.assignment_id,
                'user_id': submission.user_id,
                'submission_text': submission.submission_text,
                'file_url': submission.file_url,
                'submitted_at': submission.submitted_at.isoformat(),
                'grade': submission.grade,
                'feedback': submission.feedback,
                'graded_at': submission.graded_at.isoformat() if submission.graded_at else None
            })
        
        return jsonify(submissions_data)
        
    except Exception as e:
        return jsonify({'message': f'Ödev gönderileri yüklenirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_assignment(course_id, lesson_id, assignment_id):
    """Ödevi sil"""
    try:
        # Eğitmen kontrolü
        current_user_id = get_jwt_identity()
        course = Course.query.get_or_404(course_id)
        
        if str(course.instructor_id) != current_user_id:
            return jsonify({'message': 'Bu ödevi silme yetkiniz yok'}), 403
        
        lesson = Lesson.query.get_or_404(lesson_id)
        if lesson.course_id != course_id:
            return jsonify({'message': 'Ders bu kursa ait değil'}), 400
            
        assignment = Assignment.query.get_or_404(assignment_id)
        if assignment.lesson_id != lesson_id:
            return jsonify({'message': 'Ödev bu derse ait değil'}), 400
        
        # Ödeve ait tüm gönderileri sil
        submissions = AssignmentSubmission.query.filter_by(assignment_id=assignment_id).all()
        for submission in submissions:
            db.session.delete(submission)
        
        # Ödevi sil
        db.session.delete(assignment)
        db.session.commit()
        
        return jsonify({'message': 'Ödev başarıyla silindi'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Ödev silinirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/lessons/<int:lesson_id>/assignment/<int:assignment_id>/my-submission', methods=['GET'])
@jwt_required()
def get_user_assignment_submission(course_id, lesson_id, assignment_id):
    """Öğrencinin kendi ödev gönderimini görüntüle"""
    try:
        current_user_id = int(get_jwt_identity())
        
        # Kurs ve derse erişim kontrolü
        enrollment = Enrollment.query.filter_by(course_id=course_id, student_id=current_user_id).first()
        if not enrollment:
            return jsonify({'error': 'Bu kursa kayıtlı değilsiniz'}), 403
            
        # Ödev kontrolü
        assignment = Assignment.query.get_or_404(assignment_id)
        if assignment.lesson_id != lesson_id:
            return jsonify({'error': 'Ödev bu derse ait değil'}), 404
            
        # Kullanıcının gönderisini bul
        submission = AssignmentSubmission.query.filter_by(
            assignment_id=assignment_id, 
            user_id=current_user_id
        ).order_by(AssignmentSubmission.submitted_at.desc()).first()
        
        if not submission:
            return jsonify({'error': 'Henüz bir ödev gönderimi yapmadınız'}), 404
            
        # Yanıtı güvenli bir şekilde hazırla
        submission_data = {
            'id': submission.id,
            'assignment_id': submission.assignment_id,
            'user_id': submission.user_id,
            'submission_text': submission.submission_text,
            'file_url': submission.file_url,
            'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
            'grade': submission.grade,
            'feedback': submission.feedback,
            'graded_at': None
        }
        
        # graded_at değerini güvenli bir şekilde ekle
        if submission.graded_at:
            try:
                submission_data['graded_at'] = submission.graded_at.isoformat()
            except:
                submission_data['graded_at'] = str(submission.graded_at)
        
        return jsonify(submission_data)
        
    except Exception as e:
        import traceback
        return jsonify({'error': f'Ödev gönderimi yüklenirken bir hata oluştu: {str(e)}'}), 500

@courses.route('/<int:course_id>/enrollment-status', methods=['GET'])
@jwt_required()
def check_enrollment_status(course_id):
    """Öğrencinin kursa kayıt durumunu kontrol et"""
    current_user_id = get_jwt_identity()
    
    # Kullanıcının öğrenci olup olmadığını kontrol et
    user = User.query.get(current_user_id)
    if not user or user.role != 'student':
        return jsonify({'is_enrolled': False}), 200
    
    # Öğrencinin kursa kayıtlı olup olmadığını kontrol et
    enrollment = Enrollment.query.filter_by(
        student_id=current_user_id,
        course_id=course_id
    ).first()
    
    is_enrolled = enrollment is not None
    
    return jsonify({'is_enrolled': is_enrolled}), 200

@courses.route('/<int:course_id>/assignments', methods=['GET', 'POST'])
@jwt_required()
def course_assignments(course_id):
    """Kurs için tüm ödevleri getir veya yeni ödev oluştur"""
    try:
        # Kursu kontrol et
        course = Course.query.get_or_404(course_id)
        
        if request.method == 'GET':
            # Kursun tüm derslerini bul
            lessons = Lesson.query.filter_by(course_id=course_id).all()
            lesson_ids = [lesson.id for lesson in lessons]
            
            if not lesson_ids:
                return jsonify([])
            
            # Derslere ait tüm ödevleri getir
            assignments = Assignment.query.filter(Assignment.lesson_id.in_(lesson_ids)).all()
            
            # Ödevleri JSON formatına dönüştür
            assignments_data = []
            for assignment in assignments:
                assignments_data.append({
                    'id': assignment.id,
                    'title': assignment.title,
                    'description': assignment.description,
                    'due_date': assignment.due_date.isoformat(),
                    'max_points': assignment.max_points,
                    'created_at': assignment.created_at.isoformat(),
                    'updated_at': assignment.created_at.isoformat(),
                    'lesson_id': assignment.lesson_id
                })
            
            return jsonify(assignments_data)
        
        elif request.method == 'POST':
            
            # Eğitmen kontrolü
            current_user_id = get_jwt_identity()
            if str(course.instructor_id) != current_user_id:
                return jsonify({'message': 'Bu kursa ödev ekleme yetkiniz yok'}), 403
            
            data = request.get_json()
            if not data or 'title' not in data or 'description' not in data or 'due_date' not in data or 'lesson_id' not in data:
                return jsonify({'message': 'Ödev başlığı, açıklaması, dersi ve son tarihi zorunludur'}), 400
            
            # Dersi kontrol et
            lesson = Lesson.query.get(data['lesson_id'])
            if not lesson or lesson.course_id != course_id:
                return jsonify({'message': 'Geçersiz ders seçimi'}), 400
            
            try:
                # Ödev oluştur
                assignment = Assignment(
                    title=data['title'],
                    description=data['description'],
                    lesson_id=data['lesson_id'],
                    due_date=datetime.fromisoformat(data['due_date']),
                    max_points=data.get('max_points', 100)
                )
                
                db.session.add(assignment)
                
                # Kursa kayıtlı öğrencilere bildirim gönder
                enrollments = Enrollment.query.filter_by(course_id=course_id).all()
                for enrollment in enrollments:
                    notification = Notification(
                        user_id=enrollment.student_id,
                        course_id=course_id,
                        type='new_assignment',
                        title=f'Yeni Ödev: {assignment.title}',
                        message=f'{course.title} kursuna yeni bir ödev eklendi: {assignment.title}. Son teslim tarihi: {assignment.due_date.strftime("%d.%m.%Y %H:%M")}',
                        is_read=False,
                        created_at=datetime.now(TURKEY_TZ),
                        reference_id=assignment.id
                    )
                    db.session.add(notification)
                
                db.session.commit()
                
                return jsonify({
                    'id': assignment.id,
                    'title': assignment.title,
                    'description': assignment.description,
                    'due_date': assignment.due_date.isoformat(),
                    'max_points': assignment.max_points,
                    'lesson_id': assignment.lesson_id,
                    'created_at': assignment.created_at.isoformat(),
                    'updated_at': assignment.created_at.isoformat()
                }), 201
                
            except Exception as e:
                db.session.rollback()
                return jsonify({'message': f'Ödev oluşturulurken bir hata oluştu: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'message': f'Bir hata oluştu: {str(e)}'}), 500