import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({}).limit(1);
  console.log(JSON.stringify(products[0], null, 2));
  process.exit(0);
};

check();
