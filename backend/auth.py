from flask import Blueprint, request, jsonify #flask modülünü import ediyoruz
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity #flask_jwt_extended modülünü import ediyoruz
from flask_cors import CORS #flask_cors modülünü import ediyoruz
from models import db, User #models modülünü import ediyoruz
from datetime import datetime, timedelta #datetime modülünü import ediyoruz
from werkzeug.security import generate_password_hash, check_password_hash #werkzeug modülünü import ediyoruz
import os #os modülünü import ediyoruz
from dotenv import load_dotenv #dotenv modülünü import ediyoruz
import uuid #uuid modülünü import ediyoruz

# Ortam değişkenlerini yükle
load_dotenv()

auth = Blueprint('auth', __name__) #auth modülünü oluşturuyoruz
CORS(auth, resources={ #CORS modülünü kullanıyoruz
    r"/*": { #r"/*" rotasını tanımlıyoruz
        "origins": ["http://localhost:3000"], #origins'i alıyoruz
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], #methods'i alıyoruz
        "allow_headers": ["Content-Type", "Authorization"], #allow_headers'i alıyoruz
        "expose_headers": ["Content-Type", "Authorization"], #expose_headers'i alıyoruz
        "supports_credentials": True #supports_credentials'i alıyoruz
    }
}) #CORS modülünü kullanıyoruz

# Refresh token'ları saklamak için basit bir sözlük kullanıyoruz
# Daha büyük bir uygulamada, bunları veritabanında saklarsınız
refresh_tokens = {} #refresh_tokens'u alıyoruz

@auth.route('/register', methods=['POST', 'OPTIONS']) #register rotasını tanımlıyoruz
def register(): #register fonksiyonunu tanımlıyoruz
    data = request.get_json() #data'yı alıyoruz
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'): #data'nın boş olup olmadığını kontrol ediyoruz
        return jsonify({'message': 'Missing required fields'}), 400 #data'nın boş olması durumunda boş bir liste döndürüyoruz
    
    if User.query.filter_by(username=data['username']).first(): #username'in boş olup olmadığını kontrol ediyoruz
        return jsonify({'message': 'Username already exists'}), 400 #username'in boş olması durumunda boş bir liste döndürüyoruz
    
    if User.query.filter_by(email=data['email']).first(): #email'in boş olup olmadığını kontrol ediyoruz
        return jsonify({'message': 'Email already exists'}), 400 #email'in boş olması durumunda boş bir liste döndürüyoruz
    
    hashed_password = generate_password_hash(data['password']) #hashed_password'u alıyoruz
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        role=data.get('role', 'student'),
        created_at=datetime.utcnow()
    )
    
    try:
        db.session.add(new_user) #new_user'i ekle
        db.session.commit() #commit işlemi yap
        
        return jsonify({
            'message': 'User registered successfully', #message'yi alıyoruz
            'user': {
                'id': new_user.id, #new_user.id'yi alıyoruz
                'username': new_user.username,
                'email': new_user.email,
                'role': new_user.role,
                'created_at': new_user.created_at.isoformat()
            }
        }), 201
    except Exception as e: #hata durumunda
        db.session.rollback() #rollback işlemi yap
        return jsonify({'message': f'Error registering user: {str(e)}'}), 500 #hata durumunda boş bir liste döndürüyoruz

@auth.route('/login', methods=['POST', 'OPTIONS']) #login rotasını tanımlıyoruz
def login(): #login fonksiyonunu tanımlıyoruz
    try:
        data = request.get_json() #data'yı alıyoruz
        
        if not data: #data'nın boş olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'No JSON data received'}), 400 #data'nın boş olması durumunda boş bir liste döndürüyoruz
        
        # Kullanıcı email veya username ile giriş yapabilir
        identifier = data.get('email') or data.get('username') #identifier'u alıyoruz
        password = data.get('password') #password'u alıyoruz
        
        if not identifier or not password: #identifier'in ve password'un boş olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'Missing login identifier (email or username) or password', 'received_data': data}), 400
        
        # Önce email ile ara, bulunamazsa username ile ara
        user = User.query.filter_by(email=identifier).first() or User.query.filter_by(username=identifier).first()
        
        if not user: #user'in boş olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'User not found'}), 401 #user'in boş olması durumunda boş bir liste döndürüyoruz
        
        if not check_password_hash(user.password_hash, password): #password'un doğruluğunu kontrol ediyoruz
            return jsonify({'message': 'Invalid password'}), 401 #password'un doğruluğu yanlışsa boş bir liste döndürüyoruz
        
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
            'access_token': access_token, #access_token'u alıyoruz
            'refresh_token': refresh_token, #refresh_token'u alıyoruz
            'user': {
                'id': user.id, #user.id'yi alıyoruz
                'username': user.username, #user.username'yi alıyoruz
                'email': user.email, #user.email'yi alıyoruz
                'role': user.role, #user.role'yi alıyoruz
                'created_at': user.created_at.isoformat() #user.created_at.isoformat()'yi alıyoruz
            }
        })
    except Exception as e: #hata durumunda
        return jsonify({'message': f'Login error: {str(e)}'}), 500 #hata durumunda boş bir liste döndürüyoruz

@auth.route('/refresh', methods=['POST']) #refresh rotasını tanımlıyoruz
def refresh(): #refresh fonksiyonunu tanımlıyoruz
    try:
        data = request.get_json() #data'yı alıyoruz
        
        if not data or not data.get('refreshToken'): #data'nın boş olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'Refresh token is required'}), 400 #data'nın boş olması durumunda boş bir liste döndürüyoruz
        
        refresh_token = data.get('refreshToken') #refresh_token'u alıyoruz
        
        # Refresh token var mı ve geçerli mi kontrol et
        if refresh_token not in refresh_tokens: #refresh_token'un refresh_tokens'ta olup olmadığını kontrol ediyoruz
            return jsonify({'message': 'Invalid refresh token'}), 401 #refresh_token'un refresh_tokens'ta olmadığı durumda boş bir liste döndürüyoruz
        
        token_data = refresh_tokens[refresh_token] #token_data'yı alıyoruz
        
        # Token süresi dolmuş mu kontrol et
        if datetime.utcnow() > token_data['expires_at']: #token_data'nın expires_at'i datetime.utcnow()'den büyük mü kontrol ediyoruz
            # Süresi dolmuş token'ı sil
            del refresh_tokens[refresh_token] #refresh_tokens'tan refresh_token'ı siliyoruz
            return jsonify({'message': 'Refresh token has expired'}), 401 #token_data'nın expires_at'i datetime.utcnow()'den büyükse boş bir liste döndürüyoruz
        
        # Kullanıcı bilgilerini kullanarak yeni access token oluştur
        access_token = create_access_token(
            identity=token_data['user_id'], #token_data'nın user_id'sini alıyoruz 
            additional_claims={
                'email': token_data['email'], #token_data'nın email'sini alıyoruz
                'username': token_data['username'], #token_data'nın username'sini alıyoruz
                'role': token_data['role'] #token_data'nın role'sini alıyoruz
            },
            expires_delta=timedelta(hours=1) #expires_delta'yı alıyoruz
        )
        
        # Yeni refresh token oluştur ve eski refresh token'ı geçersiz kıl
        new_refresh_token = str(uuid.uuid4()) #new_refresh_token'u alıyoruz
        refresh_tokens[new_refresh_token] = token_data #refresh_tokens'a new_refresh_token'ı ekle
        refresh_tokens[new_refresh_token]['expires_at'] = datetime.utcnow() + timedelta(days=7) #refresh_tokens'a new_refresh_token'ın expires_at'ini ekle
        
        # Eski token'ı sil
        del refresh_tokens[refresh_token] 
        
        return jsonify({
            'access_token': access_token, #access_token'u alıyoruz
            'refresh_token': new_refresh_token #new_refresh_token'u alıyoruz
        })
    except Exception as e: #hata durumunda
        print("Refresh token error:", str(e)) #hata durumunda boş bir liste döndürüyoruz
        return jsonify({'message': f'Refresh token error: {str(e)}'}), 500 #hata durumunda boş bir liste döndürüyoruz

@auth.route('/me', methods=['GET', 'OPTIONS']) #me rotasını tanımlıyoruz
@jwt_required() #jwt_required decoratorını kullanıyoruz
def get_current_user(): #get_current_user fonksiyonunu tanımlıyoruz
    current_user_id = get_jwt_identity() #current_user_id'yi alıyoruz
    user = User.query.get(current_user_id) #user'u alıyoruz
    
    if not user: #user'in boş olup olmadığını kontrol ediyoruz
        return jsonify({'message': 'User not found'}), 404 #user'in boş olması durumunda boş bir liste döndürüyoruz
    
    return jsonify({
        'id': user.id, #user.id'yi alıyoruz
        'username': user.username, #user.username'yi alıyoruz
        'email': user.email, #user.email'yi alıyoruz
        'role': user.role, #user.role'yi alıyoruz
        'created_at': user.created_at.isoformat() #user.created_at.isoformat()'yi alıyoruz
    }) 