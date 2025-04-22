from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

auth = Blueprint('auth', __name__)
CORS(auth, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@auth.route('/register', methods=['POST'])
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

@auth.route('/login', methods=['POST'])
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
        
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'username': user.username,
                'role': user.role
            },
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            'access_token': access_token,
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

@auth.route('/me', methods=['GET'])
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