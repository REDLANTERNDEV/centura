/**
 * Analytics Export Utilities
 * Helper functions for exporting analytics data
 */

import { format } from 'date-fns';

/**
 * Format analytics data for CSV export
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const rows: string[][] = [];

  // Add headers
  if (data.length > 0) {
    rows.push(Object.keys(data[0]));
  }

  // Add data rows
  for (const item of data) {
    rows.push(Object.values(item).map(String));
  }

  // Convert to CSV string
  const csvContent = rows.map(row => row.join(',')).join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Format analytics data for JSON export
 */
export function exportToJSON(
  data: Record<string, unknown>[],
  filename: string
) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num);
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Group data by time period
 */
export function groupByPeriod(
  data: Record<string, unknown>[],
  dateField: string,
  period: 'day' | 'week' | 'month' | 'year'
) {
  const grouped: { [key: string]: Record<string, unknown>[] } = {};

  for (const item of data) {
    const date = new Date(item[dateField] as string | number | Date);
    let key: string;

    switch (period) {
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(date, 'yyyy-ww');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'year':
        key = format(date, 'yyyy');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }

  return grouped;
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number
): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }

  return result;
}

/**
 * Get trend direction
 */
export function getTrendDirection(
  current: number,
  previous: number
): 'up' | 'down' | 'neutral' {
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return 'neutral';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * Calculate median from array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

/**
 * Get color based on performance
 */
export function getPerformanceColor(
  value: number,
  threshold: { good: number; warning: number }
): string {
  if (value >= threshold.good) return 'success';
  if (value >= threshold.warning) return 'warning';
  return 'danger';
}
