import React, { useState, useEffect } from 'react';
import { Users, Database, BarChart3, Phone, Link, Hash, LogOut, LogIn } from 'lucide-react';
import { auth, dashboard, nsoTrunks, vnoTrunks, customers, trunkMappings, dids } from './api';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [data, setData] = useState({
    nsoTrunks: [],
    vnoTrunks: [],
    customers: [],
    trunkMappings: [],
    dids: [],
    dashboardStats: null
  });
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
      loadData();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [activePage, isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activePage === 'dashboard') {
        const res = await dashboard.getStats();
        setData(prev => ({ ...prev, dashboardStats: res.data }));
      } else if (activePage === 'nso') {
        const res = await nsoTrunks.getAll();
        setData(prev => ({ ...prev, nsoTrunks: res.data }));
      } else if (activePage === 'vno') {
        const res = await vnoTrunks.getAll();
        setData(prev => ({ ...prev, vnoTrunks: res.data }));
      } else if (activePage === 'customers') {
        const res = await customers.getAll();
        setData(prev => ({ ...prev, customers: res.data }));
      } else if (activePage === 'mapping') {
        const res = await trunkMappings.getAll();
        setData(prev => ({ ...prev, trunkMappings: res.data }));
      } else if (activePage === 'dids') {
        const res = await dids.getAll();
        setData(prev => ({ ...prev, dids: res.data }));
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await auth.login(loginForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ 
        username: res.data.username, 
        role: res.data.role 
      }));
      setCurrentUser({ username: res.data.username, role: res.data.role });
      setIsAuthenticated(true);
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActivePage('dashboard');
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setError('');
    
    try {
      const { type, id, ...itemData } = editingItem;
      
      if (type === 'nsoTrunk') {
        if (id && typeof id === 'number' && id > 0 && id < 1000000) {
          await nsoTrunks.update(id, itemData);
        } else {
          await nsoTrunks.create(itemData);
        }
      } else if (type === 'vnoTrunk') {
        if (id && typeof id === 'number' && id > 0 && id < 1000000) {
          await vnoTrunks.update(id, itemData);
        } else {
          await vnoTrunks.create(itemData);
        }
      } else if (type === 'customer') {
        if (id && typeof id === 'number' && id > 0 && id < 1000000) {
          await customers.update(id, itemData);
        } else {
          await customers.create(itemData);
        }
      } else if (type === 'mapping') {
        if (id && typeof id === 'number' && id > 0 && id < 1000000) {
          await trunkMappings.update(id, itemData);
        } else {
          await trunkMappings.create(itemData);
        }
      } else if (type === 'did') {
        if (id && typeof id === 'number' && id > 0 && id < 1000000) {
          await dids.update(id, itemData);
        } else {
          await dids.create(itemData);
        }
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      setError('Failed to save data');
      console.error(err);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      if (type === 'nsoTrunk') await nsoTrunks.delete(id);
      else if (type === 'vnoTrunk') await vnoTrunks.delete(id);
      else if (type === 'customer') await customers.delete(id);
      else if (type === 'mapping') await trunkMappings.delete(id);
      else if (type === 'did') await dids.delete(id);
      
      loadData();
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setIsModalOpen(true);
  };

  const handleAdd = (type) => {
    const newItem = type === 'nsoTrunk' ? 
      { id: Date.now(), serviceId: '', pilotNumber: '', channels: 0, areaCode: '', status: 'Active' } :
      type === 'vnoTrunk' ?
      { id: Date.now(), serviceId: '', pilotNumber: '', channels: 0, areaCode: '', status: 'Active', customerId: 0 } :
      type === 'did' ?
      { id: Date.now(), didNumber: '', trunkId: 0, trunkType: 'VNO', status: 'Available' } :
      type === 'mapping' ?
      { id: Date.now(), nsoTrunkId: 0, vnoTrunkId: 0, allocatedChannels: 0 } :
      { id: Date.now(), name: '', email: '', phone: '' };
    
    setEditingItem({ ...newItem, type });
    setIsModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Database className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Telecom Inventory Login
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </button>
          </form>
          <p className="text-sm text-gray-600 text-center mt-4">
            Default: admin / admin123
          </p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!data.dashboardStats) return <div>Loading...</div>;
    
    const { statsByAreaCode, totalNSOTrunks, totalVNOTrunks, totalDIDs } = data.dashboardStats;
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Resource Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(statsByAreaCode).map(([areaCode, stat]) => (
            <div key={areaCode} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Area Code: {areaCode}</h3>
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Channels:</span>
                  <span className="font-semibold text-gray-800">{stat.totalChannels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allocated:</span>
                  <span className="font-semibold text-green-600">{stat.allocatedChannels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-semibold text-orange-600">{stat.remainingChannels}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="font-bold text-blue-600">{stat.utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${stat.utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
            <h4 className="text-sm font-medium opacity-90">Total NSO Trunks</h4>
            <p className="text-3xl font-bold mt-2">{totalNSOTrunks}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white">
            <h4 className="text-sm font-medium opacity-90">Total VNO Trunks</h4>
            <p className="text-3xl font-bold mt-2">{totalVNOTrunks}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
            <h4 className="text-sm font-medium opacity-90">Total DIDs</h4>
            <p className="text-3xl font-bold mt-2">{totalDIDs}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (title, columns, dataArray, type) => {
    const canEdit = currentUser.role === 'admin';
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {canEdit && (
            <button 
              onClick={() => handleAdd(type)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Add New
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataArray.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-800">
                        {item[col.key] || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      {canEdit && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(item, type)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id, type)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderEditModal = () => {
    if (!isModalOpen || !editingItem) return null;

    const fields = editingItem.type === 'nsoTrunk' ?
      ['serviceId', 'pilotNumber', 'channels', 'areaCode', 'status'] :
      editingItem.type === 'vnoTrunk' ?
      ['serviceId', 'pilotNumber', 'channels', 'areaCode', 'status', 'customerId'] :
      editingItem.type === 'did' ?
      ['didNumber', 'trunkId', 'trunkType', 'status'] :
      editingItem.type === 'mapping' ?
      ['nsoTrunkId', 'vnoTrunkId', 'allocatedChannels'] :
      ['name', 'email', 'phone'];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            {editingItem.id && editingItem.id < 1000000 ? 'Edit' : 'Add'} {editingItem.type}
          </h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                {field === 'status' ? (
                  <select
                    value={editingItem[field] || 'Active'}
                    onChange={(e) => setEditingItem({...editingItem, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                  </select>
                ) : field === 'trunkType' ? (
                  <select
                    value={editingItem[field] || 'VNO'}
                    onChange={(e) => setEditingItem({...editingItem, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NSO">NSO</option>
                    <option value="VNO">VNO</option>
                  </select>
                ) : (
                  <input
                    type={field.includes('channels') || field.includes('Id') ? 'number' : 'text'}
                    value={editingItem[field] || ''}
                    onChange={(e) => setEditingItem({...editingItem, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleSave}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Save
            </button>
            <button 
              onClick={() => { setIsModalOpen(false); setEditingItem(null); setError(''); }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Telecom Inventory Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
              {currentUser.role === 'admin' ? 'Admin' : 'User'}: {currentUser.username}
            </span>
            <button onClick={handleLogout} className="hover:bg-blue-700 p-2 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto">
          <nav className="flex gap-2 p-2 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'nso', label: 'NSO Trunks', icon: Phone },
              { id: 'vno', label: 'VNO Trunks', icon: Phone },
              { id: 'mapping', label: 'Trunk Mapping', icon: Link },
              { id: 'dids', label: 'DIDs', icon: Hash },
              { id: 'customers', label: 'Customers', icon: Users }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                    activePage === item.id 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {error && activePage !== 'dashboard' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {activePage === 'dashboard' && renderDashboard()}
        {activePage === 'nso' && renderTable(
          'NSO Trunks',
          [
            { key: 'serviceId', label: 'Service ID' },
            { key: 'pilotNumber', label: 'Pilot Number' },
            { key: 'channels', label: 'Channels' },
            { key: 'areaCode', label: 'Area Code' },
            { key: 'status', label: 'Status' }
          ],
          data.nsoTrunks,
          'nsoTrunk'
        )}
        {activePage === 'vno' && renderTable(
          'VNO Trunks',
          [
            { key: 'serviceId', label: 'Service ID' },
            { key: 'pilotNumber', label: 'Pilot Number' },
            { key: 'channels', label: 'Channels' },
            { key: 'areaCode', label: 'Area Code' },
            { key: 'customerId', label: 'Customer ID' },
            { key: 'status', label: 'Status' }
          ],
          data.vnoTrunks,
          'vnoTrunk'
        )}
        {activePage === 'mapping' && renderTable(
          'NSO to VNO Trunk Mapping',
          [
            { key: 'nsoTrunkId', label: 'NSO Trunk ID' },
            { key: 'vnoTrunkId', label: 'VNO Trunk ID' },
            { key: 'allocatedChannels', label: 'Allocated Channels' }
          ],
          data.trunkMappings,
          'mapping'
        )}
        {activePage === 'dids' && renderTable(
          'DID Numbers',
          [
            { key: 'didNumber', label: 'DID Number' },
            { key: 'trunkId', label: 'Trunk ID' },
            { key: 'trunkType', label: 'Trunk Type' },
            { key: 'status', label: 'Status' }
          ],
          data.dids,
          'did'
        )}
        {activePage === 'customers' && renderTable(
          'VNO Customers',
          [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' }
          ],
          data.customers,
          'customer'
        )}
      </div>

      {renderEditModal()}
    </div>
  );
};

export default App;
