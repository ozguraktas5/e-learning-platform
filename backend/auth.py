from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
import uuid

# Ortam değişkenlerini yükle
load_dotenv()

auth = Blueprint('auth', __name__)
CORS(auth, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Refresh token'ları saklamak için basit bir sözlük kullanıyoruz
# Daha büyük bir uygulamada, bunları veritabanında saklarsınız
refresh_tokens = {}

@auth.route('/register', methods=['POST', 'OPTIONS'])
def register():
    data = request.get_json()
    
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
        password_hash=hashed_password,
        role=data.get('role', 'student'),
        created_at=datetime.utcnow()
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'role': new_user.role,
                'created_at': new_user.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error registering user: {str(e)}'}), 500

@auth.route('/login', methods=['POST', 'OPTIONS'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No JSON data received'}), 400
        
        # Kullanıcı email veya username ile giriş yapabilir
        identifier = data.get('email') or data.get('username')
        password = data.get('password')
        
        if not identifier or not password:
            return jsonify({'message': 'Missing login identifier (email or username) or password', 'received_data': data}), 400
        
        # Önce email ile ara, bulunamazsa username ile ara
        user = User.query.filter_by(email=identifier).first() or User.query.filter_by(username=identifier).first()
        
        if not user:
            return jsonify({'message': 'User not found'}), 401
        
        if not check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Invalid password'}), 401
        
        # Access token ve refresh token oluştur
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'username': user.username,
                'role': user.role
            },
            expires_delta=timedelta(hours=1)  # Access token süresi kısa
        )
        
        # Refresh token oluştur
        refresh_token = str(uuid.uuid4())
        refresh_tokens[refresh_token] = {
            'user_id': str(user.id),
            'email': user.email,
            'username': user.username,
            'role': user.role,
            'expires_at': datetime.utcnow() + timedelta(days=7)  # 7 gün geçerli
        }
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat()
            }
        })
    except Exception as e:
        print("Login error:", str(e))  # Debug log
        return jsonify({'message': f'Login error: {str(e)}'}), 500

@auth.route('/refresh', methods=['POST'])
def refresh():
    try:
        data = request.get_json()
        
        if not data or not data.get('refreshToken'):
            return jsonify({'message': 'Refresh token is required'}), 400
        
        refresh_token = data.get('refreshToken')
        
        # Refresh token var mı ve geçerli mi kontrol et
        if refresh_token not in refresh_tokens:
            return jsonify({'message': 'Invalid refresh token'}), 401
        
        token_data = refresh_tokens[refresh_token]
        
        # Token süresi dolmuş mu kontrol et
        if datetime.utcnow() > token_data['expires_at']:
            # Süresi dolmuş token'ı sil
            del refresh_tokens[refresh_token]
            return jsonify({'message': 'Refresh token has expired'}), 401
        
        # Kullanıcı bilgilerini kullanarak yeni access token oluştur
        access_token = create_access_token(
            identity=token_data['user_id'],
            additional_claims={
                'email': token_data['email'],
                'username': token_data['username'],
                'role': token_data['role']
            },
            expires_delta=timedelta(hours=1)
        )
        
        # Yeni refresh token oluştur ve eski refresh token'ı geçersiz kıl
        new_refresh_token = str(uuid.uuid4())
        refresh_tokens[new_refresh_token] = token_data
        refresh_tokens[new_refresh_token]['expires_at'] = datetime.utcnow() + timedelta(days=7)
        
        # Eski token'ı sil
        del refresh_tokens[refresh_token]
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': new_refresh_token
        })
    except Exception as e:
        print("Refresh token error:", str(e))  # Debug log
        return jsonify({'message': f'Refresh token error: {str(e)}'}), 500

@auth.route('/me', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat()
    }) 