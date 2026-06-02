import mongoose from 'mongoose';
import slugify from 'slugify';

const variantSchema = new mongoose.Schema({
  color: { type: String },
  colorHex: { type: String, default: '#000000' },
  size: { type: String },
  stock: { 
    type: Number, 
    required: [true, 'Variant stock is required'], 
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  price: { 
    type: Number, 
    required: [true, 'Variant original price is required'] 
  },
  discountPrice: { 
    type: Number,
    validate: {
      validator: function(v) {
        return !v || v <= this.price;
      },
      message: 'Selling price cannot exceed original price'
    }
  },
  sku: { type: String },
  images: {
    type: [{
      url: String,
      public_id: String
    }],
    validate: [arrayLimit, 'A variant cannot have more than 5 images']
  }
});

function arrayLimit(val) {
  return val.length <= 5;
}

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true,
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  displayPrice: {
    type: Number,
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  variants: {
    type: [variantSchema],
    validate: [
      {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'A product must have at least one variant'
      },
      {
        validator: function(v) {
          const combos = new Set();
          for (let i = 0; i < v.length; i++) {
            const combo = `${v[i].color?.toLowerCase() || ''}-${v[i].size?.toLowerCase() || ''}`;
            if (combos.has(combo)) return false;
            combos.add(combo);
          }
          return true;
        },
        message: 'Duplicate Color and Size combination is not allowed'
      }
    ]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
