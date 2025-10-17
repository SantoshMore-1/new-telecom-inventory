from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        create_admin_user()

def create_admin_user():
    from models import User
    import bcrypt
    import os
    
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        password = os.getenv('ADMIN_PASSWORD', 'admin123')
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        admin = User(
            username='admin',
            password=hashed.decode('utf-8'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully")
