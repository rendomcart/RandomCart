import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as productApi from '../api/product.api';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import ConfirmModal from '../components/ConfirmModal';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchProducts();

    if (!socket) return;

    const handleProductChange = () => fetchProducts();

    socket.on('product_created', handleProductChange);
    socket.on('product_updated', handleProductChange);
    socket.on('product_deleted', handleProductChange);
    socket.on('stock_updated', handleProductChange);

    return () => {
      socket.off('product_created', handleProductChange);
      socket.off('product_updated', handleProductChange);
      socket.off('product_deleted', handleProductChange);
      socket.off('stock_updated', handleProductChange);
    };
  }, [socket]);

  const fetchProducts = async () => {
    try {
      const { data } = await productApi.getProducts();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      const { data } = await productApi.deleteProduct(id);
      if (data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting product');
      console.error(error);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Products</h1>
        <button onClick={() => navigate('/products/add')} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-opacity-90">
          Add Product
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Starting Price</th>
              <th className="p-4">Variants</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod._id} className="border-t">
                <td className="p-4 font-medium">{prod.name}</td>
                <td className="p-4">{prod.category?.name || '-'}</td>
                <td className="p-4">₹{prod.displayPrice || prod.variants?.[0]?.price || 0}</td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {prod.variants?.length || 0} Variants
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded ${prod.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {prod.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => navigate('/products/edit/' + prod._id, { state: { product: prod } })} className="text-accent hover:underline mr-4">Edit</button>
                  <button onClick={() => handleDelete(prod._id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        message="Are you sure you want to PERMANENTLY delete this product and all its images? This cannot be undone." 
        onConfirm={() => executeDelete(confirmModal.id)} 
        onCancel={() => setConfirmModal({ isOpen: false, id: null })} 
      />
    </div>
  );
};

export default ProductsPage;
