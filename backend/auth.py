from flask import Blueprint, request, jsonify # Blueprint: Flask'ta route'ları gruplamak için kullanılır.
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity # create_access_token: Access token oluşturmak için kullanılır. jwt_required: JWT token gerekli olduğunda kullanılır. get_jwt_identity: JWT token'ın içindeki bilgileri almak için kullanılır.
from models import db, User # models.py dosyasından User modelini import ediyoruz.
from datetime import timedelta # timedelta: Zaman aralıklarını hesaplamak için kullanılır.

auth = Blueprint('auth', __name__) # Auth blueprint'ini oluşturuyoruz.

@auth.route('/register', methods=['POST']) # Register route'unu oluşturuyoruz.
def register():
    data = request.get_json() # JSON formatında gelen verileri alıyoruz.
    
    # Gerekli alanları kontrol et
    if not all(k in data for k in ['username', 'email', 'password', 'role']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Kullanıcı adı ve email kontrolü
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Rol kontrolü
    if data['role'] not in ['student', 'instructor']:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Yeni kullanıcı oluştur
    user = User(
        username=data['username'],
        email=data['email'],
        role=data['role']
    )
    user.set_password(data['password'])
    
    # Veritabanına kaydet
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    }), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Gerekli alanları kontrol et
    if not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Missing username or password'}), 400
    
    # Kullanıcıyı bul
    user = User.query.filter_by(username=data['username']).first()
    
    # Kullanıcı ve şifre kontrolü
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Access token oluştur
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role},
        expires_delta=timedelta(days=1)
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    })

@auth.route('/me', methods=['GET']) # Me route'unu oluşturuyoruz.
@jwt_required() # JWT token gerekli olduğunda kullanılır.
def get_current_user():
    user_id = get_jwt_identity() # JWT token'ın içindeki bilgileri alıyoruz.
    user = User.query.get(user_id) # User modelini kullanarak kullanıcıyı alıyoruz.
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    }) 