import * as productModel from '../models/productModel.js';
import { getMessage } from '../config/messages.js';
import {
  validateProductCreate,
  validateProductUpdate,
  validateStockUpdate,
} from '../validators/productValidator.js';

/**
 * Helper: Get organization ID from validated context
 * SECURITY: Prioritizes organization context from header over JWT token
 */
const getOrgId = req => {
  return req.organization?.id || req.user.org_id;
};

/**
 * Get all products for organization
 */
export const getAllProducts = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const {
      category,
      is_active,
      low_stock,
      min_price,
      max_price,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filters
    const filters = {};
    if (category) filters.category = category;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (low_stock === 'true') filters.low_stock = true;
    if (min_price) filters.min_price = Number.parseFloat(min_price);
    if (max_price) filters.max_price = Number.parseFloat(max_price);
    if (search) filters.search = search;

    // Pagination
    const pageNum = Number.parseInt(page);
    const limitNum = Number.parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const products = await productModel.getAllProducts(orgId, filters, {
      limit: limitNum,
      offset,
    });

    const total = await productModel.getProductsCount(orgId, filters);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getAllProducts controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.RETRIEVE_ERROR'),
      error: error.message,
    });
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    const product = await productModel.getProductById(id, orgId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND'),
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error in getProductById controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.RETRIEVE_ERROR'),
      error: error.message,
    });
  }
};

/**
 * Create new product
 */
export const createProduct = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user.id;

    // Validate request body
    const validation = validateProductCreate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: getMessage('ERROR.VALIDATION_FAILED'),
        errors: validation.errors,
      });
    }

    // Check if SKU already exists
    const existingProduct = await productModel.getProductBySKU(
      req.body.sku,
      orgId
    );
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: getMessage('PRODUCT.SKU_EXISTS'),
      });
    }

    const product = await productModel.createProduct(req.body, orgId, userId);

    res.status(201).json({
      success: true,
      message: getMessage('PRODUCT.CREATED'),
      data: product,
    });
  } catch (error) {
    console.error('Error in createProduct controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.CREATE_ERROR'),
      error: error.message,
    });
  }
};

/**
 * Update product
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    // Validate request body
    const validation = validateProductUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: getMessage('ERROR.VALIDATION_FAILED'),
        errors: validation.errors,
      });
    }

    // Check if product exists
    const existingProduct = await productModel.getProductById(id, orgId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND'),
      });
    }

    // If SKU is being updated, check for duplicates
    if (req.body.sku && req.body.sku !== existingProduct.sku) {
      const duplicateProduct = await productModel.getProductBySKU(
        req.body.sku,
        orgId
      );
      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message: getMessage('PRODUCT.SKU_EXISTS'),
        });
      }
    }

    const product = await productModel.updateProduct(id, req.body, orgId);

    res.json({
      success: true,
      message: getMessage('PRODUCT.UPDATED'),
      data: product,
    });
  } catch (error) {
    console.error('Error in updateProduct controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.UPDATE_ERROR'),
      error: error.message,
    });
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    // Validate request body
    const validation = validateStockUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: getMessage('ERROR.VALIDATION_FAILED'),
        errors: validation.errors,
      });
    }

    // Check if product exists
    const existingProduct = await productModel.getProductById(id, orgId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND'),
      });
    }

    let { quantity } = req.body;
    const { type } = req.body;

    // If type is 'subtract', make quantity negative
    if (type === 'subtract') {
      quantity = -Math.abs(quantity);
    } else if (type === 'add') {
      quantity = Math.abs(quantity);
    }

    // Check if subtraction would result in negative stock
    if (existingProduct.stock_quantity + quantity < 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.INSUFFICIENT_STOCK'),
      });
    }

    const product = await productModel.updateProductStock(id, quantity, orgId);

    res.json({
      success: true,
      message: getMessage('PRODUCT.STOCK_UPDATED'),
      data: product,
    });
  } catch (error) {
    console.error('Error in updateProductStock controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.STOCK_UPDATE_ERROR'),
      error: error.message,
    });
  }
};

/**
 * Delete product (soft delete - endüstri standardı)
 * Ürün arşivlenir, sipariş geçmişi korunur
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    // Check if product exists (include deleted to give proper message)
    const existingProduct = await productModel.getProductById(id, orgId, true);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND'),
      });
    }

    // Check if already deleted
    if (existingProduct.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün zaten silinmiş.',
      });
    }

    const product = await productModel.deleteProduct(id, orgId);

    res.json({
      success: true,
      message: getMessage('PRODUCT.DELETED'),
      data: product,
    });
  } catch (error) {
    console.error('Error in deleteProduct controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.DELETE_ERROR'),
      error: error.message,
    });
  }
};

/**
 * Restore a soft-deleted product
 */
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    // Check if product exists and is deleted
    const existingProduct = await productModel.getProductById(id, orgId, true);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND'),
      });
    }

    if (!existingProduct.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün zaten aktif.',
      });
    }

    const product = await productModel.restoreProduct(id, orgId);

    res.json({
      success: true,
      message: 'Ürün başarıyla geri yüklendi.',
      data: product,
    });
  } catch (error) {
    console.error('Error in restoreProduct controller:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün geri yüklenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const orgId = getOrgId(req);

    const products = await productModel.getLowStockProducts(orgId);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error in getLowStockProducts controller:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.LOW_STOCK_ERROR'),
      error: error.message,
    });
  }
};
