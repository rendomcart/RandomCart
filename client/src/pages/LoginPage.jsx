import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await login({ email, password });
      if (res.success) {
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col items-center justify-center mb-8">
        <img src="/logo.png" alt="RandomCart Logo" className="h-16 w-auto object-contain mb-4" />
        <h1 className="text-2xl font-bold text-center text-text-main">Welcome Back</h1>
        <p className="text-sm text-gray-500 mt-2 text-center">Please enter your details to sign in.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded focus:border-primary outline-none" 
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 pr-10 rounded focus:border-primary outline-none" 
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
          className="w-full bg-primary text-white py-2.5 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400 mt-2"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account? <Link to="/auth/register" className="text-primary hover:underline font-medium">Register here</Link>
      </div>
      
      <div className="mt-3 text-center text-sm text-gray-600">
        Registered but not verified? <Link to="/auth/verify-email" state={{ email }} className="text-primary hover:underline font-medium">Verify Email</Link>
      </div>
    </div>
  );
};

export default LoginPage;
