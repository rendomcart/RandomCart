import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  color: { type: String },
  size: { type: String },
  image: { type: String },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
}, {
  timestamps: true,
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
