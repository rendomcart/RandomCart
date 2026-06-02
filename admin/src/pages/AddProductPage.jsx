import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as productApi from '../api/product.api';
import * as categoryApi from '../api/category.api';
import * as uploadApi from '../api/upload.api';
import { toast } from 'react-hot-toast';

const AddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  
  const [variants, setVariants] = useState([{
    color: '', colorHex: '#000000', size: '', price: '', discountPrice: '', stock: '', sku: '', images: []
  }]);

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
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, {
      color: '', colorHex: '#000000', size: '', price: '', discountPrice: '', stock: '', sku: '', images: []
    }]);
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);
  };

  const handleVariantImageUpload = async (index, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadApi.uploadImage(formData);
      if (data.success) {
        const updatedVariants = [...variants];
        if (!updatedVariants[index].images) updatedVariants[index].images = [];
        updatedVariants[index].images.push({ url: data.data, public_id: 'local' });
        setVariants(updatedVariants);
      }
    } catch (error) {
      toast.error('Error uploading variant image');
      console.error(error);
    }
  };

  const handleRemoveVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setVariants(updatedVariants);
  };

  const calculateDiscount = (orig, sell) => {
    if (!orig || !sell) return 0;
    const diff = orig - sell;
    if (diff <= 0) return 0;
    return Math.round((diff / orig) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (variants.length === 0) {
      toast.error('At least one variant is required');
      return;
    }

    const combos = new Set();
    for (const v of variants) {
      const combo = `${v.color?.toLowerCase() || ''}-${v.size?.toLowerCase() || ''}`;
      if (combos.has(combo)) {
        toast.error('Duplicate Color and Size combinations are not allowed');
        return;
      }
      combos.add(combo);

      if (v.discountPrice && Number(v.discountPrice) > Number(v.price)) {
        toast.error('Selling price cannot exceed original price');
        return;
      }
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('tags', tags);
    
    formData.append('variants', JSON.stringify(variants));

    try {
      const { data } = await productApi.createProduct(formData);
      if (data.success) {
        toast.success('Product created successfully');
        navigate('/products');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error creating product');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Add Product</h1>
        <button onClick={() => navigate('/products')} className="text-primary hover:underline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm space-y-6">
        {/* Basic Info */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea required rows="4" value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded"></textarea>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full border p-2 rounded" />
          </div>
        </section>

        {/* Variants Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Variants</h2>
          {variants.map((variant, index) => (
              <div key={index} className="border p-4 rounded mb-4 bg-background relative shadow-sm">
                <button type="button" onClick={() => handleRemoveVariant(index)} className="absolute top-2 right-2 text-red-500 hover:underline text-xs">Remove</button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Color Name</label>
                    <input type="text" value={variant.color} onChange={e => handleVariantChange(index, 'color', e.target.value)} className="w-full border p-1 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color Hex</label>
                    <input type="color" value={variant.colorHex} onChange={e => handleVariantChange(index, 'colorHex', e.target.value)} className="w-full h-8 border p-0 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Size</label>
                    <input type="text" value={variant.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} className="w-full border p-1 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">SKU</label>
                    <input type="text" value={variant.sku} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="w-full border p-1 rounded text-sm" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Original Price (₹) *</label>
                    <input type="number" required value={variant.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} className="w-full border p-1 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Selling Price (₹)</label>
                    <input type="number" value={variant.discountPrice} onChange={e => handleVariantChange(index, 'discountPrice', e.target.value)} className="w-full border p-1 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Discount</label>
                    <div className="w-full border p-1 rounded bg-gray-50 text-green-600 font-bold text-sm text-center">
                      {calculateDiscount(variant.price, variant.discountPrice)}% OFF
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Stock *</label>
                    <input type="number" required value={variant.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="w-full border p-1 rounded text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Images (Max 5)</label>
                  <div className="flex flex-col space-y-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        handleVariantImageUpload(index, e.target.files[0]);
                        e.target.value = ''; // reset input
                      }} 
                      className="w-full border p-1 rounded text-sm" 
                      disabled={variant.images?.length >= 5}
                    />
                    {variant.images && variant.images.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {variant.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative w-16 h-16 border rounded bg-gray-50 overflow-hidden group">
                            <img src={img.url.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img.url}`} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveVariantImage(index, imgIdx)} 
                              className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddVariant} className="text-sm bg-secondary border border-primary text-primary px-3 py-1 rounded hover:bg-gray-50">
              + Add Variant
            </button>
          </section>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-accent text-white px-6 py-2 rounded shadow-sm hover:bg-opacity-90 font-medium">
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
