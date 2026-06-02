import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import CategoriesPage from './pages/CategoriesPage';
import AddCategoryPage from './pages/AddCategoryPage';
import ProductsPage from './pages/ProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import ReviewsPage from './pages/ReviewsPage';
import FaqsPage from './pages/FaqsPage';
import Sidebar from './components/layout/Sidebar';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminProfilePage from './pages/AdminProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import Chatbot from './components/chatbot/Chatbot';
import { useSocket } from './context/SocketContext';
import { useState, useEffect, useContext } from 'react';
import { Bell } from 'lucide-react';
import { NotificationContext } from './context/NotificationContext';
import NotificationDropdown from './components/layout/NotificationDropdown';
import { AdminAuthContext } from './context/AdminAuthContext';
import { Menu } from 'lucide-react';

const AppLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount } = useContext(NotificationContext);
  const { isAdminAuthenticated, loading } = useContext(AdminAuthContext);

  const { socket } = useSocket();

  useEffect(() => {
    if (!isLoginPage && socket) {
      const handleNewOrder = (data) => {
        toast.success(`New order received! ID: ${data.orderId} - ₹${data.total}`, {
          duration: 5000,
          icon: '🔔',
          style: {
            background: '#2F3C7E',
            color: '#fff',
          },
        });
      };

      socket.on('new_order', handleNewOrder);

      return () => {
        socket.off('new_order', handleNewOrder);
      };
    }
  }, [isLoginPage, socket]);

  if (isLoginPage) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdminAuthenticated && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-text-main flex">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-grow flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* Admin Header */}
        <header className="h-[72px] min-h-[72px] max-h-[72px] box-border bg-white border-b px-4 md:px-8 flex justify-between items-center shadow-sm shrink-0 z-10 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-500 hover:text-primary focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="notification-btn text-gray-500 hover:text-primary relative flex items-center justify-center p-2 focus:outline-none"
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-grow p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/add" element={<AddCategoryPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/add" element={<AddProductPage />} />
            <Route path="/products/edit/:id" element={<EditProductPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/faqs" element={<FaqsPage />} />
            <Route path="/profile" element={<AdminProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Chatbot />
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
