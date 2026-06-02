import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import * as dashboardApi from '../api/dashboard.api';
import * as orderApi from '../api/order.api';
import { Link } from 'react-router-dom';
import * as notificationApi from '../api/notification.api';
import { ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    lowStockItems: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchDashboardData();
    
    if (!socket) return;

    const handleNewOrder = (data) => {
      const notif = {
        id: Date.now(),
        message: `New Order! ${data.customer} placed an order for ₹${data.total}`,
        time: new Date()
      };
      setLiveNotifications(prev => [notif, ...prev].slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalOrders: prev.totalOrders + 1,
        totalRevenue: prev.totalRevenue + data.total,
      }));
      fetchDashboardData(); 
    };

    const handleUserRegistered = (data) => {
      const notif = {
        id: Date.now(),
        message: `New User! ${data.name} just registered.`,
        time: new Date()
      };
      setLiveNotifications(prev => [notif, ...prev].slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
      }));
    };

    const handleProductCreated = (data) => {
      const notif = {
        id: Date.now(),
        message: `New Product added: ${data.productName}`,
        time: new Date()
      };
      setLiveNotifications(prev => [notif, ...prev].slice(0, 5));
    };

    const handleReviewReceived = (data) => {
      const notif = {
        id: Date.now(),
        message: `New Review for product ID: ${data.productId}`,
        time: new Date()
      };
      setLiveNotifications(prev => [notif, ...prev].slice(0, 5));
    };

    socket.on('new_order', handleNewOrder);
    socket.on('user_registered', handleUserRegistered);
    socket.on('product_created', handleProductCreated);
    socket.on('review_received', handleReviewReceived);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('user_registered', handleUserRegistered);
      socket.off('product_created', handleProductCreated);
      socket.off('review_received', handleReviewReceived);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, notifsRes] = await Promise.all([
        dashboardApi.getDashboardStats(),
        orderApi.getOrders(),
        notificationApi.getNotifications()
      ]);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
      if (ordersRes.data.success) {
        // Just take the top 5 for dashboard
        setRecentOrders(ordersRes.data.data.slice(0, 5));
      }

      if (notifsRes.data.success) {
        const mappedNotifs = notifsRes.data.data.map(n => ({
          id: n._id,
          message: n.message,
          time: new Date(n.createdAt)
        }));
        setLiveNotifications(mappedNotifs.slice(0, 5));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-main mb-6 flex items-center">
        Dashboard
        <span className="ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </span>
      </h1>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
          </div>
        
        <div className="bg-white p-6 rounded shadow-sm border-l-4 border-primary">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-text-main">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
          <p className="text-2xl font-bold text-text-main">{stats.totalUsers}</p>
        </div>
        
        <div className={`bg-white p-6 rounded shadow-sm border-l-4 ${stats.lowStockItems > 0 ? 'border-red-500' : 'border-green-500'}`}>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Low Stock Alerts</h3>
          <p className={`text-2xl font-bold ${stats.lowStockItems > 0 ? 'text-red-500' : 'text-text-main'}`}>
            {stats.lowStockItems} Items
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex flex-col xl:flex-row gap-6 mb-8">
          <div className="w-full xl:w-2/3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6">Revenue Overview (Last 7 Days)</h2>
          <div className="h-[300px]">
            {stats.salesData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} dx={-10} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">Loading chart data...</div>
            )}
          </div>
        </div>

        <div className="w-full xl:w-1/3 bg-white p-6 rounded shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6">Orders by Status</h2>
          <div className="h-[300px] w-full">
            {stats.orderStatusData && stats.orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {stats.orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Orders']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">No data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-800 mb-4 p-6 pb-0">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium rounded-tl-lg">Order ID</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">#{order._id.substring(0, 8)}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-bold text-gray-800">₹{order.totalPrice}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                        ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                        ${order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.orderStatus === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.orderStatus === 'Shipped' ? 'bg-purple-100 text-purple-800' : ''}
                        ${order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                        ${order.orderStatus === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/orders/${order._id}`} className="text-primary hover:text-accent font-medium text-sm">View</Link>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Notifications Feed */}
        <div className="bg-white rounded shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Live Activity Feed</h2>
          {liveNotifications.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity. Waiting for new orders...</p>
          ) : (
            <div className="space-y-4">
              {liveNotifications.map(notif => (
                <div key={notif.id} className="border-l-2 border-primary pl-3">
                  <p className="text-sm text-text-main font-medium">{notif.message}</p>
                  <span className="text-xs text-gray-500">{notif.time.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
