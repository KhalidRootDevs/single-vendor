'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Eye, Search, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';

interface Payment {
  _id: string;
  orderNumber: string;
  transactionId: string | null;
  customer: { name: string; email: string };
  date: string;
  amount: number;
  refundedAmount: number | null;
  paymentMethod: string;
  paymentStatus: string;
  cardDetails: { brand: string; last4: string } | null;
  orderStatus: string;
}

interface Totals {
  collected: number;
  refunded: number;
  net: number;
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800'
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded'
};

const METHOD_LABEL: Record<string, string> = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
  cash_on_delivery: 'Cash on Delivery'
};

const money = (n: number) =>
  `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export default function PaymentsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<Totals>({
    collected: 0,
    refunded: 0,
    net: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const buildParams = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      params.set('page', String(page));
      Object.entries(overrides).forEach(([k, v]) => params.set(k, v));
      return params;
    },
    [search, statusFilter, methodFilter, page]
  );

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments?${buildParams()}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load payments');

      setPayments(data.payments);
      setTotals(data.totals);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const exportReport = async () => {
    setIsExporting(true);
    try {
      // Export everything matching the current filters, not just this page.
      const res = await fetch(
        `/api/admin/payments?${buildParams({ page: '1', limit: '500' })}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Export failed');

      const rows: string[][] = [
        [
          'Order',
          'Transaction ID',
          'Customer',
          'Email',
          'Date',
          'Amount',
          'Refunded',
          'Method',
          'Status'
        ],
        ...data.payments.map((p: Payment) => [
          p.orderNumber,
          p.transactionId ?? '',
          p.customer.name,
          p.customer.email,
          new Date(p.date).toISOString(),
          p.amount.toFixed(2),
          p.refundedAmount ? p.refundedAmount.toFixed(2) : '',
          METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod,
          STATUS_LABEL[p.paymentStatus] ?? p.paymentStatus
        ])
      ];

      const csv = rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Report exported',
        description: `${data.payments.length} transactions written to CSV.`
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
            <p className="text-muted-foreground">
              View and manage all payment transactions.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={exportReport}
            disabled={isExporting || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchPayments}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Totals cover every transaction matching the current filters, not
            just the visible page. */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {money(totals.collected)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {total} transaction{total === 1 ? '' : 's'} matched
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {money(totals.refunded)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Returned to customers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">{money(totals.net)}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Collected less refunds
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>
              Track and manage all payment transactions and their status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search order, customer, or transaction..."
                  className="h-9 pl-8"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={methodFilter}
                  onValueChange={(v) => {
                    setMethodFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash_on_delivery">
                      Cash on Delivery
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={8}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No payments found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/orders/${payment._id}`}
                            className="text-primary hover:underline"
                          >
                            {payment.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[160px]">
                          {payment.transactionId ? (
                            <span
                              className="block truncate font-mono text-xs"
                              title={payment.transactionId}
                            >
                              {payment.transactionId}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{payment.customer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {payment.customer.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{money(payment.amount)}</span>
                            {payment.refundedAmount ? (
                              <span className="text-xs text-red-600">
                                −{money(payment.refundedAmount)} refunded
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {METHOD_LABEL[payment.paymentMethod] ??
                                payment.paymentMethod}
                            </span>
                            {payment.cardDetails && (
                              <span className="text-xs text-muted-foreground">
                                {payment.cardDetails.brand} ••
                                {payment.cardDetails.last4}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_STYLES[payment.paymentStatus] ??
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {STATUS_LABEL[payment.paymentStatus] ??
                              payment.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/payments/${payment._id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
