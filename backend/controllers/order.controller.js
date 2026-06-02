import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import Cart from '../models/Cart.model.js';
import User from '../models/User.model.js';
import { getIO } from '../config/socket.js';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sendNotification } from '../services/notification.service.js';
import sendEmail from '../utils/sendEmail.js';
import { 
  orderPlacedTemplate, 
  adminNewOrderTemplate, 
  orderShippedTemplate, 
  orderDeliveredTemplate, 
  orderCancelledTemplate,
  orderRejectedTemplate
} from '../utils/emailTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      deliveryType,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    // Calculate Delivery Metrics
    const isExpress = deliveryType === 'Express';
    const deliveryCharge = isExpress ? 20 : 0;
    
    // Frontend already passes the calculated shippingPrice and totalPrice
    // We just use them directly to prevent doubling the charge.
    const finalShippingPrice = Number(shippingPrice);
    const finalTotalPrice = Number(totalPrice);
    
    const now = new Date();
    const estimatedShipDate = new Date(now);
    estimatedShipDate.setDate(now.getDate() + (isExpress ? 1 : 2));
    
    const estimatedDeliveryDate = new Date(now);
    estimatedDeliveryDate.setDate(now.getDate() + (isExpress ? 3 : 7));

    // 1. Create the order (Pending Payment)
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice: finalShippingPrice,
      totalPrice: finalTotalPrice,
      deliveryType: isExpress ? 'Express' : 'Standard',
      deliveryCharge,
      estimatedShipDate,
      estimatedDeliveryDate,
      timeline: [{ status: 'Pending Approval' }],
      paymentInfo: {
        status: paymentMethod === 'COD' ? 'Pending' : 'Pending'
      }
    });

    const createdOrder = await order.save();

    // 2. Reduce stock for each item
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock -= item.quantity;
          if (variant.stock < 0) variant.stock = 0;
        }
        await product.save();
      }
    }

    // 3. Clear user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    // 4. Emit real-time event to admin
    try {
      const io = getIO();
      if (io) {
        io.to('admin-room').emit('new_order', {
          orderId: createdOrder._id,
          total: createdOrder.totalPrice,
          customer: req.user.name || 'Customer'
        });
        io.to('admin-room').emit('order_received', createdOrder);
        io.to(`user-${req.user._id}`).emit('order_created', createdOrder);
      }
    } catch (err) {
      console.error('Socket not initialized:', err);
    }

    // 5. Save Notifications for Admin and User
    await sendNotification({
      role: 'admin',
      title: 'New Order Received',
      message: `Order #${createdOrder._id.toString().slice(-6).toUpperCase()} placed for ₹${createdOrder.totalPrice}.`,
      type: 'ORDER_PLACED',
      relatedEntityId: createdOrder._id
    });

    await sendNotification({
      role: 'user',
      user: req.user._id,
      title: 'Order Placed Successfully',
      message: `Your order #${createdOrder._id.toString().slice(-6).toUpperCase()} has been placed. Estimated Delivery: ${estimatedDeliveryDate.toLocaleDateString()}`,
      type: 'ORDER_PLACED',
      relatedEntityId: createdOrder._id
    });

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Order Confirmation #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
        html: orderPlacedTemplate(createdOrder, req.user.name),
      });

      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `New Order Received - #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
            html: adminNewOrderTemplate(createdOrder, req.user.name),
          });
        }
      }
    } catch (emailErr) {
      console.error('Order creation emails failed:', emailErr);
    }

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Check if the user is admin or the order belongs to the user
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort('-createdAt');
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const newStatus = req.body.status || order.orderStatus;
    
    // Strict Progression Rule
    const flowStatuses = ['Pending Approval', 'Overdue Review', 'Approved', 'Processing', 'Shipped', 'Delivered'];
    if (flowStatuses.includes(newStatus) && flowStatuses.includes(order.orderStatus)) {
      const currentIdx = flowStatuses.indexOf(order.orderStatus);
      const newIdx = flowStatuses.indexOf(newStatus);
      
      // Allow moving from Overdue Review back to Approved
      if (newIdx < currentIdx && !(order.orderStatus === 'Overdue Review' && newStatus === 'Approved')) {
        res.status(400);
        throw new Error(`Cannot revert order status from ${order.orderStatus} back to ${newStatus}`);
      }
    }

    order.orderStatus = newStatus;
    
    // Initialize timeline if it doesn't exist (for old orders)
    if (!order.timeline) {
      order.timeline = [];
    }
    
    // Add to timeline
    order.timeline.push({ 
      status: newStatus, 
      comment: req.body.comment || `Order marked as ${newStatus}` 
    });
    
    if (req.body.status === 'Shipped') {
      if (!order.actualShipDate) order.actualShipDate = Date.now();
    }

    if (req.body.status === 'Delivered') {
      order.deliveredAt = Date.now();
      if (!order.actualDeliveryDate) order.actualDeliveryDate = Date.now();
      // If COD and delivered, mark payment as completed
      if (order.paymentMethod === 'COD' && order.paymentInfo.status !== 'Completed') {
        order.paymentInfo.status = 'Completed';
      }
      // Generate Invoice Number if it doesn't exist
      if (!order.invoiceNumber) {
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        order.invoiceNumber = `INV-${order._id.toString().slice(-6).toUpperCase()}-${randomStr}`;
      }
    }

    const updatedOrder = await order.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${order.user._id}`).emit('order_status_updated', updatedOrder);
        io.to('admin-room').emit('order_status_updated', updatedOrder);
        
        if (newStatus === 'Delivered') {
          io.to(`user-${order.user._id}`).emit('order_delivered', updatedOrder);
        }
        if (newStatus === 'Approved') {
          io.to('admin-room').emit('order_approved', updatedOrder);
        }
      }
    } catch (err) {
      console.error('Socket error in updateOrderStatus:', err.message);
    }

    // Notify User of Status Change
    let notifMsg = `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${newStatus}.`;
    if (newStatus === 'Shipped') notifMsg += ` Expected Delivery: ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}.`;
    if (newStatus === 'Delivered') notifMsg += ` Delivered on: ${new Date(order.actualDeliveryDate).toLocaleDateString()}.`;

    await sendNotification({
      role: 'user',
      user: order.user._id,
      title: `Order ${newStatus}`,
      message: notifMsg,
      type: 'ORDER_STATUS',
      relatedEntityId: order._id
    });

    try {
      if (newStatus === 'Shipped') {
        await sendEmail({
          to: order.user.email,
          subject: `Your order has shipped! #${order._id.toString().slice(-6).toUpperCase()}`,
          html: orderShippedTemplate(order, order.user.name),
        });
      } else if (newStatus === 'Delivered') {
        await sendEmail({
          to: order.user.email,
          subject: `Your order has been delivered! #${order._id.toString().slice(-6).toUpperCase()}`,
          html: orderDeliveredTemplate(order, order.user.name),
        });
      }
    } catch (emailErr) {
      console.error('Order status emails failed:', emailErr);
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject order
// @route   PUT /api/orders/:id/reject
// @access  Private/Admin
export const rejectOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      res.status(400);
      throw new Error('Rejection reason is required');
    }

    if (['Delivered', 'Cancelled', 'Returned'].includes(order.orderStatus)) {
      res.status(400);
      throw new Error(`Cannot reject an order that is already ${order.orderStatus}`);
    }

    order.orderStatus = 'Rejected';
    order.rejectionReason = rejectionReason;
    order.rejectedBy = req.user._id;
    order.rejectionDate = Date.now();

    if (!order.timeline) {
      order.timeline = [];
    }
    
    order.timeline.push({ 
      status: 'Rejected', 
      comment: rejectionReason 
    });

    const updatedOrder = await order.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${order.user._id}`).emit('order_status_updated', updatedOrder);
        io.to('admin-room').emit('order_rejected', updatedOrder);
        io.to('admin-room').emit('order_status_updated', updatedOrder);
      }
    } catch (err) {
      console.error('Socket error in rejectOrder:', err.message);
    }

    // Notify User
    await sendNotification({
      role: 'user',
      user: order.user._id,
      title: 'Order Rejected',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been rejected. Reason: ${rejectionReason}`,
      type: 'ORDER_STATUS',
      relatedEntityId: order._id
    });

    try {
      await sendEmail({
        to: order.user.email,
        subject: `Order Rejected #${order._id.toString().slice(-6).toUpperCase()}`,
        html: orderRejectedTemplate(order, order.user.name, rejectionReason),
      });
    } catch (emailErr) {
      console.error('Order cancellation email failed:', emailErr);
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Helper format URL
const formatImgUrl = (url) => {
  if (!url) return '';
  const urlStr = typeof url === 'object' ? url.url : url;
  if (!urlStr) return '';
  if (typeof urlStr === 'string' && urlStr.startsWith('http')) return urlStr;
  return `${process.env.FRONTEND_URL || 'http://localhost:5000'}${urlStr}`;
};

// @desc    Download Order Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
export const downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Auth check: Must be admin or the owner
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to download this invoice');
    }

    // Only allow for Delivered orders
    if (order.orderStatus !== 'Delivered') {
      res.status(400);
      throw new Error('Invoice is only available for delivered orders');
    }

    // Ensure invoice number exists (in case it was delivered before this feature)
    if (!order.invoiceNumber) {
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      order.invoiceNumber = `INV-${order._id.toString().slice(-6).toUpperCase()}-${randomStr}`;
      await order.save();
    }

    // Render HTML using EJS
    const templatePath = path.join(__dirname, '../templates/invoice.ejs');
    const html = await ejs.renderFile(templatePath, { order, formatImgUrl });

    // Send HTML instead of PDF to avoid Puppeteer dependency issues on Render
    res.setHeader('Content-Type', 'text/html');
    
    // Inject a small script to automatically trigger the print dialog
    const htmlWithPrint = html.replace('</body>', '<script>window.onload = function() { window.print(); }</script></body>');
    
    res.send(htmlWithPrint);

  } catch (error) {
    try {
      const logPath = path.join(__dirname, '../error_log.txt');
      fs.appendFileSync(logPath, `\n\n[${new Date().toISOString()}] INVOICE ERROR:\n${error.stack || error.message}`);
    } catch(e) {}
    next(error);
  }
};

// @desc    Regenerate Order Invoice Number
// @route   POST /api/orders/:id/invoice/regenerate
// @access  Private/Admin
export const regenerateInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.orderStatus !== 'Delivered') {
      res.status(400);
      throw new Error('Can only regenerate invoices for delivered orders');
    }

    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    order.invoiceNumber = `INV-${order._id.toString().slice(-6).toUpperCase()}-${randomStr}`;
    await order.save();

    res.status(200).json({ success: true, message: 'Invoice number regenerated successfully', invoiceNumber: order.invoiceNumber });
  } catch (error) {
    next(error);
  }
};
