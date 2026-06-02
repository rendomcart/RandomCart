import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../api/admin.api';
import { useSocket } from '../context/SocketContext';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchCustomers();

    if (!socket) return;

    const handleCustomerChange = () => fetchCustomers();

    socket.on('user_registered', handleCustomerChange);
    socket.on('profile_updated', handleCustomerChange);

    return () => {
      socket.off('user_registered', handleCustomerChange);
      socket.off('profile_updated', handleCustomerChange);
    };
  }, [socket]);

  const fetchCustomers = async () => {
    try {
      const { data } = await adminApi.getCustomers();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading customers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-main mb-6">Customers Management</h1>
      
      <div className="bg-white shadow-sm rounded overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-center">Orders</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id} className="border-t">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        {customer.avatar?.url ? (
                          <img src={formatImgUrl(customer.avatar.url)} alt={customer.name} className="w-full h-full object-cover" />
                        ) : (
                        <span className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                          {customer.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">{customer.email}</td>
                <td className="p-4">{customer.phone || 'N/A'}</td>
                <td className="p-4">{new Date(customer.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                    {customer.orderCount || 0}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link to={`/customers/${customer._id}`} className="text-accent hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;
