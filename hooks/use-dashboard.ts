'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DashboardStats {
  revenue: { current: number; previous: number; changePercent: number };
  orders: {
    current: number;
    previous: number;
    changePercent: number;
    pending: number;
  };
  products: {
    total: number;
    active: number;
    newThisMonth: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: { current: number; previous: number; changePercent: number };
  avgOrderValue: { current: number; previous: number; changePercent: number };
}

export interface MonthlyPoint {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface HourlyPoint {
  hour: string;
  orders: number;
}

export interface PiePoint {
  name: string;
  value: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

export interface RecentOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  date: string;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  charts: {
    revenueByMonth: MonthlyPoint[];
    ordersByHour: HourlyPoint[];
    topProductsPie: PiePoint[];
  };
  lists: {
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
    customerSegments: CustomerSegment[];
  };
}

export function useDashboard(range: string = '30d') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${range}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, isLoading, error, refetch: fetch_ };
}
