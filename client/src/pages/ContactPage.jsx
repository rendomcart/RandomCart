import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../api/axios';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await axios.post('/contact', formData);
      if (data.success) {
        toast.success('Your message has been sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">Contact Us</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Have a question about a product, your order, or anything else? We're here to help. Reach out to us using the form below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded shadow-sm border h-fit">
          <h2 className="text-xl font-bold text-text-main mb-6">Get in Touch</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
              <p className="text-gray-600 text-sm">rendomcart@gmail.com</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
              <p className="text-gray-600 text-sm">+91 (800) 123-4567</p>
              <p className="text-gray-400 text-xs mt-1">Mon-Fri from 9am to 6pm IST</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Office</h3>
              <p className="text-gray-600 text-sm">123 Commerce Avenue</p>
              <p className="text-gray-600 text-sm">Tech Park, Bangalore</p>
              <p className="text-gray-600 text-sm">Karnataka 560001, India</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required 
                  className="w-full border p-2.5 rounded focus:border-primary outline-none" 
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  className="w-full border p-2.5 rounded focus:border-primary outline-none" 
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <input 
                type="text" 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required 
                className="w-full border p-2.5 rounded focus:border-primary outline-none" 
                placeholder="How can we help?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required 
                rows="5"
                className="w-full border p-2.5 rounded focus:border-primary outline-none" 
                placeholder="Write your message here..."
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-opacity-50 transition-colors"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
