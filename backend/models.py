from database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class NSOTrunk(db.Model):
    __tablename__ = 'nso_trunks'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.String(50), unique=True, nullable=False)
    pilot_number = db.Column(db.String(20), nullable=False)
    channels = db.Column(db.Integer, nullable=False)
    area_code = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VNOTrunk(db.Model):
    __tablename__ = 'vno_trunks'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.String(50), unique=True, nullable=False)
    pilot_number = db.Column(db.String(20), nullable=False)
    channels = db.Column(db.Integer, nullable=False)
    area_code = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='Active')
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    customer = db.relationship('Customer', backref='vno_trunks')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TrunkMapping(db.Model):
    __tablename__ = 'trunk_mappings'
    id = db.Column(db.Integer, primary_key=True)
    nso_trunk_id = db.Column(db.Integer, db.ForeignKey('nso_trunks.id'), nullable=False)
    vno_trunk_id = db.Column(db.Integer, db.ForeignKey('vno_trunks.id'), nullable=False)
    allocated_channels = db.Column(db.Integer, nullable=False)
    nso_trunk = db.relationship('NSOTrunk', backref='mappings')
    vno_trunk = db.relationship('VNOTrunk', backref='mappings')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DID(db.Model):
    __tablename__ = 'dids'
    id = db.Column(db.Integer, primary_key=True)
    did_number = db.Column(db.String(20), unique=True, nullable=False)
    trunk_id = db.Column(db.Integer, nullable=False)
    trunk_type = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='Available')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
