'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Eye,
  Download,
  Loader2,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import type { PaymentTransaction, PaymentStats, PaginationInfo } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-blue-100 text-blue-800 border-blue-200'
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded'
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
  cash_on_delivery: 'Cash on Delivery'
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function buildPaymentMethodLabel(tx: PaymentTransaction): string {
  const base = PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod;
  if (tx.cardDetails?.last4) {
    const brand = tx.cardDetails.brand ?? tx.cardDetails.type ?? '';
    return `${brand} •••• ${tx.cardDetails.last4}`.trim();
  }
  return base;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[130px] animate-pulse rounded-lg border bg-muted/40"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <p className="mb-1 font-medium text-muted-foreground">
        No payment records found
      </p>
      <p className="text-sm text-muted-foreground">
        Try adjusting filters or complete your first purchase.
      </p>
      <Button asChild className="mt-4">
        <Link href="/products">Browse Products</Link>
      </Button>
    </div>
  );
}

function TransactionRow({ tx }: { tx: PaymentTransaction }) {
  const [downloading, setDownloading] = useState(false);

  const handleReceiptDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/user/orders/${tx.orderNumber}/invoice`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${tx.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast({
        title: 'Download unavailable',
        description: 'Receipt download is not available for this transaction.',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article
      className="rounded-lg border p-4 transition-colors hover:bg-accent/40"
      aria-label={`Payment for order ${tx.orderNumber}`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <CreditCard
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="font-semibold">{tx.orderNumber}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(tx.createdAt)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={PAYMENT_STATUS_COLORS[tx.paymentStatus] ?? ''}
        >
          {PAYMENT_STATUS_LABELS[tx.paymentStatus] ?? tx.paymentStatus}
        </Badge>
      </div>

      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Method</dt>
          <dd className="font-medium">{buildPaymentMethodLabel(tx)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium">{formatCurrency(tx.subtotal)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tax + Shipping</dt>
          <dd className="font-medium">
            {formatCurrency(tx.tax + tx.shipping)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="text-base font-semibold">
            {formatCurrency(tx.total)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/account/orders/${tx.orderNumber}`}>
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            View Order
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReceiptDownload}
          disabled={downloading}
          aria-label={`Download receipt for ${tx.orderNumber}`}
        >
          {downloading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          )}
          Receipt
        </Button>
      </div>
    </article>
  );
}

function PaginationBar({
  pagination,
  onPageChange
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div
      className="flex items-center justify-between pt-2"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages} &mdash;{' '}
        {pagination.total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrev}
          onClick={() => onPageChange(pagination.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasNext}
          onClick={() => onPageChange(pagination.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter !== 'all') params.set('paymentStatus', statusFilter);

      const res = await fetch(`/api/user/payments?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Failed to load payments');

      setPayments(data.payments ?? []);
      setStats(data.stats ?? null);
      setPagination(data.pagination ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Total Spent"
            value={formatCurrency(stats.totalSpent)}
            sub={`${stats.paidCount} paid`}
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={String(stats.paidCount)}
            sub="transactions"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={String(stats.pendingCount)}
            sub="awaiting payment"
          />
          <StatCard
            icon={RefreshCw}
            label="Refunded"
            value={String(stats.refundedCount)}
            sub="transactions"
          />
        </div>
      )}

      {/* Transaction list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {pagination
                  ? `${pagination.total} transaction${
                      pagination.total !== 1 ? 's' : ''
                    }`
                  : 'All your payment transactions'}
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger
                className="w-[180px]"
                aria-label="Filter by status"
              >
                <Filter className="mr-2 h-4 w-4" aria-hidden />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <TransactionSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={fetchPayments}>
                Try again
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="space-y-3">
                {payments.map((tx) => (
                  <TransactionRow key={tx._id} tx={tx} />
                ))}
              </div>
              {pagination && (
                <PaginationBar pagination={pagination} onPageChange={setPage} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
