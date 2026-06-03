import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import * as productApi from '../api/product.api';
import * as categoryApi from '../api/category.api';
import * as uploadApi from '../api/upload.api';
import { toast } from 'react-hot-toast';
import { getHexColor } from '../utils/colorUtils';

const EditProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const [product, setProduct] = useState(location.state?.product || null);
  const [loadingProduct, setLoadingProduct] = useState(!location.state?.product);
  const [categories, setCategories] = useState([]);
  
  // Basic Info
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category?._id || product?.category || '');
  const [tags, setTags] = useState(product?.tags?.join(', ') || '');
  const [isActive, setIsActive] = useState(product?.isActive !== false);
  
  // Variant Toggle
  const [hasVariants, setHasVariants] = useState(true);

  // Simple Product State (when hasVariants is false)
  const [simpleVariant, setSimpleVariant] = useState({
    size: '', price: '', discountPrice: '', stock: '', sku: '', images: []
  });

  // UI Grouped Variants (when hasVariants is true)
  const [colorGroups, setColorGroups] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (!product) {
      fetchProductById();
    } else {
      hydrateVariants(product.variants);
    }
  }, []);

  const hydrateVariants = (flatVariants) => {
    if (!flatVariants || flatVariants.length === 0) {
      setHasVariants(false);
      setSimpleVariant({ size: '', price: '', discountPrice: '', stock: '', sku: '', images: [] });
      setColorGroups([{ colorName: '', colorHex: '#000000', images: [], sizes: [{ size: '', price: '', discountPrice: '', stock: '', sku: '' }] }]);
      return;
    }

    if (flatVariants.length === 1 && !flatVariants[0].color && !flatVariants[0].size) {
      setHasVariants(false);
      const v = flatVariants[0];
      setSimpleVariant({
        size: v.size || '',
        price: v.price !== undefined ? v.price : '',
        discountPrice: v.discountPrice !== undefined ? v.discountPrice : '',
        stock: v.stock !== undefined ? v.stock : '',
        sku: v.sku || '',
        images: [...(v.images || [])]
      });
      setColorGroups([{ colorName: '', colorHex: '#000000', images: [], sizes: [{ size: '', price: '', discountPrice: '', stock: '', sku: '' }] }]);
      return;
    }

    setHasVariants(true);
    const grouped = {};
    flatVariants.forEach(v => {
      const cName = v.color || '';
      if (!grouped[cName]) {
        grouped[cName] = {
          colorName: cName,
          colorHex: v.colorHex || '#000000',
          images: [...(v.images || [])],
          sizes: []
        };
      } else if (v.images && v.images.length > 0 && grouped[cName].images.length === 0) {
        grouped[cName].images = [...v.images];
      }
      
      grouped[cName].sizes.push({
        size: v.size || '',
        price: v.price !== undefined ? v.price : '',
        discountPrice: v.discountPrice !== undefined ? v.discountPrice : '',
        stock: v.stock !== undefined ? v.stock : '',
        sku: v.sku || ''
      });
    });
    
    setColorGroups(Object.values(grouped));
    setSimpleVariant({ size: '', price: '', discountPrice: '', stock: '', sku: '', images: [] });
  };

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

  const fetchProductById = async () => {
    try {
      const { data } = await productApi.getProductById(id);
      if (data.success) {
        const p = data.data;
        setProduct(p);
        setName(p.name || '');
        setDescription(p.description || '');
        setCategory(p.category?._id || p.category || '');
        setTags(p.tags?.join(', ') || '');
        setIsActive(p.isActive !== false);
        hydrateVariants(p.variants);
      }
    } catch (error) {
      toast.error("Product data missing or not found.");
      navigate('/products');
    } finally {
      setLoadingProduct(false);
    }
  };

  // --- Handlers for Simple Product ---
  const handleSimpleImageUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadApi.uploadImage(formData);
      if (data.success) {
        setSimpleVariant(prev => ({
          ...prev,
          images: [...prev.images, { url: data.data, public_id: 'local' }]
        }));
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error(error);
    }
  };

  const handleRemoveSimpleImage = (index) => {
    setSimpleVariant(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  // --- Handlers for Variants ---
  const handleAddColorGroup = () => {
    setColorGroups([...colorGroups, {
      colorName: '', colorHex: '#000000', images: [],
      sizes: [{ size: '', price: '', discountPrice: '', stock: '', sku: '' }]
    }]);
  };

  const handleRemoveColorGroup = (index) => {
    const updated = colorGroups.filter((_, i) => i !== index);
    setColorGroups(updated);
  };

  const handleColorNameChange = (index, value) => {
    const updated = [...colorGroups];
    updated[index].colorName = value;
    updated[index].colorHex = getHexColor(value);
    setColorGroups(updated);
  };

  const handleAddSize = (colorIndex) => {
    const updated = [...colorGroups];
    updated[colorIndex].sizes.push({ size: '', price: '', discountPrice: '', stock: '', sku: '' });
    setColorGroups(updated);
  };

  const handleRemoveSize = (colorIndex, sizeIndex) => {
    const updated = [...colorGroups];
    updated[colorIndex].sizes.splice(sizeIndex, 1);
    setColorGroups(updated);
  };

  const handleSizeChange = (colorIndex, sizeIndex, field, value) => {
    const updated = [...colorGroups];
    updated[colorIndex].sizes[sizeIndex][field] = value;
    setColorGroups(updated);
  };

  const handleColorImageUpload = async (colorIndex, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadApi.uploadImage(formData);
      if (data.success) {
        const updated = [...colorGroups];
        if (!updated[colorIndex].images) updated[colorIndex].images = [];
        updated[colorIndex].images.push({ url: data.data, public_id: 'local' });
        setColorGroups(updated);
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error(error);
    }
  };

  const handleRemoveColorImage = (colorIndex, imageIndex) => {
    const updated = [...colorGroups];
    updated[colorIndex].images.splice(imageIndex, 1);
    setColorGroups(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let flatVariants = [];

    if (!hasVariants) {
      if (simpleVariant.discountPrice && Number(simpleVariant.discountPrice) > Number(simpleVariant.price)) {
        toast.error('Selling price cannot exceed original price');
        return;
      }
      flatVariants = [{
        color: '',
        colorHex: '#000000',
        size: (simpleVariant.size || '').trim(),
        price: Number(simpleVariant.price),
        discountPrice: simpleVariant.discountPrice ? Number(simpleVariant.discountPrice) : undefined,
        stock: Number(simpleVariant.stock),
        sku: simpleVariant.sku,
        images: simpleVariant.images || []
      }];
    } else {
      if (colorGroups.length === 0) {
        toast.error('At least one Color Variant is required');
        return;
      }

      const combos = new Set();
      const colors = new Set();

      for (const group of colorGroups) {
        const lowerColor = (group.colorName || '').trim().toLowerCase();
        if (lowerColor && colors.has(lowerColor)) {
          toast.error(`Color names must be unique. Duplicate found: ${group.colorName}`);
          return;
        }
        if (lowerColor) colors.add(lowerColor);

        if (group.sizes.length === 0) {
          toast.error(`At least one size is required for color: ${group.colorName}`);
          return;
        }

        for (const sizeObj of group.sizes) {
          const sizeStr = (sizeObj.size || '').trim().toLowerCase();
          const combo = `${lowerColor}-${sizeStr}`;
          if (combos.has(combo)) {
            toast.error(`Duplicate size ${sizeObj.size || 'Default'} found in color ${group.colorName || 'Default'}`);
            return;
          }
          combos.add(combo);

          if (sizeObj.discountPrice && Number(sizeObj.discountPrice) > Number(sizeObj.price)) {
            toast.error(`Selling price cannot exceed original price for ${group.colorName} - ${sizeObj.size}`);
            return;
          }
          
          flatVariants.push({
            color: (group.colorName || '').trim(),
            colorHex: group.colorHex,
            images: group.images || [],
            size: (sizeObj.size || '').trim(),
            price: Number(sizeObj.price),
            discountPrice: sizeObj.discountPrice ? Number(sizeObj.discountPrice) : undefined,
            stock: Number(sizeObj.stock),
            sku: sizeObj.sku
          });
        }
      }
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('isActive', isActive);
    
    formData.append('variants', JSON.stringify(flatVariants));

    try {
      const { data } = await productApi.updateProduct(id, formData);
      if (data.success) {
        toast.success('Product updated successfully');
        navigate('/products');
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.errors?.[0] || error.response?.data?.message || 'Error updating product';
      toast.error(msg);
    }
  };

  if (loadingProduct) return <div className="p-8 text-center">Loading product...</div>;
  if (!product) return null;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Edit Product</h1>
        <button onClick={() => navigate('/products')} className="text-primary hover:underline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white p-6 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded bg-gray-50">
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
          <div className="mt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="form-checkbox" />
              <span className="text-sm font-medium">Active (Visible to customers)</span>
            </label>
          </div>

          <div className="mt-6 pt-4 border-t">
            <label className="flex items-center space-x-3 cursor-pointer bg-gray-50 p-3 rounded border w-fit">
              <input 
                type="checkbox" 
                checked={hasVariants} 
                onChange={e => setHasVariants(e.target.checked)} 
                className="form-checkbox h-5 w-5 text-primary" 
              />
              <span className="text-sm font-bold text-gray-800">This product has variants (like multiple colors or sizes)</span>
            </label>
          </div>
        </section>

        {!hasVariants && (
          <section className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Pricing & Inventory</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size (Optional)</label>
                <input type="text" placeholder="e.g. 500ml, One Size" value={simpleVariant.size} onChange={e => setSimpleVariant({...simpleVariant, size: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Original Price (₹) *</label>
                <input type="number" required min="0" value={simpleVariant.price} onChange={e => setSimpleVariant({...simpleVariant, price: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹)</label>
                <input type="number" min="0" value={simpleVariant.discountPrice} onChange={e => setSimpleVariant({...simpleVariant, discountPrice: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
                <input type="number" required min="0" value={simpleVariant.stock} onChange={e => setSimpleVariant({...simpleVariant, stock: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                <input type="text" value={simpleVariant.sku} onChange={e => setSimpleVariant({...simpleVariant, sku: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
            </div>

            <div className="border p-4 rounded bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold">Product Images (Max 5)</label>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  handleSimpleImageUpload(e.target.files[0]);
                  e.target.value = '';
                }} 
                className="w-full border p-2 rounded bg-white text-sm mb-3" 
                disabled={simpleVariant.images?.length >= 5}
              />
              
              {simpleVariant.images && simpleVariant.images.length > 0 && (
                <div className="flex gap-4 flex-wrap">
                  {simpleVariant.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative w-24 h-24 border rounded bg-white shadow-sm overflow-hidden group">
                      <img src={img.url.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img.url}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSimpleImage(imgIdx)} 
                        className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {hasVariants && (
          <section>
            {colorGroups.map((group, cIndex) => (
              <div key={cIndex} className="bg-white rounded shadow-sm mb-6 border border-gray-200 overflow-hidden">
                {/* Color Header */}
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Color Variant {cIndex + 1}</h3>
                  {colorGroups.length > 1 && (
                    <button type="button" onClick={() => handleRemoveColorGroup(cIndex)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      Remove Color
                    </button>
                  )}
                </div>
                
                <div className="p-6">
                  {/* Color Details */}
                  <div className="flex flex-col sm:flex-row gap-6 mb-8">
                    <div className="w-full sm:w-1/3">
                      <label className="block text-sm font-medium mb-1">Color Name (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Black, Navy Blue, or leave empty if no color"
                        value={group.colorName} 
                        onChange={e => handleColorNameChange(cIndex, e.target.value)} 
                        className="w-full border p-2 rounded" 
                      />
                    </div>
                    <div className="w-full sm:w-1/3 flex flex-col justify-end">
                      <label className="block text-sm font-medium mb-1 text-gray-500">Auto Color Preview</label>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: group.colorHex }}
                        />
                        <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {group.colorHex}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Color Images */}
                  <div className="mb-8 border p-4 rounded bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold">Color Images (Max 5)</label>
                      <span className="text-xs text-gray-500">These images apply to all sizes of this color</span>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        handleColorImageUpload(cIndex, e.target.files[0]);
                        e.target.value = '';
                      }} 
                      className="w-full border p-2 rounded bg-white text-sm mb-3" 
                      disabled={group.images?.length >= 5}
                    />
                    
                    {group.images && group.images.length > 0 && (
                      <div className="flex gap-4 flex-wrap">
                        {group.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative w-24 h-24 border rounded bg-white shadow-sm overflow-hidden group">
                            <img src={img.url.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img.url}`} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveColorImage(cIndex, imgIdx)} 
                              className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sizes under Color */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Sizes for {group.colorName || 'this color'}</h4>
                    
                    <div className="space-y-4">
                      {group.sizes.map((sizeObj, sIndex) => (
                        <div key={sIndex} className="relative border p-4 rounded shadow-sm bg-white hover:border-gray-300 transition-colors">
                          {group.sizes.length > 1 && (
                            <button type="button" onClick={() => handleRemoveSize(cIndex, sIndex)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 px-2">
                              ×
                            </button>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Size (Optional)</label>
                              <input type="text" placeholder="e.g. S, M, or leave empty if no size" value={sizeObj.size} onChange={e => handleSizeChange(cIndex, sIndex, 'size', e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Original Price *</label>
                              <input type="number" required min="0" value={sizeObj.price} onChange={e => handleSizeChange(cIndex, sIndex, 'price', e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price</label>
                              <input type="number" min="0" value={sizeObj.discountPrice} onChange={e => handleSizeChange(cIndex, sIndex, 'discountPrice', e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
                              <input type="number" required min="0" value={sizeObj.stock} onChange={e => handleSizeChange(cIndex, sIndex, 'stock', e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                              <input type="text" value={sizeObj.sku} onChange={e => handleSizeChange(cIndex, sIndex, 'sku', e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleAddSize(cIndex)} 
                      className="mt-4 text-sm bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 font-medium"
                    >
                      + Add Another Size
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={handleAddColorGroup} 
              className="w-full py-4 border-2 border-dashed border-primary text-primary font-bold rounded-lg hover:bg-primary hover:bg-opacity-5 transition-colors"
            >
              + Add Another Color
            </button>
          </section>
        )}

        <div className="pt-6 border-t flex justify-end">
          <button type="submit" className="bg-primary text-white px-8 py-3 rounded-lg shadow-md hover:bg-opacity-90 font-bold text-lg">
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;
