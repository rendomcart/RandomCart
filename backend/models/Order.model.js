import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  name: { type: String, required: true },
  color: { type: String },
  size: { type: String },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Razorpay', 'COD'], // Cash on Delivery or Razorpay
    default: 'Razorpay'
  },
  paymentInfo: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    }
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  orderStatus: {
    type: String,
    required: true,
    enum: ['Pending Approval', 'Overdue Review', 'Approved', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Rejected'],
    default: 'Pending Approval',
  },
  deliveryType: {
    type: String,
    enum: ['Standard', 'Express'],
    default: 'Standard'
  },
  deliveryCharge: { type: Number, default: 0 },
  estimatedShipDate: { type: Date },
  estimatedDeliveryDate: { type: Date },
  actualShipDate: { type: Date },
  actualDeliveryDate: { type: Date },
  expectedDates: {
    processing: { type: Date },
    shipped: { type: Date },
    outForDelivery: { type: Date },
    delivered: { type: Date }
  },
  workflowFlags: {
    autoApproved: { type: Boolean, default: false },
    autoApprovalDate: { type: Date }
  },
  timeline: [
    {
      status: { type: String, required: true },
      date: { type: Date, default: Date.now },
      comment: { type: String },
      updatedBy: { type: String, enum: ['System', 'Admin', 'User'], default: 'User' }
    }
  ],
  deliveredAt: { type: Date },
  invoiceNumber: { type: String, unique: true, sparse: true },
  rejectionReason: { type: String },
  rejectedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  rejectionDate: { type: Date },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
