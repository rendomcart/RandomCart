import cron from 'node-cron';
import Order from '../models/Order.model.js';
import { sendNotification } from '../services/notification.service.js';

// Run every hour
const initOrderEscalationCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running Order Escalation Cron Job...');
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Find orders that are still Pending Approval and were created more than 24 hours ago
      const overdueOrders = await Order.find({
        orderStatus: 'Pending Approval',
        createdAt: { $lt: twentyFourHoursAgo }
      });

      if (overdueOrders.length === 0) {
        return;
      }

      console.log(`Found ${overdueOrders.length} overdue orders. Escalating...`);

      for (const order of overdueOrders) {
        // Update status to Overdue Review
        order.orderStatus = 'Overdue Review';
        
        if (!order.timeline) order.timeline = [];
        order.timeline.push({
          status: 'Overdue Review',
          comment: 'System: Order escalated due to 24-hour inactivity.'
        });

        await order.save();

        // Notify Admins
        await sendNotification({
          role: 'admin',
          title: 'Action Required: Overdue Order',
          message: `Order #${order._id.toString().slice(-6).toUpperCase()} has been Pending Approval for over 24 hours.`,
          type: 'SYSTEM',
          relatedEntityId: order._id
        });
      }
    } catch (error) {
      console.error('Error in Order Escalation Cron:', error);
    }
  });
};

export default initOrderEscalationCron;
