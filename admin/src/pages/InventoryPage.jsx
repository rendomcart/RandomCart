import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as productApi from '../api/product.api';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const InventoryPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      // The endpoint /api/products/inventory/low was implemented in Phase 2
      const { data } = await productApi.getLowStockProducts();
      if (data.success) {
        setLowStockItems(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading inventory alerts...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
          Inventory Alerts
          {lowStockItems.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              {lowStockItems.length} Low
            </span>
          )}
        </h1>
      </div>

      <div className="bg-white shadow-sm rounded overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-4">Product Name</th>
              <th className="p-4">Variant (Color / Size)</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                      {item.image && <img src={formatImgUrl(item.image)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <Link to={`/products/edit/${item.productId}`} className="font-medium hover:underline text-primary">
                      {item.name}
                    </Link>
                  </div>
                </td>
                <td className="p-4 text-gray-600">
                  {item.isVariant ? (
                    <span>
                      {item.color} {item.size && `/ ${item.size}`}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Base Product</span>
                  )}
                </td>
                <td className="p-4 font-bold text-red-500">{item.stock}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded font-bold ${item.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                    {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link to={`/products/edit/${item.productId}`} className="text-accent hover:underline">Restock</Link>
                </td>
              </tr>
            ))}
            {lowStockItems.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  <div className="text-green-500 text-4xl mb-2">✓</div>
                  <p>All products have sufficient stock levels.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
