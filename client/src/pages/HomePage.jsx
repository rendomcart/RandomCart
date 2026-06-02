import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as categoryApi from '../api/category.api';
import * as productApi from '../api/product.api';
import ProductCard from '../components/product/ProductCard';
import { Truck, ShieldCheck, RefreshCw, Clock, ArrowRight, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          categoryApi.getCategories(),
          productApi.getProducts({ limit: 8, sort: 'popular' })
        ]);

        if (catsRes.data.success) setCategories(catsRes.data.data);
        if (prodsRes.data.success) setFeaturedProducts(prodsRes.data.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      {/* Hero Banner */}
      <section 
        className="relative text-white py-28 px-4 text-center rounded-2xl mb-10 shadow-xl overflow-hidden"
        style={{
          backgroundImage: 'url(/hero-bg.png)',
          backgroundColor: '#2F3C7E', // Fallback
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-90 mix-blend-multiply"></div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-blue-200 font-bold tracking-widest uppercase mb-4 text-sm md:text-base border border-blue-300 px-4 py-1 rounded-full">New Season Arrival</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight drop-shadow-md">
            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Lifestyle</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-90 drop-shadow max-w-2xl font-light">
            Discover our curated collection of premium products. Unbeatable quality, exclusively handpicked just for you.
          </p>
          <div className="flex gap-4">
            <Link to="/products" className="bg-white text-primary px-8 py-3.5 rounded-lg font-bold shadow-lg hover:bg-gray-100 hover:-translate-y-1 transition-transform flex items-center gap-2">
              Start Shopping <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Trust Badges */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="bg-white p-6 rounded-2xl text-center flex flex-col items-center justify-center border shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Truck className="text-blue-600" size={28} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">Free Shipping</h3>
          <p className="text-xs text-gray-500">On every single order</p>
        </div>
        <div className="bg-white p-6 rounded-2xl text-center flex flex-col items-center justify-center border shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="text-green-600" size={28} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">Secure Payments</h3>
          <p className="text-xs text-gray-500">100% protected transactions</p>
        </div>
        <div className="bg-white p-6 rounded-2xl text-center flex flex-col items-center justify-center border shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="text-orange-600" size={28} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">Authentic Products</h3>
          <p className="text-xs text-gray-500">100% genuine guaranteed</p>
        </div>
        <div className="bg-white p-6 rounded-2xl text-center flex flex-col items-center justify-center border shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Clock className="text-purple-600" size={28} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">24/7 Support</h3>
          <p className="text-xs text-gray-500">Always here to help you</p>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-text-main">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map(cat => (
            <Link key={cat._id} to={`/products?category=${cat._id}`} className="block text-center group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200 group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                {cat.image?.url ? (
                  <img 
                    src={formatImgUrl(cat.image.url)} 
                    alt={cat.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>
              <h3 className="font-bold text-sm sm:text-base text-gray-800 group-hover:text-primary transition-colors">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="mb-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="mb-6 md:mb-0 max-w-lg relative z-10">
            <span className="bg-white text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">Exclusive Selection</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Premium Quality Guaranteed</h2>
            <p className="text-blue-100 text-lg">Explore our handpicked collection of top-rated products. Everything you need, crafted with care and delivered straight to your door.</p>
          </div>
          <Link to="/products" className="relative z-10 bg-white text-primary px-8 py-3.5 rounded-lg font-bold shadow-xl hover:bg-gray-50 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
            Shop Collection <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-text-main">Featured Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="mt-20 mb-8 bg-gray-50 rounded-2xl p-8 md:p-16 border border-gray-200 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
            <Mail className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-extrabold mb-4 text-text-main">Join Our Newsletter</h2>
          <p className="text-gray-500 mb-8 text-lg">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered straight to your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed successfully!'); }}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-grow px-4 py-3 rounded-full text-gray-900 border-none focus:ring-2 focus:ring-accent outline-none shadow-inner"
              required
            />
            <button 
              type="submit"
              className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
