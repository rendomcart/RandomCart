import cron from 'node-cron';
import Order from '../models/Order.model.js';
import { sendNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

const updateOrderStatus = async (order, newStatus, comment) => {
  order.orderStatus = newStatus;
  
  const now = new Date();
  if (newStatus === 'Shipped') order.actualShipDate = now;
  if (newStatus === 'Delivered') {
    order.deliveredAt = now;
    order.actualDeliveryDate = now;
    if (order.paymentMethod === 'COD' && order.paymentInfo.status !== 'Completed') {
      order.paymentInfo.status = 'Completed';
    }
    if (!order.invoiceNumber) {
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      order.invoiceNumber = `INV-${order._id.toString().slice(-6).toUpperCase()}-${randomStr}`;
    }
  }

  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status: newStatus,
    comment,
    updatedBy: 'System',
    date: now
  });

  await order.save();

  try {
    const io = getIO();
    if (io) {
      io.to(`user-${order.user._id}`).emit('order_status_updated', order);
      io.to('admin-room').emit('order_status_updated', order);
    }
  } catch(e) {}
  
  await sendNotification({
    role: 'user',
    user: order.user._id,
    title: `Order Auto-Updated`,
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${newStatus}.`,
    type: 'ORDER_STATUS',
    relatedEntityId: order._id
  });
  
  await sendNotification({
    role: 'admin',
    title: `System Auto-Update`,
    message: `Order #${order._id.toString().slice(-6).toUpperCase()} progressed to ${newStatus}.`,
    type: 'SYSTEM',
    relatedEntityId: order._id
  });
};

const initWorkflowCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running Order Workflow Cron Job...');
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // 1. Auto Approve
      const pendingOrders = await Order.find({
        orderStatus: 'Pending Approval',
        createdAt: { $lt: twentyFourHoursAgo }
      });

      if (pendingOrders.length > 0) {
        console.log(`Auto-approving ${pendingOrders.length} orders...`);
      }

      for (const order of pendingOrders) {
        order.workflowFlags = {
          autoApproved: true,
          autoApprovalDate: now
        };
        await updateOrderStatus(order, 'Processing', 'System: Auto-approved after 24 hours of inactivity');
      }
      
      // 2. Auto Progression
      const activeOrders = await Order.find({
        orderStatus: { $in: ['Processing', 'Shipped', 'Out for Delivery'] },
        expectedDates: { $exists: true }
      });

      for (const order of activeOrders) {
        const { expectedDates, orderStatus } = order;
        let shouldAdvanceTo = null;
        
        if (orderStatus === 'Processing' && expectedDates.shipped && now > new Date(expectedDates.shipped)) {
          shouldAdvanceTo = 'Shipped';
        } 
        else if (orderStatus === 'Shipped' && expectedDates.outForDelivery && now > new Date(expectedDates.outForDelivery)) {
          shouldAdvanceTo = 'Out for Delivery';
        }
        else if (orderStatus === 'Out for Delivery' && expectedDates.delivered && now > new Date(expectedDates.delivered)) {
          shouldAdvanceTo = 'Delivered';
        }

        if (shouldAdvanceTo) {
          console.log(`Auto-advancing order ${order._id} to ${shouldAdvanceTo}`);
          await updateOrderStatus(order, shouldAdvanceTo, `System: Auto-progressed to ${shouldAdvanceTo} based on timeline`);
        }
      }
      
    } catch (error) {
      console.error('Error in Order Workflow Cron:', error);
    }
  });
};

export default initWorkflowCron;
