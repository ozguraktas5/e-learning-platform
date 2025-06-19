from flask import Blueprint, jsonify, request, current_app # Flask'ın Blueprint, jsonify, request ve current_app fonksiyonlarını import ediyoruz.
from flask_jwt_extended import jwt_required, get_jwt_identity # Flask-JWT-Extended'ın jwt_required ve get_jwt_identity fonksiyonlarını import ediyoruz.
from datetime import datetime, UTC # datetime modülünü import ediyoruz.
from models import db, Notification, User, NotificationSetting # models.py dosyasındaki db, Notification, User ve NotificationSetting modellerini import ediyoruz.
import logging # logging modülünü import ediyoruz.
import traceback # traceback modülünü import ediyoruz.

# Blueprint oluşturma
notifications_bp = Blueprint('notifications', __name__) # notifications blueprint'ini oluşturuyoruz.

# Tüm bildirimleri getir
@notifications_bp.route('/notifications', methods=['GET']) # Tüm bildirimleri getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_notifications(): # Tüm bildirimleri getir
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        
        # Kullanıcının tüm bildirimlerini al
        notifications = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).all()
        
        return jsonify([notification.to_dict() for notification in notifications]), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_notifications: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Okunmamış bildirim sayısını getir
@notifications_bp.route('/notifications/unread-count', methods=['GET']) # Okunmamış bildirim sayısını getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_unread_count(): # Okunmamış bildirim sayısını getir
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        
        # Kullanıcının okunmamış bildirimlerini say
        unread_count = Notification.query.filter_by(user_id=current_user_id, is_read=False).count()
        
        return jsonify({"count": unread_count}), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_unread_count: {str(e)}")
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Bildirimi okundu olarak işaretle
@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT']) # Bildirimi okundu olarak işaretle
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def mark_as_read(notification_id): # Bildirimi okundu olarak işaretle
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        
        # Bildirimi bul
        notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first()
        
        if not notification:
            return jsonify({"error": "Bildirim bulunamadı."}), 404
        
        # Bildirimi okundu olarak işaretle
        notification.is_read = True
        notification.read_at = datetime.now(UTC)
        db.session.commit()
        
        return jsonify({"success": True, "notification": notification.to_dict()}), 200
    except Exception as e:
        current_app.logger.error(f"Error in mark_as_read: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Tüm bildirimleri okundu olarak işaretle
@notifications_bp.route('/notifications/read-all', methods=['PUT']) # Tüm bildirimleri okundu olarak işaretle
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def mark_all_as_read(): # Tüm bildirimleri okundu olarak işaretle
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        now = datetime.now(UTC)
        
        # Kullanıcının tüm okunmamış bildirimlerini bul
        notifications = Notification.query.filter_by(user_id=current_user_id, is_read=False).all()
        
        # Tüm bildirimleri okundu olarak işaretle
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Tüm bildirimler okundu olarak işaretlendi."}), 200
    except Exception as e:
        current_app.logger.error(f"Error in mark_all_as_read: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Bildirimi sil
@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE']) # Bildirimi sil
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def delete_notification(notification_id): # Bildirimi sil
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        
        # Bildirimi bul
        notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first()
        
        if not notification:
            return jsonify({"error": "Bildirim bulunamadı."}), 404
        
        # Bildirimi sil
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Bildirim başarıyla silindi."}), 200
    except Exception as e:
        current_app.logger.error(f"Error in delete_notification: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Bildirim ayarlarını getir
@notifications_bp.route('/notifications/settings', methods=['GET']) # Bildirim ayarlarını getir
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def get_notification_settings(): # Bildirim ayarlarını getir
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        
        # Kullanıcının bildirim ayarlarını al
        settings = NotificationSetting.query.filter_by(user_id=current_user_id).all()
        
        # Eğer kullanıcının bildirim ayarları yoksa, varsayılan ayarları oluştur
        if not settings:
            default_settings = [
                {
                    "name": "Yeni Kurs Bildirimleri",
                    "description": "İlgi alanlarınıza uygun yeni kurslar eklendiğinde bildirim alın.",
                    "category": "course",
                    "enabled": True
                },
                {
                    "name": "Ödev Hatırlatmaları",
                    "description": "Yaklaşan ödev teslim tarihleri için hatırlatma bildirimleri alın.",
                    "category": "course",
                    "enabled": True
                },
                {
                    "name": "Sistem Bildirimleri",
                    "description": "Bakım, güncelleme ve diğer sistem bildirimleri alın.",
                    "category": "system",
                    "enabled": True
                },
                {
                    "name": "E-posta Bildirimleri",
                    "description": "Bildirimler aynı zamanda e-posta adresinize de gönderilsin.",
                    "category": "system",
                    "enabled": False
                },
                {
                    "name": "Özel Teklifler",
                    "description": "Size özel indirim ve kampanya bildirimleri alın.",
                    "category": "marketing",
                    "enabled": False
                }
            ]
            
            for setting_data in default_settings:
                setting = NotificationSetting(
                    user_id=current_user_id,
                    name=setting_data["name"],
                    description=setting_data["description"],
                    category=setting_data["category"],
                    enabled=setting_data["enabled"]
                )
                db.session.add(setting)
            
            db.session.commit()
            
            # Yeni oluşturulan ayarları al
            settings = NotificationSetting.query.filter_by(user_id=current_user_id).all()
        
        return jsonify([setting.to_dict() for setting in settings]), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_notification_settings: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Bildirim ayarlarını güncelle
@notifications_bp.route('/notifications/settings', methods=['PUT']) # Bildirim ayarlarını güncelle
@jwt_required() # JWT token'ının içindeki bilgileri almak için kullanılır.
def update_notification_settings(): # Bildirim ayarlarını güncelle
    try:
        current_user_id = get_jwt_identity() # JWT token'ının içindeki bilgileri almak için kullanılır.
        
        # İstek verilerini al
        settings_data = request.get_json()
        
        if not isinstance(settings_data, list):
            return jsonify({"error": "Geçersiz veri formatı."}), 400
        
        # Her bir ayarı güncelle
        for setting_data in settings_data:
            # ID'yi integer'a dönüştür
            setting_id = int(setting_data.get("id"))
            
            # Ayarı veritabanında bul
            setting = NotificationSetting.query.filter_by(id=setting_id, user_id=current_user_id).first()
            
            if setting:
                # Ayarı güncelle
                setting.enabled = setting_data.get("enabled", setting.enabled)
                setting.updated_at = datetime.now(UTC)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Bildirim ayarları başarıyla güncellendi."
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in update_notification_settings: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "İstek işlenirken bir hata oluştu."}), 500

# Yeni bildirim oluştur (iç işlemlerde kullanılabilir)
def create_notification(user_id, course_id, notification_type, title, message, reference_id=None): # Yeni bildirim oluştur (iç işlemlerde kullanılabilir)
    try:
        # Kullanıcının bu tür bildirimlerle ilgili ayarlarını kontrol et
        if notification_type == 'course_update':
            category = 'course'
        elif notification_type in ['new_assignment', 'new_quiz', 'quiz_graded', 'assignment_graded', 'assignment_due']:
            category = 'course'
        else:
            category = 'system'
        
        # Kullanıcının bu kategorideki bildirim ayarını kontrol et
        settings = NotificationSetting.query.filter_by(
            user_id=user_id, 
            category=category
        ).all()
        
        # Eğer kullanıcı bu tür bildirimleri devre dışı bıraktıysa, bildirim oluşturma
        if settings and all(not setting.enabled for setting in settings):
            current_app.logger.info(f"User {user_id} has disabled {category} notifications, skipping.")
            return None
        
        # Yeni bildirim oluştur
        notification = Notification(
            user_id=user_id,
            course_id=course_id,
            type=notification_type,
            title=title,
            message=message,
            reference_id=reference_id
        )
        
        # Veritabanına kaydet
        db.session.add(notification)
        db.session.commit()
        
        return notification
    except Exception as e:
        current_app.logger.error(f"Error in create_notification: {str(e)}")
        db.session.rollback()
        return None 