import Product from '../models/Product.model.js';
import slugify from 'slugify';
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js';
import { sendNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';
import Order from '../models/Order.model.js';
import Review from '../models/Review.model.js';

// @desc    Get all products (public with filters, pagination)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let queryBuilder = Product.find(query).populate('category', 'name slug');

    // Sorting
    if (sort === 'price_asc') {
      queryBuilder = queryBuilder.sort('displayPrice');
    } else if (sort === 'price_desc') {
      queryBuilder = queryBuilder.sort('-displayPrice');
    } else if (sort === 'popular') {
      queryBuilder = queryBuilder.sort('-ratings.average');
    } else {
      queryBuilder = queryBuilder.sort('-createdAt'); // default newest
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await Product.countDocuments(query);

    queryBuilder = queryBuilder.skip(startIndex).limit(limitNum);
    const products = await queryBuilder;

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug');
    
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/id/:id
// @access  Private/Admin
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for admin
// @route   GET /api/products/admin/all
// @access  Private/Admin
export const getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .populate('category', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock inventory products
// @route   GET /api/products/inventory/low
// @access  Private/Admin
export const getLowStockProducts = async (req, res, next) => {
  try {
    // Threshold is 5 as per prompt
    const threshold = 5;
    
    // Find products where any variant stock < 5
    const products = await Product.find({
      isActive: true,
      'variants.stock': { $lt: threshold }
    }).populate('category', 'name');

    // Restructure for easier consumption in inventory table
    let lowStockItems = [];
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.stock < threshold) {
          lowStockItems.push({
            productId: p._id,
            name: p.name,
            variantId: v._id,
            color: v.color,
            size: v.size,
            image: v.images && v.images[0]?.url,
            isVariant: true,
            stock: v.stock,
            price: v.price
          });
        }
      });
    });

    // Sort by stock ascending (most critical first)
    lowStockItems.sort((a, b) => a.stock - b.stock);

    res.status(200).json({ success: true, data: lowStockItems });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, tags, variants } = req.body;
    
    // Parse variants if they come as stringified JSON from FormData
    let parsedVariants = [];
    if (variants) {
       parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    if (!parsedVariants || parsedVariants.length === 0) {
      res.status(400);
      throw new Error('At least one variant is required.');
    }

    const suffix = Math.floor(Math.random() * 1000).toString();
    const slug = slugify(`${name}-${suffix}`, { lower: true, strict: true });

    let computedDisplayPrice = 0;
    const prices = parsedVariants.map(v => Number(v.discountPrice) || Number(v.price));
    if (prices.length > 0) {
      computedDisplayPrice = Math.min(...prices);
    }

    const product = await Product.create({
      name,
      description,
      category,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      displayPrice: computedDisplayPrice,
      variants: parsedVariants,
      slug
    });

    await sendNotification({
      role: 'admin',
      title: 'Product Created',
      message: `Product "${product.name}" has been added to the catalog.`,
      type: 'INVENTORY',
      relatedEntityId: product._id
    });

    try {
      const io = getIO();
      if (io) {
        io.to('admin-room').emit('product_created', product);
      }
    } catch(err) {}

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const { name, description, category, tags, variants, isActive } = req.body;

    if (name) {
      product.name = name;
      const suffix = Math.floor(Math.random() * 1000).toString();
      product.slug = slugify(`${name}-${suffix}`, { lower: true, strict: true });
    }
    if (description) product.description = description;
    if (category) product.category = category;
    if (tags) product.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    if (variants) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      if (!parsedVariants || parsedVariants.length === 0) {
        res.status(400);
        throw new Error('At least one variant is required.');
      }
      product.variants = parsedVariants;
    }

    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.discountPrice || v.price);
      product.displayPrice = Math.min(...prices);
    }

    await product.save();

    // Check stock levels after update
    let lowStockVariant = false;
    for (const v of product.variants) {
      if (v.stock <= 5) {
        lowStockVariant = true;
        break;
      }
    }

    if (lowStockVariant) {
      await sendNotification({
        role: 'admin',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" has variants running low on stock.`,
        type: 'STOCK_ALERT',
        relatedEntityId: product._id
      });
    }

    try {
      const io = getIO();
      if (io) {
        io.to('admin-room').emit('product_updated', product);
        io.emit('stock_updated', { 
          productId: product._id, 
          variants: product.variants 
        });
      }
    } catch(err) {}

    res.status(200).json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (hard delete) product and images
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check if there are any pending/active orders containing this product
    const activeOrders = await Order.find({
      'orderItems.product': product._id,
      orderStatus: { $nin: ['Delivered', 'Cancelled', 'Returned', 'Rejected'] }
    });

    if (activeOrders.length > 0) {
      res.status(400);
      throw new Error('Cannot delete product. There are active orders containing this product that are not yet Delivered or Cancelled.');
    }

    // Collect all public_ids for images to delete
    const publicIdsToDelete = [];

    // Top-level images (legacy handling)
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img.public_id) publicIdsToDelete.push(img.public_id);
      });
    }

    // Variant images
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.images && variant.images.length > 0) {
          variant.images.forEach(img => {
            if (img.public_id) publicIdsToDelete.push(img.public_id);
          });
        }
      });
    }

    // Delete images from storage (local/Cloudinary)
    for (const publicId of publicIdsToDelete) {
      await deleteFromCloudinary(publicId);
    }

    // Delete all reviews related to this product
    await Review.deleteMany({ product: product._id });

    // Delete product from database
    await product.deleteOne();

    await sendNotification({
      role: 'admin',
      title: 'Product Deleted',
      message: `Product "${product.name}" has been removed from the catalog.`,
      type: 'INVENTORY'
    });

    try {
      const io = getIO();
      if (io) {
        io.to('admin-room').emit('product_deleted', req.params.id);
        io.emit('product_deleted', req.params.id);
      }
    } catch(err) {}

    res.status(200).json({ success: true, message: 'Product and associated images deleted permanently' });
  } catch (error) {
    next(error);
  }
};
