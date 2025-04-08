import pytest
from datetime import datetime, timedelta, UTC
from models import db, User, Course, Lesson, Assignment, Notification, Enrollment, AssignmentSubmission
from werkzeug.security import generate_password_hash
import json
from queue import Queue
from threading import Thread
from time import sleep

@pytest.fixture(scope='function')
def setup_test_data(test_app, session):
    # Test kullanıcıları oluştur
    student = User(
        username='test_student',
        email='student@test.com',
        password_hash=generate_password_hash('password123'),
        role='student'
    )
    
    instructor = User(
        username='test_instructor',
        email='instructor@test.com',
        password_hash=generate_password_hash('password123'),
        role='instructor'
    )
    
    session.add_all([student, instructor])
    session.commit()
    
    # Test kursu oluştur
    course = Course(
        title='Test Course',
        description='Test Description',
        instructor_id=instructor.id
    )
    session.add(course)
    session.commit()
    
    # Test dersi oluştur
    lesson = Lesson(
        title='Test Lesson',
        content='Test Content',
        course_id=course.id,
        order=1
    )
    session.add(lesson)
    session.commit()
    
    # Öğrenciyi kursa kaydet
    enrollment = Enrollment(
        student_id=student.id,
        course_id=course.id
    )
    session.add(enrollment)
    session.commit()
    
    yield {
        'student': student,
        'instructor': instructor,
        'course': course,
        'lesson': lesson
    }
    
    # Test verilerini temizle
    session.execute(db.delete(Enrollment))
    session.execute(db.delete(Notification))
    session.execute(db.delete(Assignment))
    session.execute(db.delete(Lesson))
    session.execute(db.delete(Course))
    session.execute(db.delete(User))
    session.commit()

def test_check_assignment_due_dates(test_client, setup_test_data, session):
    # Test için yaklaşan bir ödev oluştur
    now = datetime.now(UTC)
    assignment = Assignment(
        title='Test Assignment',
        description='Test Description',
        lesson_id=setup_test_data['lesson'].id,
        due_date=now + timedelta(days=2),
        created_at=now  # created_at'i de UTC olarak ayarla
    )
    session.add(assignment)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Yaklaşan ödev bildirimlerini kontrol et
    response = test_client.post(
        '/api/courses/check-assignment-due-dates',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['notifications_count'] == 1
    assert 'Test Assignment' in data['message']

def test_unread_notifications(test_client, setup_test_data, session):
    # Test bildirimi oluştur
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Test Notification',
        message='Test Message',
        is_read=False
    )
    session.add(notification)
    session.commit()
    
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']
    
    # Okunmamış bildirimleri kontrol et
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['count'] == 1

def test_mark_notification_read(test_client, setup_test_data, session):
    # Test bildirimi oluştur
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Test Notification',
        message='Test Message',
        is_read=False
    )
    session.add(notification)
    session.commit()
    
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']
    
    # Bildirimi okundu olarak işaretle
    response = test_client.post(
        f'/api/courses/notifications/{notification.id}/read',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    
    # Bildirimin okundu olarak işaretlendiğini kontrol et
    updated_notification = session.get(Notification, notification.id)
    assert updated_notification.is_read == True
    assert updated_notification.read_at is not None

def test_mark_all_notifications_read(test_client, setup_test_data, session):
    # Birden fazla test bildirimi oluştur
    notifications = [
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title=f'Test Notification {i}',
            message=f'Test Message {i}',
            is_read=False
        ) for i in range(3)
    ]
    session.add_all(notifications)
    session.commit()
    
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']
    
    # Tüm bildirimleri okundu olarak işaretle
    response = test_client.post(
        '/api/courses/notifications/mark-all-read',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    
    # Tüm bildirimlerin okundu olarak işaretlendiğini kontrol et
    stmt = db.select(Notification).filter_by(
        user_id=setup_test_data['student'].id,
        is_read=False
    )
    unread_count = len(session.scalars(stmt).all())
    assert unread_count == 0

def test_check_assignment_due_dates_no_enrollment(test_client, setup_test_data, session):
    # Öğrencinin kurs kaydını sil
    session.execute(db.delete(Enrollment))
    session.commit()

    # Test için yaklaşan bir ödev oluştur
    now = datetime.now(UTC)
    assignment = Assignment(
        title='Test Assignment',
        description='Test Description',
        lesson_id=setup_test_data['lesson'].id,
        due_date=now + timedelta(days=2)
    )
    session.add(assignment)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Yaklaşan ödev bildirimlerini kontrol et
    response = test_client.post(
        '/api/courses/check-assignment-due-dates',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 404
    data = response.get_json()
    assert 'Kayıtlı olduğunuz kurs bulunmamaktadır' in data['message']

def test_check_assignment_due_dates_past_due(test_client, setup_test_data, session):
    # Test için süresi geçmiş bir ödev oluştur
    now = datetime.now(UTC)
    assignment = Assignment(
        title='Past Due Assignment',
        description='Test Description',
        lesson_id=setup_test_data['lesson'].id,
        due_date=now - timedelta(days=1)  # Dün teslim tarihi olan ödev
    )
    session.add(assignment)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Yaklaşan ödev bildirimlerini kontrol et
    response = test_client.post(
        '/api/courses/check-assignment-due-dates',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['notifications_count'] == 0  # Süresi geçmiş ödev için bildirim oluşturulmamalı

def test_check_assignment_due_dates_already_submitted(test_client, setup_test_data, session):
    # Test için yaklaşan bir ödev oluştur
    now = datetime.now(UTC)
    assignment = Assignment(
        title='Submitted Assignment',
        description='Test Description',
        lesson_id=setup_test_data['lesson'].id,
        due_date=now + timedelta(days=2)
    )
    session.add(assignment)
    session.commit()

    # Ödev teslimini oluştur
    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        user_id=setup_test_data['student'].id,
        submission_text='Test Submission'
    )
    session.add(submission)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Yaklaşan ödev bildirimlerini kontrol et
    response = test_client.post(
        '/api/courses/check-assignment-due-dates',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['notifications_count'] == 0  # Teslim edilmiş ödev için bildirim oluşturulmamalı

def test_check_assignment_due_dates_duplicate_notification(test_client, setup_test_data, session):
    # Test için yaklaşan bir ödev oluştur
    now = datetime.now(UTC)
    assignment = Assignment(
        title='Test Assignment',
        description='Test Description',
        lesson_id=setup_test_data['lesson'].id,
        due_date=now + timedelta(days=2)
    )
    session.add(assignment)
    session.commit()

    # Aynı ödev için önceden bildirim oluştur
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='assignment_due',
        reference_id=assignment.id,
        title=f'Ödev Teslim Tarihi Yaklaşıyor: {assignment.title}',
        message='Test Message',
        is_read=False
    )
    session.add(notification)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Yaklaşan ödev bildirimlerini kontrol et
    response = test_client.post(
        '/api/courses/check-assignment-due-dates',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['notifications_count'] == 0  # Aynı ödev için tekrar bildirim oluşturulmamalı

def test_notification_pagination(test_client, setup_test_data, session):
    # 15 adet test bildirimi oluştur
    notifications = []
    for i in range(15):
        notification = Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title=f'Test Notification {i+1}',
            message=f'Test Message {i+1}',
            is_read=False
        )
        notifications.append(notification)
    
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # İlk sayfa (10 bildirim)
    response = test_client.get(
        '/api/courses/notifications/unread?page=1&per_page=10',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 10  # İlk sayfada 10 bildirim olmalı
    assert data['total_count'] == 15  # Toplam 15 bildirim olmalı
    assert data['total_pages'] == 2  # Toplam 2 sayfa olmalı

    # İkinci sayfa (5 bildirim)
    response = test_client.get(
        '/api/courses/notifications/unread?page=2&per_page=10',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 5  # İkinci sayfada 5 bildirim olmalı

def test_notification_filtering_by_course(test_client, setup_test_data, session):
    # Farklı kurslar için bildirimler oluştur
    course2 = Course(
        title='Test Course 2',
        description='Test Description 2',
        instructor_id=setup_test_data['instructor'].id
    )
    session.add(course2)
    session.commit()

    # İkinci kursa da öğrenciyi kaydet
    enrollment2 = Enrollment(
        student_id=setup_test_data['student'].id,
        course_id=course2.id
    )
    session.add(enrollment2)
    session.commit()

    # Her kurs için bildirimler oluştur
    notifications = [
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title='Course 1 - Notification 1',
            message='Test Message 1',
            is_read=False
        ),
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=course2.id,
            type='test_notification',
            title='Course 2 - Notification 1',
            message='Test Message 2',
            is_read=False
        )
    ]
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Kurs 1 için bildirimleri kontrol et
    response = test_client.get(
        f'/api/courses/notifications/unread?course_id={setup_test_data["course"].id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert 'Course 1' in data['notifications'][0]['title']

    # Kurs 2 için bildirimleri kontrol et
    response = test_client.get(
        f'/api/courses/notifications/unread?course_id={course2.id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert 'Course 2' in data['notifications'][0]['title']

def test_notification_type_filtering(test_client, setup_test_data, session):
    # Farklı tiplerde bildirimler oluştur
    notifications = [
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='assignment_due',
            title='Assignment Due',
            message='Test Message 1',
            is_read=False
        ),
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='grade_posted',
            title='Grade Posted',
            message='Test Message 2',
            is_read=False
        ),
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='course_announcement',
            title='Course Announcement',
            message='Test Message 3',
            is_read=False
        )
    ]
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Assignment bildirimleri için filtrele
    response = test_client.get(
        '/api/courses/notifications/unread?type=assignment_due',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert data['notifications'][0]['type'] == 'assignment_due'

    # Grade bildirimleri için filtrele
    response = test_client.get(
        '/api/courses/notifications/unread?type=grade_posted',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert data['notifications'][0]['type'] == 'grade_posted'

def test_instructor_notifications(test_client, setup_test_data, session):
    # Eğitmen için bildirimler oluştur
    notifications = [
        Notification(
            user_id=setup_test_data['instructor'].id,
            course_id=setup_test_data['course'].id,
            type='new_submission',
            title='New Assignment Submission',
            message='A student has submitted an assignment',
            is_read=False
        ),
        Notification(
            user_id=setup_test_data['instructor'].id,
            course_id=setup_test_data['course'].id,
            type='course_enrollment',
            title='New Course Enrollment',
            message='A new student has enrolled in your course',
            is_read=False
        )
    ]
    session.add_all(notifications)
    session.commit()

    # Eğitmen olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'instructor@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Eğitmenin bildirimlerini kontrol et
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 2
    assert any(n['type'] == 'new_submission' for n in data['notifications'])
    assert any(n['type'] == 'course_enrollment' for n in data['notifications'])

def test_notification_date_filtering(test_client, setup_test_data, session):
    # Farklı tarihlerde bildirimler oluştur
    now = datetime.now(UTC)
    
    # Bildirimleri oluşturmadan önce tarihleri ayarla
    old_date = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
    recent_date = (now - timedelta(hours=1)).replace(microsecond=0)
    
    notifications = [
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title='Old Notification',
            message='Test Message 1',
            is_read=False,
            created_at=old_date  # 7 gün önce
        ),
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title='Recent Notification',
            message='Test Message 2',
            is_read=False,
            created_at=recent_date  # 1 saat önce
        )
    ]
    session.add_all(notifications)
    session.commit()

    # Debug için yazdır
    print(f"\nTest Debug:")
    print(f"Now: {now}")
    print(f"Old notification date: {old_date}")
    print(f"Recent notification date: {recent_date}")

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Son 24 saat içindeki bildirimleri filtrele
    response = test_client.get(
        '/api/courses/notifications/unread?since=24h',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert 'Recent' in data['notifications'][0]['title']

    # Son 1 hafta içindeki bildirimleri filtrele
    response = test_client.get(
        '/api/courses/notifications/unread?since=7d',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    print(f"\nResponse data for 7d filter: {data}")  # Debug için
    assert len(data['notifications']) == 2  # Hem eski hem yeni bildirim görünmeli

def test_notification_bulk_operations(test_client, setup_test_data, session):
    # Çoklu bildirim oluştur
    notifications = []
    for i in range(5):
        notification = Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title=f'Test Notification {i+1}',
            message=f'Test Message {i+1}',
            is_read=False
        )
        notifications.append(notification)
    
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Seçili bildirimleri okundu olarak işaretle
    notification_ids = [notifications[0].id, notifications[2].id]
    response = test_client.post(
        '/api/courses/notifications/mark-selected-read',
        json={'notification_ids': notification_ids},
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['updated_count'] == 2

    # Okunmamış bildirimleri kontrol et
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 3  # 5 bildirimden 2'si okundu 

def test_invalid_notification_id(test_client, setup_test_data, session):
    # Geçersiz bildirim ID'si ile işaretleme denemesi
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']
    
    response = test_client.post(
        '/api/courses/notifications/999999/read',  # Var olmayan ID
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert 'Notification not found' in data['message']  # İngilizce mesajı kontrol et

def test_notification_authorization(test_client, setup_test_data, session):
    # Başka bir kullanıcının bildirimini okuma denemesi
    notification = Notification(
        user_id=setup_test_data['instructor'].id,  # Eğitmenin bildirimi
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Test Notification',
        message='Test Message',
        is_read=False
    )
    session.add(notification)
    session.commit()
    
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']
    
    # Eğitmenin bildirimini okuma denemesi
    response = test_client.post(
        f'/api/courses/notifications/{notification.id}/read',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403
    data = response.get_json()
    assert 'You do not have permission to read this notification' in data['message']

def test_invalid_filter_parameters(test_client, setup_test_data, session):
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']
    
    # Geçersiz tarih filtresi
    response = test_client.get(
        '/api/courses/notifications/unread?since=invalid_date',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    data = response.get_json()
    assert 'Geçersiz tarih filtresi' in data['message']
    
    # Geçersiz sayfa numarası
    response = test_client.get(
        '/api/courses/notifications/unread?page=0',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    data = response.get_json()
    assert 'Sayfa numarası 1 veya daha büyük olmalıdır' in data['message']
    
    # Geçersiz sayfa boyutu
    response = test_client.get(
        '/api/courses/notifications/unread?per_page=-1',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    data = response.get_json()
    assert 'Sayfa boyutu 1 veya daha büyük olmalıdır' in data['message']

def test_notification_empty_message(test_client, setup_test_data, session):
    """Boş mesaj içeriği ile bildirim oluşturma testi"""
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Boş mesajlı bildirim oluştur
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Test Notification',
        message='',  # Boş mesaj
        is_read=False
    )
    session.add(notification)
    session.commit()

    # Bildirimi getir
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert data['notifications'][0]['message'] == ''

def test_notification_very_long_title(test_client, setup_test_data, session):
    """Çok uzun başlıklı bildirim testi"""
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # 500 karakterlik başlık oluştur
    long_title = 'A' * 500

    # Uzun başlıklı bildirim oluştur
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title=long_title,
        message='Test Message',
        is_read=False
    )
    session.add(notification)
    session.commit()

    # Bildirimi getir
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert len(data['notifications'][0]['title']) == 500

def test_notification_special_characters(test_client, setup_test_data, session):
    """Özel karakterler içeren bildirim testi"""
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Özel karakterler içeren bildirim oluştur
    special_message = "!@#$%^&*()_+<>?:\"{}|~`';\\/.,[]"
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Special Characters Test',
        message=special_message,
        is_read=False
    )
    session.add(notification)
    session.commit()

    # Bildirimi getir
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert data['notifications'][0]['message'] == special_message

def test_notification_unicode_characters(test_client, setup_test_data, session):
    """Unicode karakterler içeren bildirim testi"""
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Unicode karakterler içeren bildirim oluştur
    unicode_message = "🎓 Eğitim 📚 Türkçe karakterler: ğüşıöç 🌟 More emojis: 🎯🎨"
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Unicode Test 🎉',
        message=unicode_message,
        is_read=False
    )
    session.add(notification)
    session.commit()

    # Bildirimi getir
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    assert data['notifications'][0]['message'] == unicode_message
    assert data['notifications'][0]['title'] == 'Unicode Test 🎉'

def test_notification_html_content(test_client, setup_test_data, session):
    """HTML içerik ile bildirim testi"""
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # HTML içerikli bildirim oluştur
    html_message = "<h1>Test Başlık</h1><p>Test paragraf <strong>kalın metin</strong></p><script>alert('test')</script>"
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='HTML Test',
        message=html_message,
        is_read=False
    )
    session.add(notification)
    session.commit()

    # Bildirimi getir
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 1
    # HTML içeriğin escape edilip edilmediğini kontrol et
    assert '<script>' not in data['notifications'][0]['message']

def test_concurrent_read_notification(test_client, test_app, setup_test_data, session):
    """Test concurrent read operations on a notification"""
    # Get student token
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    assert login_response.status_code == 200, f"Login failed: {login_response.get_json()}"
    token = login_response.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Create a test notification
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Test Notification',
        message='Test Message',
        is_read=False,
        created_at=datetime.now(UTC)
    )
    session.add(notification)
    session.commit()
    notification_id = notification.id
    print(f"\nCreated test notification with ID: {notification_id}")

    # Queue to store results from threads
    results = Queue()

    def make_request(thread_id):
        try:
            print(f"Thread {thread_id} starting request...")
            response = test_client.post(
                f'/api/courses/notifications/{notification_id}/read',
                headers=headers
            )
            print(f"Thread {thread_id} response: {response.status_code} - {response.get_json()}")
            results.put(response.status_code)
        except Exception as e:
            print(f"Thread {thread_id} error: {str(e)}")
            results.put(500)

    # Create and start threads with a slight delay between them
    threads = []
    for i in range(3):
        thread = Thread(target=make_request, args=(i,))
        threads.append(thread)
        thread.start()
        sleep(0.1)  # Small delay between thread starts

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    # Collect results
    status_codes = []
    while not results.empty():
        status_codes.append(results.get())

    print(f"All status codes: {status_codes}")

    # Verify results
    success_count = status_codes.count(200)
    conflict_count = status_codes.count(409)
    
    print(f"Success count: {success_count}")
    print(f"Conflict count: {conflict_count}")
    
    assert success_count == 1, f"Expected exactly one success, got {success_count}"
    assert conflict_count == 2, f"Expected two conflicts, got {conflict_count}"

    # Verify the notification is marked as read
    session.refresh(notification)
    assert notification.is_read == True, "Notification should be marked as read"
    assert notification.read_at is not None, "read_at should be set"

def test_notification_performance_large_dataset(test_client, setup_test_data, session):
    """Çok sayıda bildirim ile performans testi"""
    # 100 adet bildirim oluştur
    notifications = []
    for i in range(100):
        notification = Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title=f'Performance Test Notification {i}',
            message=f'Test Message {i}',
            is_read=False,
            created_at=datetime.now(UTC) - timedelta(minutes=i)  # Her bildirim 1 dakika arayla
        )
        notifications.append(notification)
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Sayfalandırma ile bildirimleri getir ve süreyi ölç
    start_time = datetime.now()
    response = test_client.get(
        '/api/courses/notifications/unread?page=1&per_page=50',
        headers={'Authorization': f'Bearer {token}'}
    )
    end_time = datetime.now()
    response_time = (end_time - start_time).total_seconds()

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == 50  # Sayfa başına 50 bildirim
    assert data['total_count'] == 100  # Toplam 100 bildirim
    assert response_time < 1.0  # 1 saniyeden kısa sürmeli

def test_notification_mixed_content_types(test_client, setup_test_data, session):
    """Farklı içerik türleri içeren bildirimler testi"""
    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Farklı içerik türleri
    contents = [
        # JSON içerik
        {
            'content': {
                'type': 'json_content',
                'data': {'key': 'value', 'nested': {'inner': 'data'}}
            },
            'content_type': 'json'
        },
        # Base64 içerik
        {
            'content': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            'content_type': 'base64'
        },
        # URL içerik
        {
            'content': 'https://example.com/test/path?param=value#fragment',
            'content_type': 'url'
        },
        # Markdown içerik
        {
            'content': '# Başlık\n## Alt Başlık\n* Liste öğesi\n* İkinci öğe\n[Link](https://example.com)',
            'content_type': 'markdown'
        },
        # SQL sorgusu - bu reddedilmeli
        {
            'content': 'SELECT * FROM users WHERE id = 1; DROP TABLE students;--',
            'content_type': 'text'
        }
    ]

    successful_notifications = []
    
    # Her içerik türü için bildirim oluşturmayı dene
    for i, content_data in enumerate(contents):
        response = test_client.post(
            '/api/courses/notifications/create-mixed',
            json={
                'title': f'Content Type Test {i}',
                'content': content_data['content'],
                'content_type': content_data['content_type'],
                'course_id': setup_test_data['course'].id
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        # SQL injection içeren içerik reddedilmeli
        if 'DROP TABLE' in str(content_data['content']):
            assert response.status_code == 400
            assert 'SQL komutları içeremez' in response.get_json()['message']
        else:
            assert response.status_code == 200
            successful_notifications.append(content_data)

    # Bildirimleri getir ve kontrol et
    response = test_client.get(
        '/api/courses/notifications/unread',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['notifications']) == len(successful_notifications)  # SQL injection içeren bildirim hariç

    # Her başarılı bildirim için içerik kontrolü
    for notification in data['notifications']:
        assert 'DROP TABLE' not in notification['message']  # SQL injection olmamalı
        if notification['type'].startswith('mixed_content_json'):
            # JSON içeriği doğrula
            content = json.loads(notification['message'])
            assert 'data' in content
        elif notification['type'].startswith('mixed_content_base64'):
            # Base64 içeriği doğrula
            assert notification['message'].startswith('data:')
        elif notification['type'].startswith('mixed_content_url'):
            # URL içeriği doğrula
            assert notification['message'].startswith('http')
        elif notification['type'].startswith('mixed_content_markdown'):
            # Markdown içeriği doğrula
            assert '#' in notification['message']

def test_notification_stress_concurrent_reads(test_client, setup_test_data, session):
    """Eş zamanlı okuma işlemleri stres testi"""
    # Test bildirimi oluştur
    notification = Notification(
        user_id=setup_test_data['student'].id,
        course_id=setup_test_data['course'].id,
        type='test_notification',
        title='Stress Test Notification',
        message='Test Message',
        is_read=False,
        created_at=datetime.now(UTC)
    )
    session.add(notification)
    session.commit()
    notification_id = notification.id
    print(f"\nCreated test notification with ID: {notification_id}")

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    assert login_response.status_code == 200, f"Login failed: {login_response.get_json()}"
    token = login_response.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Queue to store results from threads
    results = Queue()

    def make_request(thread_id):
        try:
            print(f"Thread {thread_id} starting request...")
            response = test_client.post(
                f'/api/courses/notifications/{notification_id}/read',  # Correct endpoint
                headers=headers
            )
            print(f"Thread {thread_id} response: {response.status_code} - {response.get_json()}")
            results.put(response.status_code)
        except Exception as e:
            print(f"Thread {thread_id} error: {str(e)}")
            results.put(500)

    # Create and start threads with a slight delay between them
    threads = []
    for i in range(3):
        thread = Thread(target=make_request, args=(i,))
        threads.append(thread)
        thread.start()
        sleep(0.1)  # Small delay between thread starts

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    # Collect results
    status_codes = []
    while not results.empty():
        status_codes.append(results.get())

    print(f"All status codes: {status_codes}")

    # Verify results
    success_count = status_codes.count(200)
    conflict_count = status_codes.count(409)
    
    print(f"Success count: {success_count}")
    print(f"Conflict count: {conflict_count}")
    
    assert success_count == 1, f"Expected exactly one success, got {success_count}"
    assert conflict_count == 2, f"Expected two conflicts, got {conflict_count}"

    # Verify the notification is marked as read
    session.refresh(notification)
    assert notification.is_read == True, "Notification should be marked as read"
    assert notification.read_at is not None, "read_at should be set"

def test_notification_cleanup_old_notifications(test_client, setup_test_data, session):
    """Eski bildirimlerin temizlenmesi testi"""
    # Farklı tarihlerde bildirimler oluştur
    now = datetime.now(UTC)
    notifications = [
        # 1 yıl önce
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='old_notification',
            title='Very Old Notification',
            message='Test Message',
            is_read=True,
            created_at=now - timedelta(days=365)
        ),
        # 6 ay önce
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='old_notification',
            title='Old Notification',
            message='Test Message',
            is_read=True,
            created_at=now - timedelta(days=180)
        ),
        # 1 ay önce
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='recent_notification',
            title='Recent Notification',
            message='Test Message',
            is_read=True,
            created_at=now - timedelta(days=30)
        ),
        # Bugün
        Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='new_notification',
            title='New Notification',
            message='Test Message',
            is_read=False,
            created_at=now
        )
    ]
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # Temizlik işlemi endpoint'ini çağır
    response = test_client.post(
        '/api/courses/notifications/cleanup',
        json={'days_threshold': 90},  # 90 günden eski bildirimleri temizle
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['deleted_count'] == 2  # 1 yıl ve 6 ay önceki bildirimler silinmeli

    # Kalan bildirimleri kontrol et
    remaining = session.scalars(
        db.select(Notification)
        .filter_by(user_id=setup_test_data['student'].id)
    ).all()
    
    assert len(remaining) == 2  # Sadece 1 ay önce ve bugünkü bildirimler kalmalı
    assert all(n.created_at > (now - timedelta(days=90)) for n in remaining)

def test_notification_bulk_status_update(test_client, setup_test_data, session):
    """Toplu bildirim durumu güncelleme testi"""
    # 5 bildirim oluştur
    notifications = []
    for i in range(5):
        notification = Notification(
            user_id=setup_test_data['student'].id,
            course_id=setup_test_data['course'].id,
            type='test_notification',
            title=f'Bulk Update Test {i}',
            message=f'Test Message {i}',
            is_read=False
        )
        notifications.append(notification)
    session.add_all(notifications)
    session.commit()

    # Öğrenci olarak giriş yap
    login_response = test_client.post('/api/auth/login', json={
        'email': 'student@test.com',
        'password': 'password123'
    })
    token = login_response.get_json()['access_token']

    # 3 bildirimi seç ve durumlarını güncelle
    selected_ids = [notifications[0].id, notifications[2].id, notifications[4].id]
    response = test_client.post(
        '/api/courses/notifications/bulk-update',
        json={
            'notification_ids': selected_ids,
            'is_read': True,
            'type': 'updated_type'
        },
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['updated_count'] == 3

    # Güncellenen bildirimleri kontrol et
    updated_notifications = session.scalars(
        db.select(Notification)
        .filter(Notification.id.in_(selected_ids))
    ).all()

    for notification in updated_notifications:
        assert notification.is_read == True
        assert notification.type == 'updated_type'
        assert notification.read_at is not None 