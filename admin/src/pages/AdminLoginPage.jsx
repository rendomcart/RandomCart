import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import * as authApi from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { Mail, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';

const AdminLoginPage = () => {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset_otp', 'reset_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await axios.post('/auth/login', { email, password, appType: 'admin' });
      if (data.success) {
        localStorage.setItem('adminToken', data.token); // Store token if needed
        toast.success('Successfully logged in as Admin!');
        setTimeout(() => {
          window.location.href = '/'; 
        }, 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email: resetEmail });
      if (data.success) {
        setView('reset_otp');
        toast.success(`An OTP has been sent to ${resetEmail}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.verifyResetOTP({ email: resetEmail, otp });
      if (data.success) {
        setResetToken(data.data.resetToken);
        setView('reset_password');
        setOtp('');
        toast.success('OTP verified! Enter your new password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ resetToken, newPassword });
      if (data.success) {
        setView('login');
        toast.success('Password reset successfully. You can now log in.');
        setResetEmail('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src="/logo.png" alt="RandomCart Logo" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-2xl font-bold text-center text-text-main">
            {view === 'login' ? 'Admin Portal' : view === 'forgot' ? 'Forgot Password' : view === 'reset_otp' ? 'Verify OTP' : 'New Password'}
          </h1>
          <p className="text-center text-gray-500 text-sm mt-2">
            {view === 'login' ? 'Sign in to manage your store' : view === 'forgot' ? 'Enter your email to receive a reset code' : view === 'reset_otp' ? 'Check your email for the 6-digit code' : 'Set a new secure password'}
          </p>
        </div>
        
        {view === 'login' && (
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2.5 pl-10 rounded bg-gray-50 focus:bg-white focus:border-primary outline-none transition-colors" 
                placeholder="randomcart@gmail.com"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <span onClick={() => setView('forgot')} className="text-xs text-primary hover:underline cursor-pointer font-medium">Forgot password?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2.5 pl-10 pr-10 rounded bg-gray-50 focus:bg-white focus:border-primary outline-none transition-colors [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded font-bold shadow-sm hover:bg-opacity-90 transition-opacity disabled:bg-gray-400 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        )}

        {view === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required 
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full border p-2.5 pl-10 rounded bg-gray-50 focus:bg-white focus:border-primary outline-none transition-colors" 
                placeholder="randomcart@gmail.com"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded font-bold shadow-sm hover:bg-opacity-90 transition-opacity disabled:bg-gray-400 mt-4">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
          <div className="text-center mt-4">
            <span onClick={() => setView('login')} className="text-sm text-primary hover:underline cursor-pointer font-medium">Back to Login</span>
          </div>
        </form>
        )}

        {view === 'reset_otp' && (
        <form onSubmit={handleVerifyResetOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 text-center">6-Digit OTP</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                required 
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border p-3 pl-10 rounded bg-gray-50 focus:bg-white focus:border-primary outline-none transition-colors text-center tracking-widest text-2xl font-bold" 
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-accent text-white py-3 rounded font-bold shadow-sm hover:bg-opacity-90 transition-opacity disabled:bg-gray-400 mt-4">
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
        )}

        {view === 'reset_password' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                required 
                minLength="8"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border p-2.5 pl-10 pr-10 rounded bg-gray-50 focus:bg-white focus:border-primary outline-none transition-colors [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded font-bold shadow-sm hover:bg-opacity-90 transition-opacity disabled:bg-gray-400 mt-4">
            {loading ? 'Resetting...' : 'Save New Password'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;
