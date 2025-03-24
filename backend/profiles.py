from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

profiles = Blueprint('profiles', __name__)

@profiles.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
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
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    data = request.get_json()
    
    if not data:
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
    
    db.session.commit()
    
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
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    data = request.get_json()
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'message': 'Current password and new password are required'}), 400
    
    if not check_password_hash(current_user.password, data['current_password']):
        return jsonify({'message': 'Current password is incorrect'}), 401
    
    current_user.password = generate_password_hash(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password updated successfully'}) 