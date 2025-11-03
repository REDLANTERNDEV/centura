/**
 * Orders Page
 * Professional orders management for ERP/CRM system
 */

'use client';
/* eslint-disable no-console */

import { useState, useEffect } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import {
  getOrders,
  cancelOrder,
  deleteOrder,
  Order,
  getRevenueMetrics,
} from '@/lib/api-client';
import { OrdersTable } from '@/components/orders/orders-table';
import { OrderDetailsDialog } from '@/components/orders/order-details-dialog';
import { AdvancedEditOrderDialog } from '@/components/orders/advanced-edit-order-dialog';
import { CreateOrderDialog } from '@/components/orders/create-order-dialog';
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
  Filter,
  Download,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrdersPageData {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrdersPage() {
  const { selectedOrganization } = useOrganization();
  const [data, setData] = useState<OrdersPageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Revenue stats
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Edit dialog state
  const [selectedOrderForEdit, setSelectedOrderForEdit] =
    useState<Order | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetch orders from API
   */
  const fetchOrders = async () => {
    if (!selectedOrganization) {
      return;
    }

    setIsLoading(true);
    try {
      const filters: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) filters.search = searchQuery;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (paymentFilter !== 'all') filters.payment_status = paymentFilter;

      const response = await getOrders(filters);

      setData({
        orders: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      });

      // Fetch revenue metrics
      try {
        const revenueMetrics = await getRevenueMetrics();
        setTotalRevenue(revenueMetrics.totalRevenue || 0);
      } catch (error: any) {
        console.error('Could not fetch revenue metrics:', error);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Siparişler yüklenirken hata oluştu', {
        description:
          error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load orders on component mount and when filters change
   */
  useEffect(() => {
    fetchOrders();
  }, [selectedOrganization?.org_id, currentPage, statusFilter, paymentFilter]);

  /**
   * Search handler (with debounce would be better for production)
   */
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    fetchOrders();
  };

  /**
   * View order details
   */
  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setIsDetailsOpen(true);
  };

  /**
   * Edit order
   */
  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    setIsEditOpen(true);
  };

  /**
   * Cancel order
   */
  const handleCancelOrder = async (order: Order) => {
    if (
      !confirm(
        `${order.order_number} numaralı siparişi iptal etmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    try {
      await cancelOrder(order.id);
      toast.success('Sipariş iptal edildi');
      fetchOrders(); // Refresh list
    } catch (error: any) {
      toast.error('Sipariş iptal edilirken hata oluştu', {
        description:
          error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
      });
    }
  };

  /**
   * Delete order
   */
  const handleDeleteOrder = async (order: Order) => {
    if (
      !confirm(
        `${order.order_number} numaralı siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }

    try {
      await deleteOrder(order.id);
      toast.success('Sipariş silindi');
      fetchOrders(); // Refresh list
    } catch (error: any) {
      toast.error('Sipariş silinirken hata oluştu', {
        description:
          error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
      });
    }
  };

  /**
   * Page change handler
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!selectedOrganization) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-200px)]'>
        <div className='text-center'>
          <ShoppingCart className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
          <h3 className='text-lg font-semibold mb-2'>Organizasyon Seçilmedi</h3>
          <p className='text-muted-foreground'>
            Siparişleri görüntülemek için bir organizasyon seçin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Siparişler</h1>
          <p className='text-muted-foreground mt-1'>
            Siparişlerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={fetchOrders}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Yenile
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Yeni Sipariş
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-5'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Toplam Sipariş
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.pagination.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₺
              {totalRevenue.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.orders.filter(o => o.status === 'confirmed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>İşlemde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.orders.filter(o => o.status === 'processing').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Teslim Edildi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.orders.filter(o => o.status === 'delivered').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='flex gap-2'>
                <Input
                  placeholder='Sipariş no, müşteri ara...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className='flex-1'
                />
                <Button onClick={handleSearch}>
                  <Search className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <div className='flex gap-2'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-40'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue placeholder='Durum' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tüm Durumlar</SelectItem>
                  <SelectItem value='draft'>Taslak</SelectItem>
                  <SelectItem value='confirmed'>Onaylandı</SelectItem>
                  <SelectItem value='processing'>İşleniyor</SelectItem>
                  <SelectItem value='shipped'>Kargoya Verildi</SelectItem>
                  <SelectItem value='delivered'>Teslim Edildi</SelectItem>
                  <SelectItem value='cancelled'>İptal Edildi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className='w-40'>
                  <SelectValue placeholder='Ödeme' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tüm Ödemeler</SelectItem>
                  <SelectItem value='pending'>Bekliyor</SelectItem>
                  <SelectItem value='partial'>Kısmi</SelectItem>
                  <SelectItem value='paid'>Ödendi</SelectItem>
                  <SelectItem value='refunded'>İade</SelectItem>
                </SelectContent>
              </Select>

              <Button variant='outline'>
                <Download className='h-4 w-4 mr-2' />
                Dışa Aktar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <OrdersTable
        orders={data?.orders || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onCancelOrder={handleCancelOrder}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      {/* Edit Order Dialog */}
      <AdvancedEditOrderDialog
        order={selectedOrderForEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={fetchOrders}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchOrders}
      />
    </div>
  );
}
