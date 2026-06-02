import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as orderApi from '../api/order.api';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { useSocket } from '../context/SocketContext';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const { socket } = useSocket();

  useEffect(() => {
    fetchOrders();

    if (!socket) return;

    const handleNewOrder = () => fetchOrders();
    const handleOrderUpdate = () => fetchOrders();

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleOrderUpdate);
    socket.on('order_approved', handleOrderUpdate);
    socket.on('order_rejected', handleOrderUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleOrderUpdate);
      socket.off('order_approved', handleOrderUpdate);
      socket.off('order_rejected', handleOrderUpdate);
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const { data } = await orderApi.getOrders();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await orderApi.updateOrderStatus(orderId, { status: newStatus });
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (error) {
      console.error(error);
      toast.error('Error updating order status');
    }
  };

  // 24-hour countdown calculator
  const getRemainingTime = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const deadline = createdTime + 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (now >= deadline) return 'Overdue';
    
    const remainingHours = Math.floor((deadline - now) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor(((deadline - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${remainingHours}h ${remainingMinutes}m left`;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Pending') return order.orderStatus === 'Pending Approval';
    if (activeTab === 'Overdue') return order.orderStatus === 'Overdue Review';
    if (activeTab === 'Rejected') return order.orderStatus === 'Rejected';
    return true; // 'All'
  });

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-main mb-6">Orders Management</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto whitespace-nowrap">
        {['All', 'Pending', 'Overdue', 'Rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab} Orders
          </button>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Time Remaining</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const isOverdue = order.orderStatus === 'Overdue Review' || 
                (order.orderStatus === 'Pending Approval' && getRemainingTime(order.createdAt) === 'Overdue');
              const isPending = order.orderStatus === 'Pending Approval';
              
              return (
                <tr key={order._id} className={`border-t ${isOverdue ? 'bg-red-50' : ''}`}>
                  <td className="p-4 font-mono text-xs">{order._id.slice(-6).toUpperCase()}</td>
                  <td className="p-4">
                    <span className="block font-medium text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="p-4">
                    <span className="block font-medium">{order.user?.name || order.shippingAddress.fullName}</span>
                    <span className="text-xs text-gray-500">{order.user?.email}</span>
                  </td>
                  <td className="p-4 font-medium">₹{order.totalPrice}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded font-bold ${
                      order.orderStatus === 'Pending Approval' ? 'bg-orange-100 text-orange-800' :
                      order.orderStatus === 'Overdue Review' ? 'bg-red-100 text-red-800' :
                      order.orderStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                      order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium">
                    {isPending ? (
                      <span className={getRemainingTime(order.createdAt) === 'Overdue' ? 'text-red-600' : 'text-orange-600'}>
                        {getRemainingTime(order.createdAt)}
                      </span>
                    ) : isOverdue ? (
                      <span className="text-red-600 font-bold">Overdue</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/orders/${order._id}`} className="text-accent hover:underline font-bold">Review</Link>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No {activeTab.toLowerCase()} orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;
