import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import { getIO } from '../config/socket.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
      let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name images basePrice discountPrice hasVariants variants',
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;
    
    // Find product to validate and get current price
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      res.status(404);
      throw new Error('Variant not found');
    }
    let price = variant.discountPrice || variant.price;
    let stock = variant.stock;

    if (stock < quantity) {
      res.status(400);
      throw new Error(`Only ${stock} items available in stock`);
    }

    let color = variant.color || '';
    let size = variant.size || '';
    let image = variant.images && variant.images.length > 0 ? variant.images[0].url : '';

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(p => 
      p.product.toString() === productId && p.variantId.toString() === variantId
    );

    if (itemIndex > -1) {
      // Item exists, update quantity
      let newQuantity = cart.items[itemIndex].quantity + quantity;
      if (newQuantity > stock) newQuantity = stock;
      cart.items[itemIndex].quantity = newQuantity;
      // Update price snapshot
      cart.items[itemIndex].price = price;
      cart.items[itemIndex].color = color;
      cart.items[itemIndex].size = size;
      cart.items[itemIndex].image = image;
    } else {
      // New item
      cart.items.push({
        product: productId,
        variantId: variantId,
        color,
        size,
        image,
        quantity,
        price
      });
    }

    await cart.save();
    
    // Repopulate for response
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name images basePrice discountPrice hasVariants variants',
    });

    try {
      const io = getIO();
      if (io) io.to(`user-${req.user._id}`).emit('cart_updated', cart);
    } catch(err) {}

    res.status(200).json({ success: true, data: cart, message: 'Item added to cart' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(p => 
      p.product.toString() === productId && p.variantId.toString() === variantId
    );

    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    // Check stock
    const product = await Product.findById(productId);
    if (!product) {
       res.status(404);
       throw new Error('Product not found');
    }
    const variant = product.variants.id(variantId);
    if (!variant) {
      res.status(404);
      throw new Error('Variant not found');
    }
    const stock = variant.stock;

    if (quantity > stock) {
      res.status(400);
      throw new Error(`Only ${stock} items available in stock`);
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name images basePrice discountPrice hasVariants variants',
    });

    try {
      const io = getIO();
      if (io) io.to(`user-${req.user._id}`).emit('cart_updated', updatedCart);
    } catch(err) {}

    res.status(200).json({ success: true, data: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, variantId } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(p => {
      return !(p.product.toString() === productId && p.variantId.toString() === variantId);
    });

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name images basePrice discountPrice hasVariants variants',
    });

    try {
      const io = getIO();
      if (io) io.to(`user-${req.user._id}`).emit('cart_updated', updatedCart);
    } catch(err) {}

    res.status(200).json({ success: true, data: updatedCart, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    
    try {
      const io = getIO();
      if (io) io.to(`user-${req.user._id}`).emit('cart_updated', cart);
    } catch(err) {}
    
    res.status(200).json({ success: true, data: cart, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
