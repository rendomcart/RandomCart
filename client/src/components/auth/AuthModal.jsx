import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import * as authApi from '../../api/auth.api';
import { Mail, Lock, User as UserIcon, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import OtpInput from './OtpInput';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState(initialView); // 'login', 'register', 'otp', 'forgot', 'reset_otp', 'reset_password'
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  
  // OTP State
  const [otp, setOtp] = useState('');
  
  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Password Visibility Toggle
  const [showPassword, setShowPassword] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setShowPassword(false);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      if (res.success) {
        toast.success('Successfully logged in!');
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register({
        name: regData.name,
        email: regData.email,
        password: regData.password
      });
      if (data.success) {
        toast.success(`OTP sent to ${regData.email}`);
        setView('otp');
        setTimeLeft(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Please enter a 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail({ email: regData.email, otp });
      if (data.success) {
        if (regData.password) {
          try {
            const res = await login({ email: regData.email, password: regData.password });
            if (res.success) {
              toast.success('Account created successfully!');
              onClose();
            }
          } catch (loginErr) {
            toast.success('Email verified successfully! Please log in.');
            setView('login');
          }
        } else {
          toast.success('Email verified successfully! Please log in.');
          setView('login');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const emailToUse = regData.email || resetEmail;
    if (!emailToUse) return;
    
    setLoading(true);
    try {
      // Different resend logic based on the view
      if (view === 'otp') {
        const { data } = await authApi.resendVerifyOTP({ email: emailToUse });
        if (data.success) {
          toast.success('OTP Resent Successfully');
          setTimeLeft(60);
        }
      } else if (view === 'reset_otp') {
        const { data } = await authApi.forgotPassword({ email: emailToUse });
        if (data.success) {
          toast.success('Reset Code Resent Successfully');
          setTimeLeft(60);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
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
        setTimeLeft(60);
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
        toast.success('OTP verified! Enter your new password.');
        setView('reset_password');
        setOtp('');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          ✕
        </button>
        
        <div className="p-8 pb-6">
          <div className="flex flex-col items-center justify-center mb-8">
            <img src="/logo.png" alt="RandomCart Logo" className="h-14 w-auto object-contain mb-4" />
            <h2 className="text-2xl font-bold text-center text-text-main">
              {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Create Account' : view === 'otp' || view === 'verify_request' ? 'Verify Email' : view === 'forgot' ? 'Forgot Password' : view === 'reset_otp' ? 'Verify Reset OTP' : 'New Password'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {view === 'login' ? 'Please enter your details to sign in.' : view === 'register' ? 'Join us today for the best shopping experience.' : view === 'verify_request' ? 'Enter your email to verify your account.' : 'Secure your account'}
            </p>
          </div>
          
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border p-2.5 pl-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <span onClick={() => {setView('forgot');}} className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border p-2.5 pl-10 pr-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-2 transition-colors">
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
              <div className="mt-4 text-center text-sm text-gray-600">
                Don't have an account? <span onClick={() => {setView('register');}} className="text-primary font-medium hover:underline cursor-pointer">Register</span>
              </div>
              <div className="mt-3 text-center text-sm text-gray-600">
                Registered but not verified? <span onClick={() => { setView('verify_request'); }} className="text-primary font-medium hover:underline cursor-pointer">Verify Email</span>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="text" value={regData.name} onChange={(e) => setRegData({...regData, name: e.target.value})} className="w-full border p-2.5 pl-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="email" value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} className="w-full border p-2.5 pl-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required minLength="8" type={showPassword ? "text" : "password"} value={regData.password} onChange={(e) => setRegData({...regData, password: e.target.value})} className="w-full border p-2.5 pl-10 pr-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-2 transition-colors">
                {loading ? 'Creating Account...' : 'Register'}
              </button>
              <div className="mt-4 text-center text-sm text-gray-600">
                Already have an account? <span onClick={() => {setView('login');}} className="text-primary font-medium hover:underline cursor-pointer">Login</span>
              </div>
            </form>
          )}

          {view === 'verify_request' && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const { data } = await authApi.resendVerifyOTP({ email: regData.email });
                if (data.success) {
                  toast.success('OTP Sent Successfully');
                  setView('otp');
                  setTimeLeft(60);
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to send OTP');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <div className="text-sm text-gray-600 mb-4 text-center">
                Enter your email address to receive a verification code.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="email" value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} className="w-full border p-2.5 pl-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-2 transition-colors">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <div className="mt-4 text-center text-sm text-gray-600">
                <span onClick={() => {setView('login');}} className="text-primary font-medium hover:underline cursor-pointer">Back to Login</span>
              </div>
            </form>
          )}

          {view === 'otp' && (
            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <div className="bg-green-50 text-green-700 p-3 rounded text-sm text-center">
                We sent a 6-digit code to <br/><strong>{regData.email}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter Verification Code</label>
                <div className="flex justify-center">
                  <OtpInput length={6} onOtpChange={setOtp} />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-accent text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-4 transition-colors">
                {loading ? 'Verifying...' : 'Verify Email & Login'}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  disabled={timeLeft > 0 || loading} 
                  className="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline font-medium"
                >
                  {timeLeft > 0 ? `Resend Code in ${timeLeft}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-sm text-gray-600 mb-4 text-center">
                Enter your email address and we'll send you an OTP to reset your password.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full border p-2.5 pl-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-2 transition-colors">
                {loading ? 'Sending...' : 'Send Reset OTP'}
              </button>
              <div className="mt-4 text-center text-sm text-gray-600">
                Remember your password? <span onClick={() => {setView('login');}} className="text-primary font-medium hover:underline cursor-pointer">Back to Login</span>
              </div>
            </form>
          )}

          {view === 'reset_otp' && (
            <form onSubmit={handleVerifyResetOtp} className="space-y-4">
              <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4 border border-green-100 text-center">
                A password reset OTP has been sent to <strong>{resetEmail}</strong>.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Enter 6-digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input required type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border p-3 pl-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center tracking-widest text-2xl font-bold" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-accent text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-2 transition-colors">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {view === 'reset_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-sm text-gray-600 mb-4 text-center">
                OTP verified! Please enter your new password below.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required minLength="8" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-2.5 pl-10 pr-10 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded font-medium shadow hover:bg-opacity-90 disabled:bg-gray-400 mt-2 transition-colors">
                {loading ? 'Resetting...' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
