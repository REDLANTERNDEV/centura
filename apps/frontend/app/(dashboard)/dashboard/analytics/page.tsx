'use client';

/**
 * Analytics Dashboard Page
 * Industry-standard ERP/CRM analytics with comprehensive business intelligence
 * Features: Revenue tracking, Customer analytics, Sales performance, Inventory insights
 */

import { useEffect, useState } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Activity,
  ArrowUpRight,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart as RechartsAreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// Time period options for analytics
const TIME_PERIODS = [
  { value: '7d', label: 'Son 7 Gün' },
  { value: '30d', label: 'Son 30 Gün' },
  { value: '90d', label: 'Son 90 Gün' },
  { value: 'ytd', label: 'Yılbaşından Bugüne' },
  { value: 'all', label: 'Tüm Zamanlar' },
];

// Chart color configurations
const CHART_COLORS = {
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
  primary: 'hsl(var(--primary))',
  success: 'hsl(142, 71%, 45%)', // dark mode uyumlu
  warning: 'hsl(38, 92%, 50%)',
  danger: 'hsl(0, 72%, 51%)', // dark mode uyumlu
  info: 'hsl(199, 89%, 48%)',
  purple: 'hsl(271, 70%, 60%)', // dark mode uyumlu
  pink: 'hsl(330, 70%, 60%)', // dark mode uyumlu
  orange: 'hsl(25, 90%, 55%)', // dark mode uyumlu
  teal: 'hsl(173, 70%, 45%)', // dark mode uyumlu
  indigo: 'hsl(243, 70%, 62%)', // dark mode uyumlu
  lime: 'hsl(84, 75%, 48%)', // dark mode uyumlu
  cyan: 'hsl(189, 80%, 48%)', // dark mode uyumlu
  amber: 'hsl(38, 92%, 50%)',
  emerald: 'hsl(160, 75%, 42%)', // dark mode uyumlu
  rose: 'hsl(351, 80%, 65%)', // dark mode uyumlu
};

// Pie chart'lar için sabit renk paleti
const PIE_COLORS = [
  'hsl(271, 70%, 60%)', // purple
  'hsl(199, 89%, 48%)', // info/blue
  'hsl(142, 71%, 45%)', // success/green
  'hsl(25, 90%, 55%)', // orange
  'hsl(330, 70%, 60%)', // pink
  'hsl(173, 70%, 45%)', // teal
  'hsl(0, 72%, 51%)', // danger/red
  'hsl(243, 70%, 62%)', // indigo
  'hsl(38, 92%, 50%)', // warning/amber
  'hsl(84, 75%, 48%)', // lime
  'hsl(189, 80%, 48%)', // cyan
  'hsl(160, 75%, 42%)', // emerald
  'hsl(351, 80%, 65%)', // rose
];

// Mock data generator for development
function getMockAnalyticsData(): AnalyticsData {
  return {
    revenueMetrics: {
      totalRevenue: 1250000,
      periodRevenue: 285000,
      previousPeriodRevenue: 245000,
      growthRate: 16.3,
      averageOrderValue: 5700,
      totalOrders: 50,
      revenueByStatus: [
        { status: 'Completed', amount: 220000, percentage: 77.2 },
        { status: 'Pending', amount: 45000, percentage: 15.8 },
        { status: 'Processing', amount: 20000, percentage: 7 },
      ],
    },
    customerMetrics: {
      totalCustomers: 156,
      newCustomers: 23,
      activeCustomers: 89,
      customerRetentionRate: 87.5,
      topCustomers: [
        {
          id: 1,
          name: 'Acme Corporation',
          totalRevenue: 45000,
          orderCount: 12,
        },
        { id: 2, name: 'TechStart Inc', totalRevenue: 38500, orderCount: 8 },
        {
          id: 3,
          name: 'Global Solutions',
          totalRevenue: 32000,
          orderCount: 15,
        },
        { id: 4, name: 'Innovation Labs', totalRevenue: 28500, orderCount: 6 },
        {
          id: 5,
          name: 'Digital Dynamics',
          totalRevenue: 25000,
          orderCount: 10,
        },
      ],
      segmentation: [
        { segment: 'VIP', count: 15, revenue: 125000, percentage: 9.6 },
        { segment: 'Premium', count: 34, revenue: 95000, percentage: 21.8 },
        { segment: 'Standard', count: 67, revenue: 52000, percentage: 42.9 },
        { segment: 'Basic', count: 40, revenue: 13000, percentage: 25.6 },
      ],
    },
    salesMetrics: {
      monthlySales: [
        { month: 'Jan', revenue: 185000, orders: 35, customers: 28 },
        { month: 'Feb', revenue: 220000, orders: 42, customers: 35 },
        { month: 'Mar', revenue: 245000, orders: 48, customers: 38 },
        { month: 'Apr', revenue: 265000, orders: 52, customers: 42 },
        { month: 'May', revenue: 285000, orders: 58, customers: 45 },
        { month: 'Jun', revenue: 310000, orders: 62, customers: 48 },
      ],
      categoryPerformance: [
        {
          category: 'Electronics',
          revenue: 125000,
          quantity: 450,
          growthRate: 18.5,
        },
        {
          category: 'Software',
          revenue: 95000,
          quantity: 230,
          growthRate: 22.3,
        },
        {
          category: 'Services',
          revenue: 45000,
          quantity: 120,
          growthRate: 12.7,
        },
        {
          category: 'Accessories',
          revenue: 20000,
          quantity: 380,
          growthRate: 8.2,
        },
      ],
      topProducts: [
        {
          id: 1,
          name: 'Premium Laptop',
          revenue: 85000,
          quantity: 45,
          category: 'Electronics',
        },
        {
          id: 2,
          name: 'Pro Software Suite',
          revenue: 65000,
          quantity: 130,
          category: 'Software',
        },
        {
          id: 3,
          name: 'Consulting Package',
          revenue: 42000,
          quantity: 28,
          category: 'Services',
        },
        {
          id: 4,
          name: 'Wireless Mouse',
          revenue: 12000,
          quantity: 240,
          category: 'Accessories',
        },
        {
          id: 5,
          name: 'Monitor 27"',
          revenue: 38000,
          quantity: 52,
          category: 'Electronics',
        },
      ],
    },
    inventoryMetrics: {
      totalProducts: 248,
      lowStockItems: 18,
      outOfStockItems: 5,
      inventoryValue: 458000,
      turnoverRate: 4.2,
      stockHealth: [
        { status: 'In Stock', count: 225, percentage: 90.7 },
        { status: 'Low Stock', count: 18, percentage: 7.3 },
        { status: 'Out of Stock', count: 5, percentage: 2 },
      ],
    },
    orderMetrics: {
      totalOrders: 248,
      pendingOrders: 12,
      completedOrders: 215,
      cancelledOrders: 21,
      fulfillmentRate: 86.7,
      averageProcessingTime: 2.4,
      ordersByStatus: [
        { status: 'Completed', count: 215, percentage: 86.7 },
        { status: 'Processing', count: 12, percentage: 4.8 },
        { status: 'Pending', count: 12, percentage: 4.8 },
        { status: 'Cancelled', count: 9, percentage: 3.6 },
      ],
    },
    growthMetrics: {
      revenueGrowth: 16.3,
      customerGrowth: 12.8,
      orderGrowth: 14.5,
      monthOverMonthComparison: [
        { metric: 'Revenue', current: 285000, previous: 245000, change: 16.3 },
        { metric: 'Orders', current: 58, previous: 48, change: 20.8 },
        { metric: 'Customers', current: 45, previous: 38, change: 18.4 },
      ],
    },
  };
}

interface AnalyticsData {
  revenueMetrics: {
    totalRevenue: number;
    periodRevenue: number;
    previousPeriodRevenue: number;
    growthRate: number;
    averageOrderValue: number;
    totalOrders: number;
    revenueByStatus: Array<{
      status: string;
      amount: number;
      percentage: number;
    }>;
  };
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    customerRetentionRate: number;
    topCustomers: Array<{
      id: number;
      name: string;
      totalRevenue: number;
      orderCount: number;
    }>;
    segmentation: Array<{
      segment: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
  };
  salesMetrics: {
    monthlySales: Array<{
      month: string;
      revenue: number;
      orders: number;
      customers: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      revenue: number;
      quantity: number;
      growthRate: number;
    }>;
    topProducts: Array<{
      id: number;
      name: string;
      revenue: number;
      quantity: number;
      category: string;
    }>;
  };
  inventoryMetrics: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    inventoryValue: number;
    turnoverRate: number;
    stockHealth: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };
  orderMetrics: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    fulfillmentRate: number;
    averageProcessingTime: number;
    ordersByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };
  growthMetrics: {
    revenueGrowth: number;
    customerGrowth: number;
    orderGrowth: number;
    monthOverMonthComparison: Array<{
      metric: string;
      current: number;
      previous: number;
      change: number;
    }>;
  };
}

// Transform backend data structure to match frontend expectations
function transformBackendData(backendData: any): AnalyticsData {
  return {
    revenueMetrics: {
      totalRevenue: backendData.revenueAnalytics?.totalRevenue || 0,
      periodRevenue: backendData.revenueAnalytics?.totalRevenue || 0,
      previousPeriodRevenue:
        backendData.revenueAnalytics?.previousPeriodRevenue || 0,
      growthRate: backendData.growthMetrics?.monthOverMonth?.revenueGrowth || 0,
      averageOrderValue: backendData.revenueAnalytics?.averageOrderValue || 0,
      totalOrders: backendData.revenueAnalytics?.totalOrders || 0,
      revenueByStatus: (backendData.orderAnalytics?.byStatus || []).map(
        (item: any) => ({
          status: item.status,
          amount: item.totalValue || item.totalRevenue || 0,
          percentage: item.percentage || 0,
        })
      ),
    },
    customerMetrics: {
      totalCustomers:
        backendData.customerAnalytics?.summary?.totalCustomers || 0,
      newCustomers: backendData.customerAnalytics?.summary?.newCustomers || 0,
      activeCustomers:
        backendData.customerAnalytics?.summary?.totalCustomers || 0, // Backend'de activeCustomers yok, totalCustomers kullan
      customerRetentionRate:
        backendData.customerAnalytics?.summary?.retentionRate || 0,
      topCustomers: (backendData.salesPerformance?.topCustomers || []).map(
        (customer: any) => ({
          id: customer.customerId || customer.customer_id,
          name:
            customer.name || customer.customerName || customer.customer_name,
          totalRevenue:
            customer.totalSales ||
            customer.total_revenue ||
            customer.totalRevenue ||
            0,
          orderCount:
            customer.totalOrders ||
            customer.order_count ||
            customer.orderCount ||
            0,
        })
      ),
      segmentation: (backendData.customerAnalytics?.segments || []).map(
        (segment: any) => ({
          segment: segment.segment,
          count: segment.customerCount || segment.count || 0,
          revenue: segment.totalRevenue || segment.revenue || 0,
          percentage: Number.parseFloat(
            segment.customerShare ||
              segment.revenueShare ||
              segment.percentage ||
              0
          ),
        })
      ),
    },
    salesMetrics: {
      monthlySales: (backendData.salesPerformance?.monthlySales || []).map(
        (month: any) => ({
          month: month.month,
          revenue: month.totalSales || month.revenue || 0,
          orders: month.totalOrders || month.orders || 0,
          customers: month.uniqueCustomers || month.customers || 0,
        })
      ),
      categoryPerformance: (
        backendData.salesPerformance?.categoryPerformance || []
      ).map((cat: any) => ({
        category: cat.category || 'Uncategorized',
        revenue: cat.totalRevenue || cat.revenue || 0,
        quantity: cat.totalUnitsSold || cat.totalQuantity || cat.quantity || 0,
        growthRate: cat.growthRate || 0,
      })),
      topProducts: (backendData.salesPerformance?.topProducts || []).map(
        (product: any) => ({
          id: product.productId || product.product_id,
          name: product.name || product.productName || product.product_name,
          revenue: product.totalRevenue || product.total_revenue || 0,
          quantity:
            product.totalQuantitySold ||
            product.quantitySold ||
            product.quantity_sold ||
            0,
          category: product.category || 'Uncategorized',
        })
      ),
    },
    inventoryMetrics: {
      totalProducts: backendData.inventoryInsights?.totalProducts || 0,
      lowStockItems: backendData.inventoryInsights?.lowStockProducts || 0,
      outOfStockItems: backendData.inventoryInsights?.outOfStockProducts || 0,
      inventoryValue: backendData.inventoryInsights?.totalInventoryValue || 0,
      turnoverRate: backendData.inventoryInsights?.turnoverRate || 0,
      stockHealth: [
        {
          status: 'In Stock',
          count: backendData.inventoryInsights?.activeProducts || 0,
          percentage: backendData.inventoryInsights?.totalProducts
            ? (backendData.inventoryInsights.activeProducts /
                backendData.inventoryInsights.totalProducts) *
              100
            : 0,
        },
        {
          status: 'Low Stock',
          count: backendData.inventoryInsights?.lowStockProducts || 0,
          percentage: backendData.inventoryInsights?.totalProducts
            ? (backendData.inventoryInsights.lowStockProducts /
                backendData.inventoryInsights.totalProducts) *
              100
            : 0,
        },
        {
          status: 'Out of Stock',
          count: backendData.inventoryInsights?.outOfStockProducts || 0,
          percentage: backendData.inventoryInsights?.totalProducts
            ? (backendData.inventoryInsights.outOfStockProducts /
                backendData.inventoryInsights.totalProducts) *
              100
            : 0,
        },
      ],
    },
    orderMetrics: {
      totalOrders: backendData.revenueAnalytics?.totalOrders || 0,
      pendingOrders:
        (backendData.orderAnalytics?.byStatus || []).find(
          (s: any) => s.status === 'pending'
        )?.count || 0,
      completedOrders:
        (backendData.orderAnalytics?.byStatus || []).find(
          (s: any) => s.status === 'completed'
        )?.count || 0,
      cancelledOrders:
        (backendData.orderAnalytics?.byStatus || []).find(
          (s: any) => s.status === 'cancelled'
        )?.count || 0,
      fulfillmentRate: backendData.orderAnalytics?.fulfillmentRate || 0,
      averageProcessingTime:
        backendData.orderAnalytics?.averageProcessingTime || 0,
      ordersByStatus: (backendData.orderAnalytics?.byStatus || []).map(
        (status: any) => ({
          status: status.status,
          count: status.count || 0,
          percentage: status.percentage || 0,
        })
      ),
    },
    growthMetrics: {
      revenueGrowth:
        backendData.growthMetrics?.monthOverMonth?.revenueGrowth || 0,
      customerGrowth:
        backendData.growthMetrics?.monthOverMonth?.customerGrowth || 0,
      orderGrowth: backendData.growthMetrics?.monthOverMonth?.orderGrowth || 0,
      monthOverMonthComparison: [
        {
          metric: 'Revenue',
          current: backendData.revenueAnalytics?.totalRevenue || 0,
          previous: backendData.revenueAnalytics?.previousPeriodRevenue || 0,
          change: backendData.growthMetrics?.monthOverMonth?.revenueGrowth || 0,
        },
        {
          metric: 'Orders',
          current: backendData.revenueAnalytics?.totalOrders || 0,
          previous: backendData.revenueAnalytics?.previousPeriodOrders || 0,
          change: backendData.growthMetrics?.monthOverMonth?.orderGrowth || 0,
        },
        {
          metric: 'Customers',
          current: backendData.customerAnalytics?.summary?.totalCustomers || 0,
          previous:
            backendData.customerAnalytics?.summary?.previousPeriodCustomers ||
            0,
          change:
            backendData.growthMetrics?.monthOverMonth?.customerGrowth || 0,
        },
      ],
    },
  };
}

export default function AnalyticsPage() {
  const { selectedOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [timePeriod, setTimePeriod] = useState('30d');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    if (!selectedOrganization) return;

    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiClient.get('/insights', {
        params: {
          period: timePeriod,
        },
      });

      // Check if response has the expected structure
      if (response.data?.data) {
        const transformedData = transformBackendData(response.data.data);
        setAnalyticsData(transformedData);
      } else if (response.data) {
        // If data is at root level instead of nested
        const transformedData = transformBackendData(response.data);
        setAnalyticsData(transformedData);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch {
      // Use mock data for development if API is not available
      setAnalyticsData(getMockAnalyticsData());
      setError(null); // Clear error since we're using mock data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedOrganization, timePeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  if (!selectedOrganization) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-semibold'>No Organization Selected</h3>
          <p className='text-muted-foreground'>
            Please select an organization to view analytics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-9 w-64' />
          <Skeleton className='h-10 w-40' />
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
        <Skeleton className='h-96' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-destructive mx-auto mb-4' />
          <h3 className='text-lg font-semibold'>Analiz Verisi Yüklenemedi</h3>
          <p className='text-muted-foreground mb-4'>{error}</p>
          <Button onClick={() => fetchAnalytics()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  // Handle case where data or its nested properties are not yet loaded
  if (!analyticsData?.revenueMetrics) {
    // If still loading, show skeleton, otherwise show No Data message
    if (loading) {
      return (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-9 w-64' />
            <Skeleton className='h-10 w-40' />
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className='h-32' />
            ))}
          </div>
          <Skeleton className='h-96' />
        </div>
      );
    }

    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-semibold'>Veri Bulunamadı</h3>
          <p className='text-muted-foreground mb-4'>
            Analitik verileri yüklenemiyor. Lütfen tekrar deneyin.
          </p>
          <Button onClick={() => fetchAnalytics()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Veriyi Yükle
          </Button>
        </div>
      </div>
    );
  }

  const data = analyticsData;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Analitik & İstatistikler
          </h1>
          <p className='text-muted-foreground'>
            {selectedOrganization.name || selectedOrganization.org_name} için
            kapsamlı iş zekası
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className='w-[180px]'>
              <Calendar className='mr-2 h-4 w-4' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='icon'
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Revenue */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Toplam Gelir</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(data.revenueMetrics.periodRevenue)}
            </div>
            <div className='flex items-center text-xs mt-1'>
              {data.revenueMetrics.growthRate >= 0 ? (
                <TrendingUp className='mr-1 h-3 w-3 text-green-600' />
              ) : (
                <TrendingDown className='mr-1 h-3 w-3 text-red-600' />
              )}
              <span
                className={
                  data.revenueMetrics.growthRate >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {formatPercentage(data.revenueMetrics.growthRate)}
              </span>
              <span className='text-muted-foreground ml-1'>
                önceki döneme göre
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Toplam Sipariş
            </CardTitle>
            <ShoppingCart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(data.orderMetrics.totalOrders)}
            </div>
            <div className='flex items-center text-xs mt-1'>
              {data.growthMetrics.orderGrowth >= 0 ? (
                <TrendingUp className='mr-1 h-3 w-3 text-green-600' />
              ) : (
                <TrendingDown className='mr-1 h-3 w-3 text-red-600' />
              )}
              <span
                className={
                  data.growthMetrics.orderGrowth >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {formatPercentage(data.growthMetrics.orderGrowth)}
              </span>
              <span className='text-muted-foreground ml-1'>
                önceki döneme göre
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Active Customers */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Aktif Müşteri</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(data.customerMetrics.activeCustomers)}
            </div>
            <div className='flex items-center text-xs mt-1'>
              <span className='text-muted-foreground'>
                {data.customerMetrics.newCustomers} yeni müşteri
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Ort. Sipariş Değeri
            </CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(data.revenueMetrics.averageOrderValue)}
            </div>
            <div className='flex items-center text-xs mt-1'>
              <span className='text-muted-foreground'>
                %{data.orderMetrics.fulfillmentRate.toFixed(1)} tamamlanma oranı
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>
            <Activity className='mr-2 h-4 w-4' />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value='revenue'>
            <DollarSign className='mr-2 h-4 w-4' />
            Gelir
          </TabsTrigger>
          <TabsTrigger value='sales'>
            <BarChart3 className='mr-2 h-4 w-4' />
            Satışlar
          </TabsTrigger>
          <TabsTrigger value='customers'>
            <Users className='mr-2 h-4 w-4' />
            Müşteriler
          </TabsTrigger>
          <TabsTrigger value='inventory'>
            <Package className='mr-2 h-4 w-4' />
            Envanter
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Monthly Sales Trend */}
            <Card className='col-span-2'>
              <CardHeader>
                <CardTitle>Satış Trendi</CardTitle>
                <CardDescription>
                  Aylık gelir ve sipariş performansı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: 'Gelir',
                      color: CHART_COLORS.primary,
                    },
                    orders: {
                      label: 'Siparişler',
                      color: CHART_COLORS.chart2,
                    },
                  }}
                  className='h-[300px]'
                >
                  <RechartsLineChart data={data.salesMetrics.monthlySales}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis yAxisId='left' />
                    <YAxis yAxisId='right' orientation='right' />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='revenue'
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId='right'
                      type='monotone'
                      dataKey='orders'
                      stroke={CHART_COLORS.chart2}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Durumu</CardTitle>
                <CardDescription>
                  Siparişlerin duruma göre dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: 'Siparişler',
                    },
                  }}
                  className='h-[250px]'
                >
                  <RechartsPieChart>
                    <Pie
                      data={data.orderMetrics.ordersByStatus}
                      dataKey='count'
                      nameKey='status'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label
                    >
                      {data.orderMetrics.ordersByStatus.map((entry, index) => (
                        <Cell
                          key={entry.status}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>En Çok Satan Ürünler</CardTitle>
                <CardDescription>
                  Gelire göre en iyi performans gösterenler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {data.salesMetrics.topProducts
                    .slice(0, 5)
                    .map((product, index) => (
                      <div
                        key={`top-product-${product.id}-${index}`}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm'>
                            {index + 1}
                          </div>
                          <div>
                            <p className='font-medium text-sm'>
                              {product.name}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold text-sm'>
                            {formatCurrency(product.revenue)}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {product.quantity} sold
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value='revenue' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Toplam Gelir
                </CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatCurrency(data.revenueMetrics.totalRevenue)}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Tüm zamanlar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Dönem Geliri
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatCurrency(data.revenueMetrics.periodRevenue)}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Seçili dönem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Büyüme Oranı
                </CardTitle>
                {data.revenueMetrics.growthRate >= 0 ? (
                  <TrendingUp className='h-4 w-4 text-green-600' />
                ) : (
                  <TrendingDown className='h-4 w-4 text-red-600' />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    data.revenueMetrics.growthRate >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatPercentage(data.revenueMetrics.growthRate)}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  önceki döneme göre
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Duruma Göre Gelir</CardTitle>
              <CardDescription>
                Sipariş durumlarına göre gelir dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: 'Gelir',
                    color: CHART_COLORS.primary,
                  },
                }}
                className='h-[300px]'
              >
                <RechartsBarChart data={data.revenueMetrics.revenueByStatus}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='status' />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey='amount' radius={[8, 8, 0, 0]}>
                    {data.revenueMetrics.revenueByStatus.map((entry, index) => (
                      <Cell
                        key={`revenue-cell-${entry.status}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value='sales' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Kategori Performansı</CardTitle>
              <CardDescription>
                Ürün kategorisine göre gelir ve büyüme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: 'Gelir',
                    color: CHART_COLORS.primary,
                  },
                  quantity: {
                    label: 'Satılan Miktar',
                    color: CHART_COLORS.chart2,
                  },
                }}
                className='h-[300px]'
              >
                <RechartsBarChart data={data.salesMetrics.categoryPerformance}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='category' />
                  <YAxis yAxisId='left' />
                  <YAxis yAxisId='right' orientation='right' />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId='left' dataKey='revenue' radius={[8, 8, 0, 0]}>
                    {data.salesMetrics.categoryPerformance.map(
                      (entry, index) => (
                        <Cell
                          key={`category-revenue-${entry.category}-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      )
                    )}
                  </Bar>
                  <Bar yAxisId='right' dataKey='quantity' radius={[8, 8, 0, 0]}>
                    {data.salesMetrics.categoryPerformance.map(
                      (entry, index) => (
                        <Cell
                          key={`category-quantity-${entry.category}-${index}`}
                          fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]}
                          opacity={0.7}
                        />
                      )
                    )}
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Aylık Satış Performansı</CardTitle>
                <CardDescription>Zaman içindeki gelir trendi</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: 'Gelir',
                      color: CHART_COLORS.primary,
                    },
                  }}
                  className='h-[250px]'
                >
                  <RechartsAreaChart data={data.salesMetrics.monthlySales}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.2}
                    />
                  </RechartsAreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En İyi Ürün Performansı</CardTitle>
                <CardDescription>En yüksek gelir oluşturanlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {data.salesMetrics.topProducts
                    .slice(0, 5)
                    .map((product, index) => (
                      <div
                        key={`sales-product-${product.id}-${index}`}
                        className='flex items-center gap-3'
                      >
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold'>
                          {index + 1}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium truncate'>{product.name}</p>
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Badge variant='outline' className='text-xs'>
                              {product.category}
                            </Badge>
                            <span>{product.quantity} adet</span>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold'>
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value='customers' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Toplam Müşteri
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatNumber(data.customerMetrics.totalCustomers)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Aktif Müşteri
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatNumber(data.customerMetrics.activeCustomers)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Yeni Müşteri
                </CardTitle>
                <ArrowUpRight className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatNumber(data.customerMetrics.newCustomers)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Elde Tutma Oranı
                </CardTitle>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  %{data.customerMetrics.customerRetentionRate.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Segmentasyonu</CardTitle>
                <CardDescription>
                  Davranış ve değere göre müşteri grupları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: 'Müşteriler',
                    },
                  }}
                  className='h-[300px]'
                >
                  <RechartsPieChart>
                    <Pie
                      data={data.customerMetrics.segmentation}
                      dataKey='count'
                      nameKey='segment'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label={({
                        segment,
                        percentage,
                      }: {
                        segment: string;
                        percentage: number;
                      }) => `${segment} (%${percentage.toFixed(0)})`}
                    >
                      {data.customerMetrics.segmentation.map((entry, index) => (
                        <Cell
                          key={entry.segment}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En İyi Müşteriler</CardTitle>
                <CardDescription>
                  Gelire göre en değerli müşteriler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {data.customerMetrics.topCustomers.map((customer, index) => (
                    <div
                      key={`customer-${customer.id}-${index}`}
                      className='flex items-center gap-3'
                    >
                      <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold'>
                        {index + 1}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{customer.name}</p>
                        <p className='text-sm text-muted-foreground'>
                          {customer.orderCount} sipariş
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold'>
                          {formatCurrency(customer.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value='inventory' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Toplam Ürün
                </CardTitle>
                <Package className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatNumber(data.inventoryMetrics.totalProducts)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Düşük Stok
                </CardTitle>
                <AlertCircle className='h-4 w-4 text-warning' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-warning'>
                  {formatNumber(data.inventoryMetrics.lowStockItems)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Stokta Yok
                </CardTitle>
                <AlertCircle className='h-4 w-4 text-destructive' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-destructive'>
                  {formatNumber(data.inventoryMetrics.outOfStockItems)}
                </div>
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
                  {formatCurrency(data.inventoryMetrics.inventoryValue)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stok Sağlığı Dağılımı</CardTitle>
              <CardDescription>Envanter durumu genel bakış</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Ürünler',
                  },
                }}
                className='h-[300px]'
              >
                <RechartsBarChart data={data.inventoryMetrics.stockHealth}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='status' />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey='count' radius={[8, 8, 0, 0]}>
                    {data.inventoryMetrics.stockHealth.map(entry => {
                      const getStatusColor = (status: string) => {
                        if (status === 'In Stock') return CHART_COLORS.success;
                        if (status === 'Low Stock') return CHART_COLORS.warning;
                        return CHART_COLORS.danger;
                      };

                      return (
                        <Cell
                          key={entry.status}
                          fill={getStatusColor(entry.status)}
                        />
                      );
                    })}
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
