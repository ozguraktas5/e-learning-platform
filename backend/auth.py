from flask import Blueprint, request, jsonify # Blueprint: Flask'ta route'ları gruplamak için kullanılır.
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity # create_access_token: Access token oluşturmak için kullanılır. jwt_required: JWT token gerekli olduğunda kullanılır. get_jwt_identity: JWT token'ın içindeki bilgileri almak için kullanılır.
from models import db, User # models.py dosyasından User modelini import ediyoruz.
from datetime import timedelta # timedelta: Zaman aralıklarını hesaplamak için kullanılır.
from werkzeug.security import generate_password_hash, check_password_hash
import os

auth = Blueprint('auth', __name__) # Auth blueprint'ini oluşturuyoruz.

@auth.route('/register', methods=['POST']) # Register route'unu oluşturuyoruz.
def register():
    data = request.get_json() # JSON formatında gelen verileri alıyoruz.
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,  # Şifreyi doğrudan password alanına kaydediyoruz
        role=data.get('role', 'student')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'role': new_user.role
        }
    }), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    access_token = create_access_token(
        identity=str(user.id),
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

@auth.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat()
    }) 