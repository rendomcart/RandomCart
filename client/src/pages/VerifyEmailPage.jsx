import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import * as authApi from '../api/auth.api';
import OtpInput from '../components/auth/OtpInput';
import { AuthContext } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Verify OTP
  const [loading, setLoading] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we passed email via state (e.g., from login page or register page)
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      const { data } = await authApi.resendVerifyOTP({ email });
      if (data.success) {
        toast.success('OTP Sent Successfully');
        setStep(2);
        setTimeLeft(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Please enter a 6-digit OTP');

    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail({ email, otp });
      if (data.success) {
        toast.success('Email Verified Successfully! Please log in.');
        navigate('/auth/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col items-center justify-center mb-8">
        <img src="/logo.png" alt="RandomCart Logo" className="h-16 w-auto object-contain mb-4" />
        <h1 className="text-2xl font-bold text-center text-text-main">
          Verify Your Email
        </h1>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {step === 1 ? 'Enter your email to receive a verification code.' : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOTP} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full border p-2.5 rounded focus:border-primary outline-none" 
              placeholder="you@example.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary text-white py-2.5 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400 mt-2"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3 text-center text-gray-700">Enter Verification Code</label>
            <div className="flex justify-center">
              <OtpInput length={6} onOtpChange={setOtp} />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading || otp.length !== 6} 
            className="w-full bg-primary text-white py-2.5 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400 mt-4 transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={handleSendOTP} 
              disabled={timeLeft > 0 || loading} 
              className="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline font-medium"
            >
              {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-sm">
        <Link to="/auth/login" className="text-primary hover:underline">Back to Login</Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
