from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Course, Lesson, User

courses = Blueprint('courses', __name__)

def is_instructor(user_id):
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
    
    db.session.add(course)
    db.session.commit()
    
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
    
    db.session.commit()
    
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
    
    db.session.delete(course)
    db.session.commit()
    
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
    
    db.session.add(lesson)
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson added successfully',
        'lesson': {
            'id': lesson.id,
            'title': lesson.title,
            'order': lesson.order
        }
    }), 201 