import Wishlist from '../models/Wishlist.model.js';

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'name images basePrice hasVariants variants slug');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    } else if (wishlist.products && wishlist.products.length > 0) {
      // Deduplicate in case there are existing duplicates
      const uniqueIds = new Set();
      const uniqueProducts = [];
      let hasDuplicates = false;
      
      wishlist.products.forEach(p => {
        if (!p || !p._id) return;
        const idStr = p._id.toString();
        if (!uniqueIds.has(idStr)) {
          uniqueIds.add(idStr);
          uniqueProducts.push(p);
        } else {
          hasDuplicates = true;
        }
      });
      
      if (hasDuplicates) {
        await Wishlist.findByIdAndUpdate(wishlist._id, {
          products: Array.from(uniqueIds)
        });
        wishlist.products = uniqueProducts;
      }
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
// @access  Private
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some(p => p.toString() === productId.toString());
    if (!exists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    wishlist = await Wishlist.findById(wishlist._id)
      .populate('products', 'name images basePrice hasVariants variants slug');

    res.status(200).json({ success: true, data: wishlist, message: 'Added to wishlist' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
      await wishlist.save();
    }

    wishlist = await Wishlist.findById(wishlist._id)
      .populate('products', 'name images basePrice hasVariants variants slug');

    res.status(200).json({ success: true, data: wishlist, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};
