import pytest
from datetime import datetime, timedelta, UTC
from models import db, User, Course, Lesson, Assignment, Notification, Enrollment
from werkzeug.security import generate_password_hash

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
    assignment = Assignment(
        title='Test Assignment',
        description='Test Description',
        lesson_id=setup_test_data['lesson'].id,
        due_date=datetime.now(UTC) + timedelta(days=2)
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
        f'/api/courses/notifications/{notification.id}/mark-read',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    
    # Bildirimin okundu olarak işaretlendiğini kontrol et
    updated_notification = session.get(Notification, notification.id)
    assert updated_notification.is_read == True

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