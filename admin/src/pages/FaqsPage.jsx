import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Search, CheckCircle, XCircle } from 'lucide-react';

const FaqsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    isActive: true
  });

  const categories = ['General', 'Products', 'Orders', 'Delivery', 'Payments', 'Returns', 'Account', 'Support'];

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data } = await axios.get('/faqs?all=true');
      if (data.success) {
        setFaqs(data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        isActive: faq.isActive
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        category: 'General',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        const { data } = await axios.put(`/faqs/${editingFaq._id}`, formData);
        if (data.success) {
          toast.success('FAQ updated successfully');
          setFaqs(faqs.map(f => f._id === editingFaq._id ? data.data : f));
        }
      } else {
        const { data } = await axios.post('/faqs', formData);
        if (data.success) {
          toast.success('FAQ created successfully');
          setFaqs([data.data, ...faqs]);
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      const { data } = await axios.delete(`/faqs/${id}`);
      if (data.success) {
        toast.success('FAQ deleted successfully');
        setFaqs(faqs.filter(f => f._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete FAQ');
    }
  };

  const toggleStatus = async (faq) => {
    try {
      const { data } = await axios.put(`/faqs/${faq._id}`, { isActive: !faq.isActive });
      if (data.success) {
        setFaqs(faqs.map(f => f._id === faq._id ? data.data : f));
        toast.success(`FAQ ${!faq.isActive ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) || 
    faq.answer.toLowerCase().includes(search.toLowerCase()) ||
    faq.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading FAQs...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Manage FAQs</h1>
          <p className="text-sm text-gray-500">Create and update chatbot knowledge base</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-opacity-90 flex items-center gap-2"
        >
          <Plus size={18} /> Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search FAQs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border p-2 pl-10 rounded outline-none focus:border-primary text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-4 font-semibold">Question</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No FAQs found.</td>
                </tr>
              ) : (
                filteredFaqs.map((faq) => (
                  <tr key={faq._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-800 mb-1">{faq.question}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{faq.answer}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border">
                        {faq.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(faq)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                          faq.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {faq.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {faq.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(faq)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(faq._id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border p-2 rounded outline-none focus:border-primary text-sm bg-gray-50"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    className="w-full border p-2 rounded outline-none focus:border-primary text-sm"
                    placeholder="e.g. How to track my order?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                  <textarea 
                    required 
                    rows="4"
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    className="w-full border p-2 rounded outline-none focus:border-primary text-sm resize-none"
                    placeholder="Clear and concise answer..."
                  ></textarea>
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Active (Visible to users)
                  </label>
                </div>

                <div className="pt-2 flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 text-sm font-medium transition-colors shadow-sm"
                  >
                    {editingFaq ? 'Save Changes' : 'Create FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqsPage;
