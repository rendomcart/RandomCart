import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  image: {
    url: String,
    public_id: String,
  },
  description: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Auto-generate slug before saving
categorySchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
