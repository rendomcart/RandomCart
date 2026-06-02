import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as categoryApi from '../api/category.api';
import { toast } from 'react-hot-toast';

const AddCategoryPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('isActive', isActive);
    
    if (image) {
      formData.append('image', image);
    }

    try {
      const { data } = await categoryApi.createCategory(formData);
      if (data.success) {
        toast.success('Category created successfully');
        navigate('/categories');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error creating category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Add Category</h1>
        <button onClick={() => navigate('/categories')} className="text-primary hover:underline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Category Name *</label>
          <input 
            type="text" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full border p-2 rounded focus:outline-none focus:border-primary" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            rows="4" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full border p-2 rounded focus:outline-none focus:border-primary"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="w-full border p-2 rounded focus:outline-none focus:border-primary" 
          />
        </div>

        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={e => setIsActive(e.target.checked)} 
              className="form-checkbox" 
            />
            <span className="text-sm font-medium">Active (Visible to customers)</span>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-accent text-white px-6 py-2 rounded shadow-sm hover:bg-opacity-90 font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategoryPage;
