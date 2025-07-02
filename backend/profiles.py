from flask import Blueprint, jsonify, request # Flask'ın Blueprint, jsonify ve request fonksiyonlarını import ediyoruz.
from werkzeug.security import generate_password_hash, check_password_hash  # imported for model compatibility, but using User methods
from models import db, User # models.py dosyasındaki db ve User modellerini import ediyoruz.
from flask_jwt_extended import jwt_required, get_jwt_identity # Flask-JWT-Extended'ın jwt_required ve get_jwt_identity fonksiyonlarını import ediyoruz.

profiles = Blueprint('profiles', __name__) # profiles blueprint'ini oluşturuyoruz.

@profiles.route('/profile', methods=['GET']) # Profili getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_profile(): # Profili getir
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    # Use the to_dict method to include all profile fields
    return jsonify(current_user.to_dict())

@profiles.route('/profile', methods=['PUT']) # Profili güncelle
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def update_profile(): # Profili güncelle
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    data = request.get_json() # JSON formatında veri al
    
    if not data: # Veri yoksa hata döndür
        return jsonify({'message': 'Veri sağlanmadı'}), 400
    
    # Email değişikliği varsa, yeni email'in başka bir kullanıcı tarafından kullanılmadığından emin ol
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Bu e-posta adresi zaten kullanılıyor'}), 400
        current_user.email = data['email']
    
    # Kullanıcı adı değişikliği varsa, yeni kullanıcı adının başka bir kullanıcı tarafından kullanılmadığından emin ol
    if 'username' in data and data['username'] != current_user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Bu kullanıcı adı zaten kullanılıyor'}), 400
        current_user.username = data['username']
    
    # Student profile fields
    if current_user.role == 'student':
        if 'interests' in data:
            current_user.interests = data['interests']
        if 'education_level' in data:
            current_user.education_level = data['education_level']
    
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({
        'message': 'Profil başarıyla güncellendi',
        'profile': current_user.to_dict()
    })

@profiles.route('/profile/password', methods=['PUT']) # Şifreyi değiştir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def change_password(): # Şifreyi değiştir
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    data = request.get_json() # JSON formatında veri al
    
    if not data or 'current_password' not in data or 'new_password' not in data: # Şifre değiştirme için gerekli veri yoksa hata döndür
        return jsonify({'message': 'Mevcut şifre ve yeni şifre gereklidir'}), 400
    
    if not current_user.check_password(data['current_password']): # Şifre yanlışsa hata döndür
        return jsonify({'message': 'Mevcut şifre yanlış'}), 401
    
    current_user.set_password(data['new_password']) # Yeni şifreyi hash'liyoruz.
    db.session.commit() # Değişiklikleri kaydediyoruz.
    
    return jsonify({'message': 'Şifre başarıyla güncellendi'}) # Şifre değiştirme işlemi başarılıysa mesaj döndür

@profiles.route('/instructor/profile', methods=['GET']) # Eğitmen profilini getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_instructor_profile(): # Eğitmen profilini getir
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    # Kullanıcının eğitmen olup olmadığını kontrol et
    if current_user.role != 'instructor':
        return jsonify({'message': 'Yetkisiz. Kullanıcı eğitmen değil'}), 403
    
    # Eğitmen profil verilerini al
    # Eğitmen profil verilerini almak için gerekli olan alanları ekleyebilirsiniz
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

@profiles.route('/instructor/profile', methods=['PUT']) # Eğitmen profilini güncelle
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def update_instructor_profile(): # Eğitmen profilini güncelle
    current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
    current_user = User.query.get(current_user_id) # Kullanıcıyı al
    
    # Kullanıcının eğitmen olup olmadığını kontrol et
    if current_user.role != 'instructor':
        return jsonify({'message': 'Yetkisiz. Kullanıcı eğitmen değil'}), 403
    
    data = request.get_json() # JSON formatında veri al
    
    if not data:
        return jsonify({'message': 'Veri sağlanmadı'}), 400
    
    # Temel profil bilgilerini güncelle
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Bu e-posta adresi zaten kullanılıyor'}), 400
        current_user.email = data['email']
    
    if 'username' in data and data['username'] != current_user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Bu kullanıcı adı zaten kullanılıyor'}), 400
        current_user.username = data['username']
    
    # Eğitmen profil alanlarını güncelle
    if 'bio' in data:
        current_user.bio = data['bio']
    
    if 'expertise' in data:
        current_user.expertise = data['expertise']
    
    # Sosyal medya bağlantılarını güncelle
    if 'socialMediaLinks' in data:
        social_links = data['socialMediaLinks']
        if 'website' in social_links:
            current_user.website = social_links['website']
        if 'linkedin' in social_links:
            current_user.linkedin = social_links['linkedin']
        if 'twitter' in social_links:
            current_user.twitter = social_links['twitter']
    
    db.session.commit() # Değişiklikleri kaydediyoruz.  
    
    return jsonify({
        'message': 'Eğitmen profili başarıyla güncellendi',
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