import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as productApi from '../api/product.api';
import * as categoryApi from '../api/category.api';
import ProductCard from '../components/product/ProductCard';

const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1, total: 0 });

  // State from URL
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryParam, searchParam, sortParam, pageParam]);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryApi.getCategories();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productApi.getProducts({
        category: categoryParam,
        search: searchParam,
        sort: sortParam,
        page: pageParam,
        limit: 12
      });
      if (data.success) {
        setProducts(data.data);
        setPagination({ totalPages: data.totalPages, currentPage: data.currentPage, total: data.total });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page to 1 when filters change
    if (key !== 'page') newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white p-4 rounded shadow-sm mb-4">
          <h3 className="font-bold mb-3 border-b pb-2">Categories</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <button 
                onClick={() => updateParams('category', '')}
                className={`w-full text-left ${!categoryParam ? 'text-accent font-medium' : 'text-gray-600 hover:text-text-main'}`}
              >
                All Categories
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat._id}>
                <button 
                  onClick={() => updateParams('category', cat._id)}
                  className={`w-full text-left ${categoryParam === cat._id ? 'text-accent font-medium' : 'text-gray-600 hover:text-text-main'}`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow">
        <div className="bg-white p-4 rounded shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">Showing {products.length} of {pagination.total} products</span>
          <div className="flex items-center gap-2 text-sm">
            <label className="font-medium text-gray-600">Sort By:</label>
            <select 
              value={sortParam} 
              onChange={(e) => updateParams('sort', e.target.value)}
              className="border p-1.5 rounded focus:outline-none focus:border-accent"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading products...</div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateParams('page', i + 1)}
                    className={`w-8 h-8 rounded flex items-center justify-center ${pagination.currentPage === i + 1 ? 'bg-primary text-white font-medium' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-12 text-center rounded shadow-sm text-gray-500">
            No products found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListingPage;
