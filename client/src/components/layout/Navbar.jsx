import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { WishlistContext } from '../../context/WishlistContext';
import { NotificationContext } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import AuthModal from '../auth/AuthModal';
import NotificationDropdown from './NotificationDropdown';
import { ShoppingCart, Heart, User as UserIcon, Menu, X, Package, Search, Bell, Store, LogOut, LogIn } from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  const urlStr = typeof url === 'object' ? url.url : url;
  if (!urlStr) return '';
  if (typeof urlStr === 'string' && urlStr.startsWith('http')) return urlStr;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${urlStr}`;
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartItemsCount, loadCart } = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const { unreadCount, fetchNotifications } = useContext(NotificationContext);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleCartUpdated = () => {
      loadCart();
    };

    const handleReceiveNotification = (notification) => {
      fetchNotifications();
      toast(notification.title || 'New Notification', {
        icon: '🔔',
        style: {
          background: '#2F3C7E',
          color: '#fff',
        },
      });
    };

    socket.on('cart_updated', handleCartUpdated);
    socket.on('receive_notification', handleReceiveNotification);

    return () => {
      socket.off('cart_updated', handleCartUpdated);
      socket.off('receive_notification', handleReceiveNotification);
    };
  }, [socket, loadCart, fetchNotifications]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm(''); // optionally clear after search, or leave it
      setIsMenuOpen(false); // close mobile menu if open
    }
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center md:hidden">
              <button onClick={() => setIsMenuOpen(true)} className="text-gray-600 hover:text-primary focus:outline-none">
                <Menu size={24} />
              </button>
            </div>
            <Link to="/" className="flex items-center gap-2 group py-1">
              <img src="/logo.png" alt="RandomCart Logo" className="h-12 md:h-16 w-auto object-contain" />
            </Link>
          </div>
          
          <div className="hidden md:flex flex-1 items-center justify-center px-8">
            <form onSubmit={handleSearch} className="w-full max-w-lg relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-full py-1.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                <Search size={18} />
              </button>
            </form>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-gray-600 hover:text-primary font-medium">Shop</Link>
            
            <div className="flex items-center space-x-6 border-l pl-6">
              <div className="relative">
                <button 
                  onClick={() => {
                    if (user) {
                      setIsNotifOpen(!isNotifOpen);
                    } else {
                      setAuthModalView('login');
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="notification-btn text-gray-600 hover:text-primary relative flex items-center justify-center focus:outline-none"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                  )}
                </button>
                <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
              </div>
              
              {user && (
                <>
                  <Link to="/wishlist" className="text-gray-600 hover:text-red-500 relative flex items-center justify-center">
                    <Heart size={20} />
                    {wishlist?.products?.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {wishlist.products.length}
                      </span>
                    )}
                  </Link>
                  
                  <Link to="/cart" className="text-gray-600 hover:text-primary relative flex items-center justify-center">
                    <ShoppingCart size={20} />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 bg-gray-200 flex-shrink-0">
                      {user.avatar?.url ? (
                        <img src={formatImgUrl(user.avatar.url)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md py-1 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</Link>
                      <Link to="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Orders</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setAuthModalView('login'); setIsAuthModalOpen(true); }}
                    className="text-primary hover:text-primary-dark px-4 py-2 font-medium transition-all"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => { setAuthModalView('register'); setIsAuthModalOpen(true); }}
                    className="bg-primary text-white px-5 py-2 rounded font-medium hover:bg-opacity-90 shadow-sm transition-all"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center md:hidden">
            <div className="relative">
              <button 
                onClick={() => user ? setIsNotifOpen(!isNotifOpen) : setIsAuthModalOpen(true)}
                className="notification-btn text-gray-600 hover:text-primary relative flex items-center justify-center focus:outline-none p-1"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 group">
            <img src="/logo.png" alt="RandomCart Logo" className="h-12 w-auto object-contain" />
          </Link>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded focus:outline-none bg-gray-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded py-2 pl-3 pr-10 outline-none focus:border-primary text-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
              <Search size={18} />
            </button>
          </form>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-6 space-y-2">
          <Link to="/products" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors">
            <Store size={20} />
            Shop
          </Link>
          


          {user ? (
            <>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Heart size={20} />
                Wishlist ({wishlist?.products?.length || 0})
              </Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors">
                <ShoppingCart size={20} />
                Cart ({cartItemsCount})
              </Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors">
                <UserIcon size={20} />
                My Profile
              </Link>
              <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors">
                <Package size={20} />
                My Orders
              </Link>
            </>
          ) : (
            <div className="pt-4 mt-2 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => { setAuthModalView('login'); setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-bold text-primary bg-primary bg-opacity-10 hover:bg-opacity-20 transition-all"
              >
                <LogIn size={20} />
                Login
              </button>
              <button 
                onClick={() => { setAuthModalView('register'); setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-bold text-white bg-primary hover:bg-opacity-90 shadow-sm transition-all"
              >
                <UserIcon size={20} />
                Register
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="p-4 border-t mt-auto">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authModalView} />
    </>
  );
};

export default Navbar;
