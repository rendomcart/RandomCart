import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import * as userApi from '../api/user.api';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Upload, CheckCircle2 } from 'lucide-react';

const formatImgUrl = (url) => {
  if (!url) return '';
  const urlStr = typeof url === 'object' ? url.url : url;
  if (!urlStr) return '';
  if (typeof urlStr === 'string' && urlStr.startsWith('http')) return urlStr;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${urlStr}`;
};

const ProfilePage = () => {
  const { user, updateUser, loadUser } = useContext(AuthContext);
  const { socket } = useSocket();
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    avatar: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar?.url || (typeof user.avatar === 'string' ? user.avatar : '')
      });
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('profile_updated', loadUser);

    return () => {
      socket.off('profile_updated', loadUser);
    };
  }, [socket, loadUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await userApi.updateProfile(profileData);
      if (data.success) {
        updateUser(data.data);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const { data } = await userApi.uploadImage(formData);
      if (data.success) {
        setProfileData({ ...profileData, avatar: import.meta.env.VITE_API_URL.replace('/api', '') + data.data });
        toast.success('Image uploaded. Click Save Profile to apply.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setPassLoading(true);
    try {
      const { data } = await userApi.updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      if (data.success) {
        toast.success('Password updated successfully');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar for account navigation */}
      <div className="w-full md:w-1/4">
        <div className="bg-white p-4 rounded shadow-sm border">
          <ul className="space-y-2">
            <li><Link to="/profile" className="block p-2 bg-gray-100 font-medium text-primary rounded">Profile</Link></li>
            <li><Link to="/addresses" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Addresses</Link></li>
            <li><Link to="/orders" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Orders</Link></li>
            <li><Link to="/my-reviews" className="block p-2 hover:bg-gray-50 rounded text-gray-700">My Reviews</Link></li>
          </ul>
        </div>
      </div>

      <div className="w-full md:w-3/4 flex flex-col lg:flex-row gap-8">
        {/* Profile Info Form */}
        <div className="flex-1 bg-white p-6 rounded shadow-sm border">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                {profileData.avatar ? (
                  <img src={formatImgUrl(profileData.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture</label>
                <div className="relative inline-block w-full sm:w-auto">
                  <input 
                    type="file" 
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                  />
                  <div className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm transition-all ${
                      uploading 
                      ? 'bg-gray-50 text-gray-400 border-gray-200' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}>
                    <Upload size={16} className={uploading ? 'animate-pulse' : ''} />
                    <span>{uploading ? 'Uploading Image...' : 'Upload New Photo'}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={profileData.name} 
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  className="w-full border p-2 rounded" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Email Address</label>
                  {user?.isVerified ? (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Verified</span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">⚠ Unverified</span>
                  )}
                </div>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full border p-2 rounded bg-gray-100 text-gray-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  type="text" 
                  value={profileData.phone} 
                  onChange={e => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full border p-2 rounded" 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="flex-1 bg-white p-6 rounded shadow-sm border">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input 
                required 
                type="password" 
                value={passwordData.oldPassword} 
                onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                className="w-full border p-2 rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input 
                required 
                type="password" 
                minLength="8"
                value={passwordData.newPassword} 
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full border p-2 rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input 
                required 
                type="password" 
                minLength="8"
                value={passwordData.confirmPassword} 
                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full border p-2 rounded" 
              />
            </div>
            <button 
              type="submit" 
              disabled={passLoading}
              className="bg-accent text-white px-6 py-2 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {passLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
