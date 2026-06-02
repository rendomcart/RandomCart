import { useState, useEffect } from 'react';
import * as authApi from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { Upload } from 'lucide-react';

const formatImgUrl = (url) => {
  if (!url) return '';
  const urlStr = typeof url === 'object' ? url.url : url;
  if (!urlStr) return '';
  if (typeof urlStr === 'string' && urlStr.startsWith('http')) return urlStr;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${urlStr}`;
};

const AdminProfilePage = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data } = await authApi.getMe();
        if (data.success) {
          setAdminData(data.data);
          setProfileData({
            name: data.data.name || '',
            phone: data.data.phone || '',
            avatar: data.data.avatar?.url || (typeof data.data.avatar === 'string' ? data.data.avatar : '')
          });
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authApi.updateProfile(profileData);
      if (data.success) {
        setAdminData(data.data);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const { data } = await authApi.uploadImage(formData);
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
      const { data } = await authApi.updatePassword({
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

  if (loading) return <div className="text-gray-500">Loading profile...</div>;
  if (!adminData) return <div className="text-gray-500">No profile data found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-text-main">Admin Profile</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Profile Info Form */}
        <div className="flex-1 bg-white p-6 rounded shadow-sm border">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-primary text-white rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl font-bold shadow-sm">
                {profileData.avatar ? (
                  <img src={formatImgUrl(profileData.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  adminData.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium mb-2">Upload Profile Picture</label>
                <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 p-3 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
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
                  {adminData.isVerified ? (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Verified Admin</span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">⚠ Unverified</span>
                  )}
                </div>
                <input 
                  type="email" 
                  value={adminData.email || ''} 
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
              disabled={savingProfile}
              className="bg-primary text-white px-6 py-2 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
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

export default AdminProfilePage;
