import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.model.js';
import dotenv from 'dotenv';
dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { receiptId } = req.body; // receiptId is the orderId

    // SECURITY FIX: Do not trust amount from frontend. Fetch from DB.
    const orderFromDb = await Order.findById(receiptId);
    if (!orderFromDb) {
      res.status(404);
      throw new Error('Order not found');
    }

    const options = {
      amount: Math.round(orderFromDb.totalPrice * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: receiptId,
    };

    const order = await razorpayInstance.orders.create(options);
    
    if (!order) {
      res.status(500);
      throw new Error('Failed to create Razorpay order');
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId // Our DB order ID
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock';

    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      res.status(400);
      throw new Error('Transaction not legit! Signature mismatch.');
    }

    // Payment is valid, update the order status
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found in DB');
    }

    order.paymentInfo.status = 'Completed';
    order.paymentInfo.razorpayOrderId = razorpay_order_id;
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Razorpay Key
// @route   GET /api/payment/key
// @access  Private
export const getRazorpayKey = (req, res, next) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock' });
};
