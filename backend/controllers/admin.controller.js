import User from '../models/User.model.js';
import Order from '../models/Order.model.js';

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
    
    // Attach order count to each customer (for a real app, aggregation is better)
    const customerData = await Promise.all(customers.map(async (customer) => {
      const orderCount = await Order.countDocuments({ user: customer._id });
      return {
        ...customer.toObject(),
        orderCount
      };
    }));

    res.status(200).json({ success: true, data: customerData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID with orders
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }

    const orders = await Order.find({ user: customer._id }).sort('-createdAt');

    res.status(200).json({ 
      success: true, 
      data: {
        customer,
        orders
      } 
    });
  } catch (error) {
    next(error);
  }
};
