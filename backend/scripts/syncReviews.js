import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';
import Review from '../models/Review.model.js';

dotenv.config();

const syncReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const products = await Product.find({});
    
    for (const product of products) {
      const reviews = await Review.find({ product: product._id });
      const count = reviews.length;
      const average = count === 0 ? 0 : reviews.reduce((acc, item) => acc + item.rating, 0) / count;
      
      await Product.findByIdAndUpdate(product._id, {
        'ratings.count': count,
        'ratings.average': Number(average.toFixed(1))
      });
      console.log(`Updated ${product.name} - Reviews: ${count}, Avg: ${average}`);
    }

    console.log('Sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

syncReviews();
