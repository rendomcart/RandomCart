import Category from '../models/Category.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js';

// @desc    Get all active categories (public)
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories including inactive (admin)
// @route   GET /api/categories/admin/all
// @access  Private/Admin
export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort('-createdAt');
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    let imageObj = null;

    if (req.file) {
      imageObj = await uploadToCloudinary(req.file.buffer, 'categories');
    }

    const category = await Category.create({
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
      image: imageObj,
    });

    res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    const { name, description, isActive } = req.body;

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    if (req.file) {
      // Delete old image
      if (category.image && category.image.public_id) {
        await deleteFromCloudinary(category.image.public_id);
      }
      // Upload new image
      category.image = await uploadToCloudinary(req.file.buffer, 'categories');
    }

    await category.save();

    res.status(200).json({ success: true, data: category, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (soft delete) a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({ success: true, message: 'Category deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
