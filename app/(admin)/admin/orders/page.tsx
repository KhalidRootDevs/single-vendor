'use client';

import { DataTable } from '@/components/tables/data-table';
import { createOrderColumns } from '@/components/tables/order/columns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Order, PaginationInfo } from '@/types';
import { RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const paymentFilter = searchParams.get('paymentStatus') || 'all';
  const currentPage = Number.parseInt(searchParams.get('page') || '1');
  const currentPageSize = Number.parseInt(searchParams.get('pageSize') || '10');

  const isFetchingRef = useRef(false);

  const fetchOrders = useCallback(
    async (page: number, pageSize: number) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString()
        });

        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (paymentFilter && paymentFilter !== 'all') {
          params.append('paymentStatus', paymentFilter);
        }

        const response = await fetch(`/api/admin/orders?${params}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
          setPagination(
            data.pagination || {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          );
        } else {
          throw new Error('Failed to fetch orders');
        }
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load orders',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [searchTerm, statusFilter, paymentFilter]
  );

  useEffect(() => {
    fetchOrders(currentPage, currentPageSize);
  }, [fetchOrders, currentPage, currentPageSize]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(currentPage, currentPageSize);
  };

  const handleStatusUpdate = async (
    orderId: string,
    currentStatus: string,
    orderNumber: string
  ) => {
    // Implement order status update logic here
    toast({
      title: 'Update Status',
      description: `Update status for order ${orderNumber}`
    });
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to cancel order "${orderNumber}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: 'Order cancelled',
          description: `Order "${orderNumber}" has been cancelled successfully.`
        });
        fetchOrders(currentPage, currentPageSize);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to cancel order. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const columns = createOrderColumns({
    onStatusUpdate: handleStatusUpdate,
    onDeleteOrder: handleDeleteOrder
  });

  const filterOptions = [
    {
      label: 'Status',
      name: 'status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' }
      ]
    },
    {
      label: 'Payment Status',
      name: 'paymentStatus',
      options: [
        { value: 'all', label: 'All Payments' },
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            View and manage customer orders.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            Track and update order status and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            search={true}
            searchPlaceholder="Search orders..."
            filters={filterOptions}
            loading={isLoading}
            paginationData={{
              total: pagination.total,
              pageCount: pagination.totalPages,
              page: pagination.page,
              pageSize: pagination.limit
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
