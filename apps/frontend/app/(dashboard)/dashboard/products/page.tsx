/**
 * Products Page
 * Professional inventory management for ERP/CRM system
 * Industry-standard features including stock tracking, category management, and analytics
 */

'use client';
/* eslint-disable no-console */

import { useState, useEffect } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { getProducts, deleteProduct, Product } from '@/lib/api-client';
import { ProductsTable } from '@/components/products/products-table';
import { ProductDetailsDialog } from '@/components/products/product-details-dialog';
import { EditProductDialog } from '@/components/products/edit-product-dialog';
import { CreateProductDialog } from '@/components/products/create-product-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  Download,
  RefreshCw,
  Package,
  AlertTriangle,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductsPageData {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const { selectedOrganization } = useOrganization();
  const [data, setData] = useState<ProductsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Edit dialog state
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    totalValue: 0,
  });

  /**
   * Fetch products from API
   */
  const fetchProducts = async () => {
    if (!selectedOrganization) {
      return;
    }

    setIsLoading(true);
    try {
      const filters: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) filters.search = searchQuery;
      if (categoryFilter && categoryFilter !== 'all')
        filters.category = categoryFilter;
      if (statusFilter === 'active') filters.is_active = true;
      if (statusFilter === 'inactive') filters.is_active = false;

      const result = await getProducts(filters);

      // Transform the API response to match our interface
      const transformedData: ProductsPageData = {
        products: result.data || [],
        pagination: result.pagination || {
          page: currentPage,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      setData(transformedData);

      // Calculate statistics
      if (transformedData.products && transformedData.products.length > 0) {
        const total = transformedData.pagination.total;
        const active = transformedData.products.filter(
          (p: Product) => p.is_active
        ).length;
        const lowStock = transformedData.products.filter(
          (p: Product) => p.stock_quantity <= p.low_stock_threshold
        ).length;
        const totalValue = transformedData.products.reduce(
          (sum: number, p: Product) => sum + p.price * p.stock_quantity,
          0
        );

        setStats({
          total,
          active,
          lowStock,
          totalValue,
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      toast.error(
        error instanceof Error ? error.message : 'Ürünler yüklenemedi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle product deletion
   */
  const handleDelete = async (product: Product) => {
    if (
      !confirm(
        `"${product.name}" ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }

    try {
      await deleteProduct(product.id);
      toast.success('Ürün başarıyla silindi');
      fetchProducts();
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      toast.error(error instanceof Error ? error.message : 'Ürün silinemedi');
    }
  };

  /**
   * Handle view product details
   */
  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  /**
   * Handle edit product
   */
  const handleEdit = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsEditOpen(true);
  };

  /**
   * Export products to CSV
   */
  const handleExport = () => {
    if (!data?.products || data.products.length === 0) {
      toast.error('Dışa aktarılacak ürün yok');
      return;
    }

    const headers = [
      'ID',
      'Ürün Adı',
      'SKU',
      'Kategori',
      'Fiyat',
      'Maliyet',
      'Stok',
      'Birim',
      'Durum',
    ];
    const csvData = data.products.map((p: Product) => [
      p.id,
      p.name,
      p.sku,
      p.category,
      p.price,
      p.cost_price || 0,
      p.stock_quantity,
      p.unit,
      p.is_active ? 'Aktif' : 'Pasif',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `urunler-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    globalThis.URL.revokeObjectURL(url);

    toast.success('Ürünler başarıyla dışa aktarıldı');
  };

  /**
   * Fetch products on mount and when filters change
   */
  useEffect(() => {
    if (selectedOrganization) {
      fetchProducts();
    }
  }, [
    selectedOrganization,
    currentPage,
    searchQuery,
    categoryFilter,
    statusFilter,
  ]);

  /**
   * Reset to page 1 when filters change
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Ürünler</h1>
          <p className='text-muted-foreground'>
            Ürün kataloğunuzu ve envanterinizi yönetin
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleExport}>
            <Download className='mr-2 h-4 w-4' />
            Dışa Aktar
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Ürün Ekle
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Toplam Ürün</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.active} aktif ürün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Düşük Stok Uyarısı
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.lowStock}</div>
            <p className='text-xs text-muted-foreground'>
              Yeniden stoklama gerekiyor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Envanter Değeri
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₺
              {stats.totalValue.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground'>Toplam stok değeri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Kategoriler</CardTitle>
            <Boxes className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.products
                ? new Set(data.products.map((p: Product) => p.category)).size
                : 0}
            </div>
            <p className='text-xs text-muted-foreground'>Ürün kategorisi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Ürün adı, SKU veya açıklama ile ara...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Tüm Kategoriler' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tüm Kategoriler</SelectItem>
                <SelectItem value='Electronics'>Elektronik</SelectItem>
                <SelectItem value='Clothing'>Giyim</SelectItem>
                <SelectItem value='Food'>Gıda & İçecek</SelectItem>
                <SelectItem value='Books'>Kitap</SelectItem>
                <SelectItem value='Home'>Ev & Bahçe</SelectItem>
                <SelectItem value='Sports'>Spor</SelectItem>
                <SelectItem value='Other'>Diğer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full md:w-[180px]'>
                <SelectValue placeholder='Tüm Durumlar' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tüm Durumlar</SelectItem>
                <SelectItem value='active'>Aktif</SelectItem>
                <SelectItem value='inactive'>Pasif</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              size='icon'
              onClick={fetchProducts}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className='p-0'>
          <ProductsTable
            products={data?.products || []}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pagination={data?.pagination}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProductDetailsDialog
        product={selectedProduct}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EditProductDialog
        product={selectedProductForEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => {
          fetchProducts();
          setIsEditOpen(false);
        }}
      />

      <CreateProductDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          fetchProducts();
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}
