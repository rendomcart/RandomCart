export const verifyEmailTemplate = (otpCode) => {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 40px 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">RandomCart</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">Verify your email address</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hello,<br><br>
            Thank you for joining RandomCart! To complete your registration and unlock all features, please use the verification code below:
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background-color: #f0f9ff; border: 2px dashed #bae6fd; padding: 20px 40px; border-radius: 12px;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #0284c7;">${otpCode}</span>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5; margin-bottom: 0;">
            This verification code is valid for <strong>10 minutes</strong>.<br>
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} RandomCart. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

export const resetPasswordTemplate = (otpCode) => {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 40px 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">RandomCart</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hello,<br><br>
            We received a request to reset your RandomCart password. Use the secure code below to proceed with resetting your password:
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background-color: #fef2f2; border: 2px dashed #fecaca; padding: 20px 40px; border-radius: 12px;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #dc2626;">${otpCode}</span>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5; margin-bottom: 0;">
            This reset code is valid for <strong>10 minutes</strong>.<br>
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} RandomCart. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

export const welcomeTemplate = (userName) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Welcome to RandomCart!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 22px; margin-top: 0;">Hello ${userName},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your email has been successfully verified! We are thrilled to have you on board. Start exploring our latest products and enjoy a seamless shopping experience.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Shopping</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} RandomCart.</p>
        </div>
      </div>
    </div>
  `;
};

export const orderPlacedTemplate = (order, userName) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Confirmation</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px;">Thank you for your order, ${userName}!</h2>
          <p style="color: #4b5563;">We have received your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> and are getting it ready.</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Total Amount:</strong> ₹${order.totalPrice}</p>
            <p style="margin: 0; color: #374151;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">You can track your order status in your dashboard.</p>
        </div>
      </div>
    </div>
  `;
};

export const adminNewOrderTemplate = (order, customerName) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Order Received!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #4b5563;">A new order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been placed by ${customerName}.</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Total:</strong> ₹${order.totalPrice}</p>
            <p style="margin: 0; color: #374151;"><strong>Delivery:</strong> ${order.deliveryType}</p>
          </div>
          <a href="${process.env.ADMIN_URL || 'http://localhost:5174'}/orders/${order._id}" style="color: #8b5cf6; font-weight: bold; text-decoration: none;">View Order Details</a>
        </div>
      </div>
    </div>
  `;
};

export const orderShippedTemplate = (order, userName) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Order has Shipped! 🚚</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px;">Great news, ${userName}!</h2>
          <p style="color: #4b5563;">Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been shipped and is on its way to you.</p>
          <p style="color: #4b5563;">Estimated Delivery: <strong>${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</strong></p>
        </div>
      </div>
    </div>
  `;
};

export const orderDeliveredTemplate = (order, userName) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Delivered! 🎉</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px;">Hello ${userName},</h2>
          <p style="color: #4b5563;">Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been successfully delivered.</p>
          <p style="color: #4b5563;">We hope you love your items! You can now download your invoice from your dashboard.</p>
        </div>
      </div>
    </div>
  `;
};

export const orderCancelledTemplate = (order, userName, reason) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Cancelled</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px;">Hello ${userName},</h2>
          <p style="color: #4b5563;">Unfortunately, your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been cancelled.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason || 'Item unavailable or payment issue.'}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">If you have already paid, a refund will be initiated shortly.</p>
        </div>
      </div>
    </div>
  `;
};

export const orderRejectedTemplate = (order, userName, reason) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Rejected</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px;">Hello ${userName},</h2>
          <p style="color: #4b5563;">We regret to inform you that your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been rejected by the admin.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Rejection Reason:</strong> ${reason}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">If your payment was completed, a refund will be processed and credited to your original payment method within a few business days.</p>
        </div>
      </div>
    </div>
  `;
};

export const contactReplyTemplate = (name) => {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">We received your message!</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px;">Hello ${name},</h2>
          <p style="color: #4b5563;">Thank you for reaching out to RandomCart support.</p>
          <p style="color: #4b5563;">We have received your message and our team is currently reviewing it. We aim to reply to all inquiries within 24 hours.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>The RandomCart Team</p>
        </div>
      </div>
    </div>
  `;
};
