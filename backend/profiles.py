from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash  # imported for model compatibility, but using User methods
from models import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

profiles = Blueprint('profiles', __name__)

@profiles.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'role': current_user.role,
        'created_at': current_user.created_at.isoformat()
    })

@profiles.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    data = request.get_json() # JSON formatında veri al
    
    if not data: # Veri yoksa hata döndür
        return jsonify({'message': 'No data provided'}), 400
    
    # Email değişikliği varsa, yeni email'in başka bir kullanıcı tarafından kullanılmadığından emin ol
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already in use'}), 400
        current_user.email = data['email']
    
    # Kullanıcı adı değişikliği varsa, yeni kullanıcı adının başka bir kullanıcı tarafından kullanılmadığından emin ol
    if 'username' in data and data['username'] != current_user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already in use'}), 400
        current_user.username = data['username']
    
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({
        'message': 'Profile updated successfully',
        'profile': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'role': current_user.role,
            'created_at': current_user.created_at.isoformat()
        }
    })

@profiles.route('/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    data = request.get_json() # JSON formatında veri al
    
    if not data or 'current_password' not in data or 'new_password' not in data: # Şifre değiştirme için gerekli veri yoksa hata döndür
        return jsonify({'message': 'Current password and new password are required'}), 400
    
    if not current_user.check_password(data['current_password']): # Şifre yanlışsa hata döndür
        return jsonify({'message': 'Current password is incorrect'}), 401
    
    current_user.set_password(data['new_password']) # Yeni şifreyi hash'liyoruz.
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({'message': 'Password updated successfully'}) # Şifre değiştirme işlemi başarılıysa mesaj döndür

@profiles.route('/instructor/profile', methods=['GET'])
@jwt_required()
def get_instructor_profile():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user is an instructor
    if current_user.role != 'instructor':
        return jsonify({'message': 'Unauthorized. User is not an instructor'}), 403
    
    # Fetch instructor profile data
    # You might need to expand this to include additional instructor-specific fields
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'role': current_user.role,
        'bio': getattr(current_user, 'bio', ''),
        'expertise': getattr(current_user, 'expertise', ''),
        'socialMediaLinks': {
            'website': getattr(current_user, 'website', ''),
            'linkedin': getattr(current_user, 'linkedin', ''),
            'twitter': getattr(current_user, 'twitter', '')
        },
        'created_at': current_user.created_at.isoformat()
    })

@profiles.route('/instructor/profile', methods=['PUT'])
@jwt_required()
def update_instructor_profile():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user is an instructor
    if current_user.role != 'instructor':
        return jsonify({'message': 'Unauthorized. User is not an instructor'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Update basic profile information
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already in use'}), 400
        current_user.email = data['email']
    
    if 'username' in data and data['username'] != current_user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already in use'}), 400
        current_user.username = data['username']
    
    # Update instructor-specific fields
    if 'bio' in data:
        current_user.bio = data['bio']
    
    if 'expertise' in data:
        current_user.expertise = data['expertise']
    
    # Update social media links if provided
    if 'socialMediaLinks' in data:
        social_links = data['socialMediaLinks']
        if 'website' in social_links:
            current_user.website = social_links['website']
        if 'linkedin' in social_links:
            current_user.linkedin = social_links['linkedin']
        if 'twitter' in social_links:
            current_user.twitter = social_links['twitter']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Instructor profile updated successfully',
        'profile': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'role': current_user.role,
            'bio': getattr(current_user, 'bio', ''),
            'expertise': getattr(current_user, 'expertise', ''),
            'socialMediaLinks': {
                'website': getattr(current_user, 'website', ''),
                'linkedin': getattr(current_user, 'linkedin', ''),
                'twitter': getattr(current_user, 'twitter', '')
            },
            'created_at': current_user.created_at.isoformat()
        }
    })