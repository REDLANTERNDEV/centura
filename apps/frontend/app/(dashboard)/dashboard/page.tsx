'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import OrganizationSelector from '@/components/OrganizationSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Building2,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import {
  getOrders,
  getCustomers,
  getProducts,
  getInsights,
  Order,
  Customer,
} from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { PaymentStatusBadge } from '@/components/orders/payment-status-badge';

export default function DashboardPage() {
  const { selectedOrganization } = useOrganization();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });

  // Fetch recent data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedOrganization) return;

      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [
          ordersResponse,
          customersResponse,
          productsResponse,
          insightsResponse,
        ] = await Promise.all([
          getOrders({ page: 1, limit: 5 }),
          getCustomers({ page: 1, limit: 5 }),
          getProducts({ page: 1, limit: 1 }), // Just for count
          getInsights(),
        ]);

        // Set recent orders
        if (ordersResponse.success && ordersResponse.data) {
          setRecentOrders(ordersResponse.data);
        }

        // Set recent customers
        if (customersResponse.success && customersResponse.data) {
          setRecentCustomers(customersResponse.data);
        }

        // Set stats from responses
        setStats({
          totalRevenue:
            insightsResponse?.data?.revenueAnalytics?.totalRevenue || 0,
          totalOrders: ordersResponse?.pagination?.total || 0,
          totalCustomers: customersResponse?.pagination?.total || 0,
          totalProducts: productsResponse?.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedOrganization]);

  // Organization selector is now handled by DashboardLayoutContent
  // This page only shows when an organization is selected
  if (!selectedOrganization) {
    return <OrganizationSelector />;
  }

  // Dashboard content
  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Welcome Message */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
        <div className='min-w-0'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            Tekrar hoş geldiniz! 👋
          </h1>
          <div className='flex items-center gap-2 mt-2 flex-wrap'>
            <Building2 className='h-4 w-4 text-muted-foreground shrink-0' />
            <p className='text-sm sm:text-base text-muted-foreground wrap-break-word'>
              Şu anda görüntülüyorsunuz:{' '}
              <span className='font-semibold text-foreground'>
                {selectedOrganization.name || selectedOrganization.org_name}
              </span>
              {selectedOrganization.role && (
                <span className='text-sm ml-2 text-muted-foreground'>
                  •{' '}
                  {selectedOrganization.role
                    .replace('org_', '')
                    .replace('_', ' ')
                    .charAt(0)
                    .toUpperCase() +
                    selectedOrganization.role
                      .replace('org_', '')
                      .replace('_', ' ')
                      .slice(1)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className='grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>
              Toplam Gelir
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-lg sm:text-2xl font-bold truncate'>
              ₺
              {stats.totalRevenue.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground'>
              Tüm zamanlar toplamı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>
              Siparişler
            </CardTitle>
            <ShoppingBag className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-lg sm:text-2xl font-bold'>
              {stats.totalOrders}
            </div>
            <p className='text-xs text-muted-foreground'>
              Toplam sipariş sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>
              Müşteriler
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-lg sm:text-2xl font-bold'>
              {stats.totalCustomers}
            </div>
            <p className='text-xs text-muted-foreground'>
              Kayıtlı müşteri sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>
              Ürünler
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-lg sm:text-2xl font-bold'>
              {stats.totalProducts}
            </div>
            <p className='text-xs text-muted-foreground'>Aktif ürün sayısı</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className='grid gap-3 sm:gap-4 lg:grid-cols-7'>
        <Card className='lg:col-span-4'>
          <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
            <CardTitle className='text-base sm:text-lg'>
              Son Siparişler
            </CardTitle>
            <Link href='/dashboard/orders'>
              <Button variant='ghost' size='sm' className='gap-1'>
                Tümünü Gör
                <ArrowRight className='h-4 w-4' />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className='text-sm text-muted-foreground'>Yükleniyor...</p>
            )}
            {!isLoading && recentOrders.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                Henüz sipariş yok. İlk siparişinizi oluşturarak başlayın.
              </p>
            )}
            {!isLoading && recentOrders.length > 0 && (
              <div className='space-y-3 sm:space-y-4'>
                {recentOrders.map(order => (
                  <div
                    key={order.id}
                    className='flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 last:border-0 last:pb-0 gap-2'
                  >
                    <div className='space-y-1 min-w-0'>
                      <Link
                        href={`/dashboard/orders`}
                        className='font-medium hover:underline text-sm sm:text-base truncate block'
                      >
                        {order.order_number}
                      </Link>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.payment_status} />
                      </div>
                    </div>
                    <div className='text-left sm:text-right shrink-0'>
                      <p className='font-semibold'>
                        ₺
                        {order.total.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(order.order_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className='lg:col-span-3'>
          <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
            <CardTitle className='text-base sm:text-lg'>
              Son Müşteriler
            </CardTitle>
            <Link href='/dashboard/customers'>
              <Button variant='ghost' size='sm' className='gap-1'>
                Tümünü Gör
                <ArrowRight className='h-4 w-4' />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className='text-sm text-muted-foreground'>Yükleniyor...</p>
            )}
            {!isLoading && recentCustomers.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                Henüz müşteri yok. Başlamak için ilk müşterinizi ekleyin.
              </p>
            )}
            {!isLoading && recentCustomers.length > 0 && (
              <div className='space-y-3 sm:space-y-4'>
                {recentCustomers.map(customer => {
                  // Translate customer type to Turkish
                  const customerTypeMap: Record<string, string> = {
                    Corporate: 'Kurumsal',
                    Individual: 'Bireysel',
                    Government: 'Kamu',
                    Other: 'Diğer',
                  };

                  return (
                    <div
                      key={customer.customer_id}
                      className='flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 last:border-0 last:pb-0 gap-2'
                    >
                      <div className='space-y-1 min-w-0'>
                        <Link
                          href={`/dashboard/customers`}
                          className='font-medium hover:underline text-sm sm:text-base truncate block'
                        >
                          {customer.name}
                        </Link>
                        <p className='text-xs text-muted-foreground truncate'>
                          {customer.email || 'Email yok'}
                        </p>
                      </div>
                      <div className='text-left sm:text-right shrink-0'>
                        <Badge variant='outline' className='text-xs'>
                          {customerTypeMap[
                            customer.customer_type || 'Individual'
                          ] || 'Bireysel'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Quick Link */}
      <Card className='border-primary/50 bg-linear-to-br from-primary/5 to-primary/10'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-start sm:items-center gap-3'>
              <div className='p-2 sm:p-3 rounded-lg bg-primary/10 shrink-0'>
                <BarChart3 className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
              </div>
              <div className='min-w-0'>
                <CardTitle className='text-base sm:text-lg'>
                  Gelişmiş Analitik ve İçgörüler
                </CardTitle>
                <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
                  Kapsamlı iş zekası, gelir trendleri ve performans metriklerini
                  keşfedin
                </p>
              </div>
            </div>
            <Link href='/dashboard/analytics' className='shrink-0'>
              <Button className='gap-2 w-full sm:w-auto'>
                Analitikleri Görüntüle
                <ArrowRight className='h-4 w-4' />
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
