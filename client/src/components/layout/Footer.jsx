import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.png" alt="RandomCart Logo" className="h-14 w-auto object-contain" />
            </Link>
            <p className="text-sm text-gray-500">
              Your one-stop destination for premium products across multiple categories. Fast, secure, and reliable.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/products" className="hover:text-primary">Shop All</Link></li>
              <li><Link to="/cart" className="hover:text-primary">Your Cart</Link></li>
              <li><Link to="/profile" className="hover:text-primary">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link to="/shipping" className="hover:text-primary">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Returns & Exchanges</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4">Newsletter</h4>
            <p className="text-sm text-gray-500 mb-2">Subscribe for updates and deals.</p>
            <div className="flex">
              <input type="email" placeholder="Email address" className="w-full border rounded-l px-3 py-2 text-sm outline-none focus:border-primary" />
              <button className="bg-primary text-white px-4 rounded-r text-sm font-medium">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} RendomCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
