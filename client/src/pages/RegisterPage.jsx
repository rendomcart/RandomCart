import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import OtpInput from '../components/auth/OtpInput';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // OTP Verification state
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      const { data } = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      if (data.success) {
        setOtpSent(true);
        setTimeLeft(60);
        toast.success(`OTP sent to ${formData.email}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Please enter a 6-digit OTP');
    setLoading(true);
    
    try {
      const { data } = await authApi.verifyEmail({ email: formData.email, otp });
      if (data.success) {
        toast.success('Account created successfully!');
        window.location.href = '/'; 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!formData.email) return;
    setLoading(true);
    try {
      const { data } = await authApi.resendVerifyOTP({ email: formData.email });
      if (data.success) {
        toast.success('OTP Resent Successfully');
        setTimeLeft(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col items-center justify-center mb-8">
        <img src="/logo.png" alt="RandomCart Logo" className="h-16 w-auto object-contain mb-4" />
        <h1 className="text-2xl font-bold text-center text-text-main">
          {otpSent ? 'Verify Your Email' : 'Create an Account'}
        </h1>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {otpSent ? 'Enter the OTP sent to your email.' : 'Join us today for the best shopping experience.'}
        </p>
      </div>
      
      {!otpSent ? (
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input required minLength="6" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full border p-2 pr-10 rounded focus:border-primary outline-none" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400 mt-2">
            {loading ? 'Creating Account...' : 'Register'}
          </button>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <Link to="/auth/login" className="text-primary font-medium hover:underline">Login here</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm text-center">
            An OTP has been sent to <strong>{formData.email}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium mb-3 text-center text-gray-700">Enter Verification Code</label>
            <div className="flex justify-center">
              <OtpInput length={6} onOtpChange={setOtp} />
            </div>
          </div>
          <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-accent text-white py-2.5 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400 mt-4 transition-colors">
            {loading ? 'Verifying...' : 'Verify OTP & Login'}
          </button>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={handleResendOTP} 
              disabled={timeLeft > 0 || loading} 
              className="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline font-medium"
            >
              {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterPage;
