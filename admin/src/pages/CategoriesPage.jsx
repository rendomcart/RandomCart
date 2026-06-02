import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as categoryApi from '../api/category.api';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryApi.getCategories();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Categories</h1>
        <button onClick={() => navigate('/categories/add')} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-opacity-90">
          Add Category
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} className="border-t">
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4">{cat.slug}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-accent hover:underline mr-4">Edit</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesPage;
