import FAQ from '../models/FAQ.model.js';

// Seed Database Function (Internal Helper)
const seedFAQs = async () => {
  const existingCount = await FAQ.countDocuments();
  if (existingCount > 0) return;

  const initialFAQs = [
    { question: 'Where is my order?', answer: 'You can track your order from the My Orders page.', category: 'Orders' },
    { question: 'How can I cancel my order?', answer: 'Go to My Orders and click Cancel Order if the order has not been shipped.', category: 'Orders' },
    { question: 'When will my order be delivered?', answer: 'Standard delivery takes up to 7 days. Express delivery takes 2–3 days.', category: 'Delivery' },
    { question: 'How do I download my invoice?', answer: 'After an order is delivered, open My Orders and click Download Invoice.', category: 'Orders' },
    { question: 'What payment methods are available?', answer: 'We support Razorpay, UPI, Credit Cards, Debit Cards, Net Banking, and Cash on Delivery (if enabled).', category: 'Payments' },
    { question: 'How can I return a product?', answer: 'Open My Orders, select the delivered order, and choose Return Product if the return window is available.', category: 'Returns' },
    { question: 'How do I update my address?', answer: 'Go to Profile → Address Management and update your saved addresses.', category: 'Account' },
    { question: 'How can I contact support?', answer: 'Use the Contact Us page or email support.', category: 'Support' },
    { question: 'How do product reviews work?', answer: 'You can review a product only after the order has been delivered.', category: 'Products' },
    { question: 'How do I change my profile picture?', answer: 'Go to Profile Settings and upload a new profile image.', category: 'Account' },
    { question: 'How do notifications work?', answer: 'Click the notification bell icon to view all notifications and mark them as read.', category: 'Account' },
    { question: 'What is Express Delivery?', answer: 'Express Delivery costs ₹20 extra and delivers within 2–3 days.', category: 'Delivery' }
  ];

  await FAQ.insertMany(initialFAQs);
};

// @desc    Get all FAQs (Client & Admin)
// @route   GET /api/faqs
// @access  Public
export const getFAQs = async (req, res, next) => {
  try {
    // Attempt to seed if empty
    await seedFAQs();

    const { search, all } = req.query;
    let query = {};
    
    // For clients, only return active FAQs unless 'all' is passed (for admin panel)
    if (all !== 'true') {
      query.isActive = true;
    }

    if (search) {
      // Use regex for partial matching on questions or answers
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { question: searchRegex },
        { answer: searchRegex }
      ];
    }

    const faqs = await FAQ.find(query).sort({ category: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new FAQ
// @route   POST /api/faqs
// @access  Private/Admin
export const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category, isActive } = req.body;

    const faq = await FAQ.create({
      question,
      answer,
      category,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    next(error);
  }
};

// @desc    Update FAQ
// @route   PUT /api/faqs/:id
// @access  Private/Admin
export const updateFAQ = async (req, res, next) => {
  try {
    let faq = await FAQ.findById(req.params.id);

    if (!faq) {
      res.status(404);
      throw new Error('FAQ not found');
    }

    faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete FAQ
// @route   DELETE /api/faqs/:id
// @access  Private/Admin
export const deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      res.status(404);
      throw new Error('FAQ not found');
    }

    await faq.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
