import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { LayoutDashboard, Tags, Package, ShoppingBag, Users, AlertTriangle, LogOut, UserCircle, Star, X, MessageCircle } from 'lucide-react';
import { AdminAuthContext } from '../../context/AdminAuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AdminAuthContext);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reviews', path: '/reviews', icon: Star },
    { name: 'FAQs', path: '/faqs', icon: MessageCircle },
    { name: 'Inventory Alerts', path: '/inventory', icon: AlertTriangle },
    { name: 'My Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white text-gray-800 flex flex-col h-screen transform transition-transform duration-300 ease-in-out border-r border-gray-200 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-[72px] min-h-[72px] max-h-[72px] box-border border-b border-gray-200 flex items-center justify-center shrink-0 relative">
          <img src="/logo.png" alt="RandomCart Logo" className="h-14 w-auto object-contain" />
          <button onClick={onClose} className="md:hidden absolute right-4 text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
      
      <nav className="flex-grow px-4 pt-6">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    location.pathname === item.path 
                    ? 'bg-accent text-white font-medium shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
