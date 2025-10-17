from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from database import db, init_db
from models import User, NSOTrunk, VNOTrunk, TrunkMapping, DID, Customer
import jwt
import bcrypt
from functools import wraps
from datetime import datetime, timedelta

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

init_db(app)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'role': user.role,
            'username': user.username
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/dashboard', methods=['GET'])
@token_required
def dashboard(current_user):
    nso_trunks = NSOTrunk.query.all()
    mappings = TrunkMapping.query.all()
    
    stats_by_area = {}
    for trunk in nso_trunks:
        if trunk.area_code not in stats_by_area:
            stats_by_area[trunk.area_code] = {
                'totalChannels': 0,
                'allocatedChannels': 0
            }
        stats_by_area[trunk.area_code]['totalChannels'] += trunk.channels
    
    for mapping in mappings:
        nso = NSOTrunk.query.get(mapping.nso_trunk_id)
        if nso:
            stats_by_area[nso.area_code]['allocatedChannels'] += mapping.allocated_channels
    
    for area in stats_by_area.values():
        area['remainingChannels'] = area['totalChannels'] - area['allocatedChannels']
        area['utilization'] = round((area['allocatedChannels'] / area['totalChannels'] * 100), 1) if area['totalChannels'] > 0 else 0
    
    return jsonify({
        'statsByAreaCode': stats_by_area,
        'totalNSOTrunks': len(nso_trunks),
        'totalVNOTrunks': VNOTrunk.query.count(),
        'totalDIDs': DID.query.count()
    })

# NSO Trunks Routes
@app.route('/api/nso-trunks', methods=['GET'])
@token_required
def get_nso_trunks(current_user):
    trunks = NSOTrunk.query.all()
    return jsonify([{
        'id': t.id,
        'serviceId': t.service_id,
        'pilotNumber': t.pilot_number,
        'channels': t.channels,
        'areaCode': t.area_code,
        'status': t.status
    } for t in trunks])

@app.route('/api/nso-trunks', methods=['POST'])
@token_required
@admin_required
def create_nso_trunk(current_user):
    data = request.get_json()
    trunk = NSOTrunk(
        service_id=data['serviceId'],
        pilot_number=data['pilotNumber'],
        channels=data['channels'],
        area_code=data['areaCode'],
        status=data.get('status', 'Active')
    )
    db.session.add(trunk)
    db.session.commit()
    return jsonify({'message': 'Created successfully', 'id': trunk.id}), 201

@app.route('/api/nso-trunks/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_nso_trunk(current_user, id):
    trunk = NSOTrunk.query.get_or_404(id)
    data = request.get_json()
    trunk.service_id = data['serviceId']
    trunk.pilot_number = data['pilotNumber']
    trunk.channels = data['channels']
    trunk.area_code = data['areaCode']
    trunk.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Updated successfully'})

@app.route('/api/nso-trunks/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_nso_trunk(current_user, id):
    trunk = NSOTrunk.query.get_or_404(id)
    db.session.delete(trunk)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

# VNO Trunks Routes
@app.route('/api/vno-trunks', methods=['GET'])
@token_required
def get_vno_trunks(current_user):
    trunks = VNOTrunk.query.all()
    return jsonify([{
        'id': t.id,
        'serviceId': t.service_id,
        'pilotNumber': t.pilot_number,
        'channels': t.channels,
        'areaCode': t.area_code,
        'status': t.status,
        'customerId': t.customer_id
    } for t in trunks])

@app.route('/api/vno-trunks', methods=['POST'])
@token_required
@admin_required
def create_vno_trunk(current_user):
    data = request.get_json()
    trunk = VNOTrunk(
        service_id=data['serviceId'],
        pilot_number=data['pilotNumber'],
        channels=data['channels'],
        area_code=data['areaCode'],
        status=data.get('status', 'Active'),
        customer_id=data['customerId']
    )
    db.session.add(trunk)
    db.session.commit()
    return jsonify({'message': 'Created successfully', 'id': trunk.id}), 201

@app.route('/api/vno-trunks/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_vno_trunk(current_user, id):
    trunk = VNOTrunk.query.get_or_404(id)
    data = request.get_json()
    trunk.service_id = data['serviceId']
    trunk.pilot_number = data['pilotNumber']
    trunk.channels = data['channels']
    trunk.area_code = data['areaCode']
    trunk.status = data['status']
    trunk.customer_id = data['customerId']
    db.session.commit()
    return jsonify({'message': 'Updated successfully'})

@app.route('/api/vno-trunks/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_vno_trunk(current_user, id):
    trunk = VNOTrunk.query.get_or_404(id)
    db.session.delete(trunk)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

# Customers Routes
@app.route('/api/customers', methods=['GET'])
@token_required
def get_customers(current_user):
    customers = Customer.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'email': c.email,
        'phone': c.phone
    } for c in customers])

@app.route('/api/customers', methods=['POST'])
@token_required
@admin_required
def create_customer(current_user):
    data = request.get_json()
    customer = Customer(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone')
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify({'message': 'Created successfully', 'id': customer.id}), 201

@app.route('/api/customers/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_customer(current_user, id):
    customer = Customer.query.get_or_404(id)
    data = request.get_json()
    customer.name = data['name']
    customer.email = data['email']
    customer.phone = data.get('phone')
    db.session.commit()
    return jsonify({'message': 'Updated successfully'})

@app.route('/api/customers/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_customer(current_user, id):
    customer = Customer.query.get_or_404(id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

# Trunk Mappings Routes
@app.route('/api/trunk-mappings', methods=['GET'])
@token_required
def get_trunk_mappings(current_user):
    mappings = TrunkMapping.query.all()
    return jsonify([{
        'id': m.id,
        'nsoTrunkId': m.nso_trunk_id,
        'vnoTrunkId': m.vno_trunk_id,
        'allocatedChannels': m.allocated_channels
    } for m in mappings])

@app.route('/api/trunk-mappings', methods=['POST'])
@token_required
@admin_required
def create_trunk_mapping(current_user):
    data = request.get_json()
    mapping = TrunkMapping(
        nso_trunk_id=data['nsoTrunkId'],
        vno_trunk_id=data['vnoTrunkId'],
        allocated_channels=data['allocatedChannels']
    )
    db.session.add(mapping)
    db.session.commit()
    return jsonify({'message': 'Created successfully', 'id': mapping.id}), 201

@app.route('/api/trunk-mappings/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_trunk_mapping(current_user, id):
    mapping = TrunkMapping.query.get_or_404(id)
    data = request.get_json()
    mapping.nso_trunk_id = data['nsoTrunkId']
    mapping.vno_trunk_id = data['vnoTrunkId']
    mapping.allocated_channels = data['allocatedChannels']
    db.session.commit()
    return jsonify({'message': 'Updated successfully'})

@app.route('/api/trunk-mappings/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_trunk_mapping(current_user, id):
    mapping = TrunkMapping.query.get_or_404(id)
    db.session.delete(mapping)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

# DIDs Routes
@app.route('/api/dids', methods=['GET'])
@token_required
def get_dids(current_user):
    dids = DID.query.all()
    return jsonify([{
        'id': d.id,
        'didNumber': d.did_number,
        'trunkId': d.trunk_id,
        'trunkType': d.trunk_type,
        'status': d.status
    } for d in dids])

@app.route('/api/dids', methods=['POST'])
@token_required
@admin_required
def create_did(current_user):
    data = request.get_json()
    did = DID(
        did_number=data['didNumber'],
        trunk_id=data['trunkId'],
        trunk_type=data['trunkType'],
        status=data.get('status', 'Available')
    )
    db.session.add(did)
    db.session.commit()
    return jsonify({'message': 'Created successfully', 'id': did.id}), 201

@app.route('/api/dids/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_did(current_user, id):
    did = DID.query.get_or_404(id)
    data = request.get_json()
    did.did_number = data['didNumber']
    did.trunk_id = data['trunkId']
    did.trunk_type = data['trunkType']
    did.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Updated successfully'})

@app.route('/api/dids/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_did(current_user, id):
    did = DID.query.get_or_404(id)
    db.session.delete(did)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
