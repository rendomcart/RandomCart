import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as adminApi from '../api/admin.api';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const { data } = await adminApi.getCustomerById(id);
        if (data.success) {
          setCustomer(data.data.customer);
          setOrders(data.data.orders);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, [id]);

  if (loading) return <div>Loading customer details...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Customer Details</h1>
        <Link to="/customers" className="text-primary hover:underline">← Back to Customers</Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded shadow-sm mb-6 flex items-start gap-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
          {customer.avatar?.url ? (
            <img src={formatImgUrl(customer.avatar.url)} alt={customer.name} className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center font-bold text-3xl text-gray-500">
              {customer.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1">{customer.name}</h2>
          <p className="text-gray-600 mb-1">{customer.email}</p>
          <p className="text-gray-600 mb-1">Phone: {customer.phone || 'N/A'}</p>
          <p className="text-sm text-gray-500 mt-2">Member since: {new Date(customer.createdAt).toLocaleDateString()}</p>
          <div className="mt-4 flex gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded font-bold">{orders.length} Orders</span>
            <span className={`text-xs px-3 py-1 rounded font-bold ${customer.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {customer.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded overflow-hidden">
        <h3 className="text-lg font-bold p-4 border-b">Order History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">View</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-t">
                <td className="p-4 font-mono text-xs">{order._id}</td>
                <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-medium">₹{order.totalPrice}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link to={`/orders/${order._id}`} className="text-accent hover:underline">View Order</Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No orders found for this customer.</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
