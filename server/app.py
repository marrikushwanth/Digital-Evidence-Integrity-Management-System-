import os
from flask import Flask, request
from flask_cors import CORS
from config import Config
from models.db import db
from extensions import limiter

# Import Blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.case_routes import case_bp
from routes.evidence_routes import evidence_bp
from routes.report_routes import report_bp
from routes.log_routes import log_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Restrict CORS to allowed origins in production (from config) or fallback to local
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    
    db.init_app(app)
    limiter.init_app(app)
    
    # Ensure upload folders exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['ENCRYPTED_FOLDER'], exist_ok=True)
    os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(case_bp)
    app.register_blueprint(evidence_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(log_bp)
    
    # Security Headers Middleware
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # HSTS should ideally only be enabled for HTTPS, but we can include it
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
        
    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        from utils.response import error_response
        return error_response(str(e.description) if e.description else 'Bad Request', status_code=400)
        
    @app.errorhandler(401)
    def unauthorized(e):
        from utils.response import error_response
        return error_response('Unauthorized', status_code=401)

    @app.errorhandler(403)
    def forbidden(e):
        from utils.response import error_response
        return error_response('Forbidden', status_code=403)

    @app.errorhandler(404)
    def not_found(e):
        from utils.response import error_response
        return error_response('Resource not found', status_code=404)
        
    @app.errorhandler(429)
    def ratelimit_handler(e):
        from utils.response import error_response
        return error_response("Too Many Requests", status_code=429)

    @app.errorhandler(500)
    def internal_server_error(e):
        from utils.response import error_response
        return error_response('Internal Server Error', status_code=500)

    @app.errorhandler(413)
    def request_entity_too_large(e):
        from utils.response import error_response
        return error_response('File too large. Maximum size is 100MB.', status_code=413)
        
    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Models must be imported before creating tables
        from models import user, case, evidence, log, report, auth
        db.create_all()
        
        # Simple schema migration for Phase 4 column addition
        try:
            db.session.execute("ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT 1")
            db.session.commit()
            print("Added email_notifications_enabled column to users table.")
        except Exception:
            # Column likely already exists
            db.session.rollback()

        print("Database tables created.")
        
        # Seed Super Admin and Roles if they don't exist
        from models.user import Role, User
        from models.auth import PasswordHistory
        import bcrypt
        
        roles = ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer']
        for role_name in roles:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))
        
        db.session.commit()
        
        super_admin_role = Role.query.filter_by(name='Super Admin').first()
        super_admin = User.query.filter_by(username='kushwanth').first()
        if not super_admin:
            import os
            # Read from env or use compliant fallback
            sa_password = os.environ.get('SUPER_ADMIN_PASSWORD', 'Kushwanth123!')
            hashed_pw = bcrypt.hashpw(sa_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            super_admin = User(
                username='kushwanth',
                email='kushwanth@deims.local',
                password_hash=hashed_pw,
                full_name='Super Admin Kushwanth',
                role_id=super_admin_role.id,
                status='Active'
            )
            db.session.add(super_admin)
            db.session.commit()
            
            # Record initial password
            hist = PasswordHistory(user_id=super_admin.id, password_hash=hashed_pw)
            db.session.add(hist)
            db.session.commit()
            
            print("Super admin user seeded.")
            
    app.run(host='0.0.0.0', port=5000, debug=True)
