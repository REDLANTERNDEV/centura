# Products Page - Professional ERP/CRM Module

## Overview

The Products page is a professional, industry-standard inventory management module for the ERP/CRM system. It provides comprehensive product catalog management with advanced features for tracking inventory, pricing, and product information.

## Features

### 📊 Dashboard Statistics

- **Total Products**: Real-time count of all products
- **Low Stock Alerts**: Visual indicators for products needing restocking
- **Inventory Value**: Total monetary value of stock
- **Category Overview**: Number of unique product categories

### 🔍 Advanced Filtering & Search

- **Search**: Full-text search across product name, SKU, and description
- **Category Filter**: Filter by product categories (Electronics, Clothing, Food, etc.)
- **Status Filter**: Filter by active/inactive status
- **Real-time Updates**: Automatic refresh on filter changes

### 📋 Data Table Features

- **Sortable Columns**: Click column headers to sort
- **Pagination**: Navigate through large product catalogs
- **Responsive Design**: Adapts to different screen sizes
- **Row Actions**: Quick access to view, edit, and delete operations

### 💰 Pricing & Profit Analysis

- **Selling Price**: Customer-facing price
- **Cost Price**: Internal cost tracking
- **Profit Margin**: Automatic calculation and color-coded display
- **Tax Rate**: Configurable tax rates per product

### 📦 Inventory Management

- **Stock Tracking**: Real-time stock quantity monitoring
- **Low Stock Alerts**: Visual warnings when stock falls below threshold
- **Stock Status Badges**: Color-coded status indicators
  - 🟢 In Stock: Sufficient inventory
  - 🟡 Low Stock: Below threshold
  - 🔴 Out of Stock: Zero inventory
- **Unit of Measure**: Support for various units (pieces, kg, liters, etc.)

### 📝 Product Information

- **SKU Management**: Unique stock keeping unit codes
- **Barcode Support**: Optional barcode tracking
- **Category System**: Organized product categorization
- **Rich Descriptions**: Detailed product information
- **Active/Inactive Status**: Control product visibility

## Components

### Main Components

#### `page.tsx`

The main Products page component that orchestrates all functionality:

- State management for products, filters, and dialogs
- API integration for CRUD operations
- Statistics calculation
- CSV export functionality

#### `products-table.tsx`

Professional data table component:

- Displays products with comprehensive information
- Sortable and paginated
- Row-level actions menu
- Loading and empty states

#### `product-details-dialog.tsx`

Comprehensive product information viewer:

- Full product details display
- Pricing breakdown with profit margin
- Inventory information
- Metadata and audit trail

#### `create-product-dialog.tsx`

Product creation form with validation:

- Multi-section form layout
- Required field validation
- Category and unit selection
- Real-time form validation

#### `edit-product-dialog.tsx`

Product editing form:

- Pre-populated with existing data
- Same validation as create form
- Update confirmation

### Helper Components

#### `product-category-badge.tsx`

Visual category indicators with icons:

- 📱 Electronics
- 👕 Clothing
- ☕ Food & Beverage
- 📚 Books
- 🏡 Home & Garden
- ⚽ Sports
- 📦 Other

#### `stock-status-badge.tsx`

Dynamic stock status indicators:

- Automatic status calculation
- Color-coded badges
- Icon representation

## API Integration

### Endpoints Used

```typescript
GET    /api/v1/products           // List products with filters
POST   /api/v1/products           // Create new product
GET    /api/v1/products/:id       // Get single product
PUT    /api/v1/products/:id       // Update product
DELETE /api/v1/products/:id       // Delete product
PATCH  /api/v1/products/:id/stock // Update stock quantity
GET    /api/v1/products/low-stock // Get low stock products
```

### API Functions

```typescript
// Get products with filters
getProducts({ search, category, is_active, page, limit });

// Create new product
createProduct(productData);

// Update existing product
updateProduct(id, productData);

// Delete product
deleteProduct(id);

// Update stock quantity
updateProductStock(id, { operation, quantity, reason });

// Get low stock products
getLowStockProducts();
```

## Usage

### Navigation

Access the Products page from the sidebar:

- Click on "Ürünler" (Products) in the main navigation
- URL: `/dashboard/products`

### Creating a Product

1. Click the "Add Product" button
2. Fill in required fields:
   - Product Name \*
   - SKU \*
   - Selling Price \*
3. Optionally add:
   - Description
   - Barcode
   - Cost Price
   - Category
   - Initial Stock
   - Low Stock Threshold
4. Click "Create Product"

### Editing a Product

1. Click the "..." menu on any product row
2. Select "Edit Product"
3. Modify the desired fields
4. Click "Update Product"

### Viewing Product Details

1. Click the "..." menu on any product row
2. Select "View Details"
3. Review comprehensive product information

### Deleting a Product

1. Click the "..." menu on any product row
2. Select "Delete"
3. Confirm the deletion

### Exporting Data

1. Click the "Export" button
2. CSV file will download automatically
3. Includes all product data

### Filtering Products

- **Search**: Type in the search box to filter by name, SKU, or description
- **Category**: Select a category from the dropdown
- **Status**: Filter by active or inactive products
- **Refresh**: Click the refresh icon to reload data

## Data Model

```typescript
interface Product {
  id: number; // Unique identifier
  org_id: number; // Organization ID
  name: string; // Product name
  description?: string; // Optional description
  sku: string; // Stock Keeping Unit (unique)
  barcode?: string; // Optional barcode
  category: string; // Product category
  price: number; // Selling price
  cost_price?: number; // Cost price
  tax_rate: number; // Tax percentage
  stock_quantity: number; // Current stock
  low_stock_threshold: number; // Alert threshold
  unit: string; // Unit of measure
  is_active: boolean; // Active status
  created_by?: number; // Creator user ID
  created_at: string; // Creation timestamp
  updated_at: string; // Last update timestamp
}
```

## Best Practices

### SKU Management

- Use consistent SKU format across products
- Make SKUs meaningful (e.g., `ELEC-LAPTOP-001`)
- Keep SKUs unique and immutable

### Pricing Strategy

- Always enter cost price for profit tracking
- Set appropriate tax rates per product category
- Review pricing regularly

### Inventory Control

- Set realistic low stock thresholds
- Monitor low stock alerts regularly
- Update stock quantities promptly

### Category Organization

- Use standard categories consistently
- Create new categories only when necessary
- Keep category names clear and descriptive

## Keyboard Shortcuts

- `Enter`: Submit forms
- `Esc`: Close dialogs
- `Tab`: Navigate form fields

## Responsive Design

The Products page is fully responsive:

- **Desktop**: Full table layout with all columns
- **Tablet**: Adjusted column widths, stacked filters
- **Mobile**: Card-based layout, collapsible filters

## Performance Optimizations

- **Pagination**: Loads 20 products per page
- **Lazy Loading**: Components load on demand
- **Debounced Search**: Prevents excessive API calls
- **Optimistic Updates**: Immediate UI feedback

## Security

- **Organization Context**: All operations scoped to selected organization
- **Authentication**: Requires valid session
- **Authorization**: Backend validates user permissions
- **Input Validation**: Client and server-side validation

## Future Enhancements

Potential features for future releases:

- Bulk import/export
- Product images/gallery
- Variant management (sizes, colors)
- Supplier tracking
- Purchase order integration
- Stock movement history
- Barcode scanning
- Multi-warehouse support
- Product bundles
- Pricing tiers
- Discount management
- Product reviews/ratings

## Troubleshooting

### Products Not Loading

1. Check organization is selected
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Refresh the page

### Create/Update Failing

1. Ensure all required fields are filled
2. Verify SKU is unique
3. Check price values are valid numbers
4. Ensure organization is selected

### Export Not Working

1. Check if products exist
2. Verify browser allows downloads
3. Check browser console for errors

## Related Documentation

- [API Client Documentation](../../lib/api-client.ts)
- [Organization Context](../../lib/contexts/OrganizationContext.tsx)
- [Orders Page](../orders/page.tsx)
- [Customers Page](../customers/page.tsx)

## Support

For issues or questions:

1. Check this documentation
2. Review component comments
3. Check browser console errors
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: November 2, 2025  
**Status**: ✅ Production Ready
