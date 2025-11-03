/**
 * Customers Page
 * Professional customer management for CRM/ERP system
 * Industry-standard features including advanced filtering, segmentation, and analytics
 */

/* eslint-disable no-console */
'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { getCustomers, Customer, getRevenueMetrics } from '@/lib/api-client';
import { CustomersTable } from '@/components/customers/customers-table';
import { CustomerDetailsDialog } from '@/components/customers/customer-details-dialog';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';
import { CreateCustomerDialog } from '@/components/customers/create-customer-dialog';
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
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomersPageData {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const { selectedOrganization } = useOrganization();
  const [data, setData] = useState<CustomersPageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Edit dialog state
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] =
    useState<Customer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    vip: 0,
    revenue: 0,
  });

  /**
   * Fetch customers from API
   */
  const fetchCustomers = async () => {
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
      if (segmentFilter !== 'all') filters.segment = segmentFilter;
      if (typeFilter !== 'all') filters.customer_type = typeFilter;
      if (statusFilter !== 'all') filters.is_active = statusFilter === 'active';

      const response = await getCustomers(filters);

      setData({
        customers: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      // Calculate stats
      const customers = response.data || [];

      // Fetch revenue metrics from backend
      let revenueAmount = 0;
      try {
        const revenueMetrics = await getRevenueMetrics();
        revenueAmount = revenueMetrics.totalRevenue || 0;
      } catch (error: any) {
        console.error('Could not fetch revenue metrics:', error);
      }

      setStats({
        total: response.pagination?.total || 0,
        active: customers.filter((c: Customer) => c.is_active).length,
        vip: customers.filter((c: Customer) => c.segment === 'VIP').length,
        revenue: revenueAmount,
      });
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Müşteriler yüklenemedi', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
      setData({
        customers: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle customer view details
   */
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  /**
   * Handle customer edit
   */
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomerForEdit(customer);
    setIsEditOpen(true);
  };

  /**
   * Handle customer delete
   */
  const handleDeleteCustomer = async () => {
    toast.info('Silme özelliği yakında eklenecek');
  };

  /**
   * Handle customer successfully created/updated
   */
  const handleCustomerChange = () => {
    fetchCustomers();
  };

  /**
   * Handle search submit
   */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers();
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Handle export customers
   */
  const handleExport = () => {
    toast.info('Dışa aktarma özelliği yakında eklenecek');
  };

  // Fetch customers on mount and when dependencies change
  useEffect(() => {
    if (selectedOrganization) {
      fetchCustomers();
    }
  }, [
    selectedOrganization,
    currentPage,
    segmentFilter,
    typeFilter,
    statusFilter,
  ]);

  if (!selectedOrganization) {
    return (
      <div className='flex items-center justify-center h-96'>
        <p className='text-muted-foreground'>
          Müşterileri görüntülemek için lütfen bir organizasyon seçin.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <Users className='h-8 w-8' />
            Müşteri Yönetimi
          </h1>
          <p className='text-muted-foreground mt-2'>
            Müşteri ilişkilerinizi yönetin ve etkileşimleri takip edin
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={fetchCustomers}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Yenile
          </Button>
          <Button variant='outline' size='sm' onClick={handleExport}>
            <Download className='h-4 w-4 mr-2' />
            Dışa Aktar
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Müşteri Ekle
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Toplam Müşteri
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>
              Kayıtlı tüm müşteriler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Aktif Müşteriler
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.active}</div>
            <p className='text-xs text-muted-foreground'>
              Şu anda aktif hesaplar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              VIP Müşteriler
            </CardTitle>
            <UserPlus className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.vip}</div>
            <p className='text-xs text-muted-foreground'>
              Üst düzey müşteriler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Toplam Gelir</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₺{stats.revenue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Yaşam boyu değer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filtreler ve Arama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
            {/* Search */}
            <div className='lg:col-span-2'>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='İsim, email, telefon ile arama yapın...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className='pl-9'
                  />
                </div>
                <Button onClick={handleSearch}>Ara</Button>
              </div>
            </div>

            {/* Segment Filter */}
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Tüm Segmentler' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tüm Segmentler</SelectItem>
                <SelectItem value='VIP'>VIP</SelectItem>
                <SelectItem value='Premium'>Premium</SelectItem>
                <SelectItem value='Standard'>Standart</SelectItem>
                <SelectItem value='Basic'>Temel</SelectItem>
                <SelectItem value='Potential'>Potansiyel</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Tüm Tipler' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tüm Tipler</SelectItem>
                <SelectItem value='Corporate'>Kurumsal</SelectItem>
                <SelectItem value='Individual'>Bireysel</SelectItem>
                <SelectItem value='Government'>Devlet</SelectItem>
                <SelectItem value='Other'>Diğer</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Tüm Durumlar' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tüm Durumlar</SelectItem>
                <SelectItem value='active'>Aktif</SelectItem>
                <SelectItem value='inactive'>Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            Müşteriler ({data?.pagination?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersTable
            customers={data?.customers || []}
            isLoading={isLoading}
            onView={handleViewCustomer}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EditCustomerDialog
        customer={selectedCustomerForEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleCustomerChange}
      />

      <CreateCustomerDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCustomerChange}
      />
    </div>
  );
}
