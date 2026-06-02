import { useState, useEffect } from 'react';
import * as userApi from '../api/user.api';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  
  const initialFormState = {
    fullName: '', address: '', city: '', state: '', postalCode: '', phone: '', country: 'India', isDefault: false
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('address_updated', fetchAddresses);

    return () => {
      socket.off('address_updated', fetchAddresses);
    };
  }, [socket]);

  const fetchAddresses = async () => {
    try {
      const { data } = await userApi.getProfile();
      if (data.success) {
        setAddresses(data.data.addresses || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { data } = await userApi.updateAddress(editingId, formData);
        setAddresses(data.data);
      } else {
        const { data } = await userApi.addAddress(formData);
        setAddresses(data.data);
      }
      closeModal();
      toast.success('Address saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error saving address');
    }
  };

  const executeDelete = async (id) => {
    try {
      const { data } = await userApi.deleteAddress(id);
      setAddresses(data.data);
      toast.success('Address deleted successfully');
      setConfirmModal({ isOpen: false, id: null });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete address');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleSetDefault = async (id) => {
    try {
      const { data } = await userApi.updateAddress(id, { isDefault: true });
      setAddresses(data.data);
      toast.success('Default address updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update default address');
    }
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (address) => {
    setFormData(address);
    setEditingId(address._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 relative">
      {/* Sidebar for account navigation */}
      <div className="w-full md:w-1/4">
        <div className="bg-white p-4 rounded shadow-sm border">
          <ul className="space-y-2">
            <li><Link to="/profile" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Profile</Link></li>
            <li><Link to="/addresses" className="block p-2 bg-gray-100 font-medium text-primary rounded">Addresses</Link></li>
            <li><Link to="/orders" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Orders</Link></li>
          </ul>
        </div>
      </div>

      <div className="w-full md:w-3/4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text-main">Saved Addresses</h1>
          <button 
            onClick={openAddModal}
            className="bg-primary text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-opacity-90 whitespace-nowrap flex-shrink-0"
          >
            + Add New Address
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(address => (
            <div key={address._id} className={`bg-white p-5 rounded shadow-sm border ${address.isDefault ? 'border-primary' : ''}`}>
              {address.isDefault && (
                <span className="inline-block bg-primary text-white text-xs px-2 py-1 rounded mb-2">Default</span>
              )}
              <h3 className="font-bold text-lg mb-1">{address.fullName}</h3>
              <p className="text-sm text-gray-600 mb-1">{address.address}</p>
              <p className="text-sm text-gray-600 mb-1">{address.city}, {address.state} {address.postalCode}</p>
              <p className="text-sm text-gray-600 mb-3">{address.country}</p>
              <p className="text-sm font-medium mb-4">Phone: {address.phone}</p>
              
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <button onClick={() => openEditModal(address)} className="text-sm text-primary hover:underline">Edit</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => handleDelete(address._id)} className="text-sm text-red-500 hover:underline">Delete</button>
                {!address.isDefault && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => handleSetDefault(address._id)} className="text-sm text-accent hover:underline">Set as Default</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="col-span-2 text-center py-10 text-gray-500 bg-white border rounded">
              You haven't saved any addresses yet.
            </div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code *</label>
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
                {!editingId && (
                  <div className="col-span-2 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} className="text-primary rounded focus:ring-primary h-4 w-4" />
                      <span className="text-sm font-medium">Set as default address</span>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-opacity-90">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message="Are you sure you want to delete this address?"
        onConfirm={() => executeDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default AddressesPage;
