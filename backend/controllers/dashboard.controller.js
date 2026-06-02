import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Revenue (Completed payments or COD Delivered)
    const completedOrders = await Order.find({
      $or: [
        { 'paymentInfo.status': 'Completed' },
        { paymentMethod: 'COD', orderStatus: 'Delivered' }
      ]
    });
    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    // 2. Total Orders
    const totalOrders = await Order.countDocuments();

    // 3. Total Users (Exclude Admins if preferred, here counting all standard users)
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Calculate last 7 days sales data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentCompletedOrders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
      $or: [
        { 'paymentInfo.status': 'Completed' },
        { paymentMethod: 'COD', orderStatus: 'Delivered' }
      ]
    });

    // Initialize array for last 7 days
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesData.push({
        name: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        dateString: d.toDateString(),
        revenue: 0,
        orders: 0
      });
    }

    // Populate revenue
    recentCompletedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      const dayData = salesData.find(d => d.dateString === orderDate);
      if (dayData) {
        dayData.revenue += order.totalPrice;
        dayData.orders += 1;
      }
    });

    // Clean up dateString before sending
    const formattedSalesData = salesData.map(({ dateString, ...rest }) => rest);

    // 4. Low Stock Products Count
    // Threshold is 5
    const threshold = 5;
    const lowStockProducts = await Product.find({
      isActive: true,
      $or: [
        { hasVariants: false, topLevelStock: { $lt: threshold } },
        { hasVariants: true, 'variants.stock': { $lt: threshold } }
      ]
    });

    // 5. Order Status Distribution for Pie Chart
    const allOrders = await Order.find({}, 'orderStatus');
    const statusCounts = {};
    allOrders.forEach(order => {
      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
    });
    const orderStatusData = Object.keys(statusCounts).map(key => ({
      name: key,
      value: statusCounts[key]
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalUsers,
        lowStockItems: lowStockProducts.length,
        salesData: formattedSalesData,
        orderStatusData,
      }
    });
  } catch (error) {
    next(error);
  }
};
