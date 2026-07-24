'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { toast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api-fetch';
import type { Return } from '@/types';

const STATUS_COLORS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  refunded: 'outline'
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/returns${query}&limit=50`);
      if (!res.ok) throw new Error('Failed to load returns');
      const data = await res.json();
      setReturns(data.returns);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load returns.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (returnReq: Return) => {
    setActioningId(returnReq._id);
    try {
      const res = await apiFetch(`/api/admin/returns/${returnReq._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'approved',
          refundAmount: returnReq.refundAmount
        })
      });
      if (!res.ok) throw new Error('Failed to approve');
      toast({ title: 'Approved', description: 'Return approved.' });
      fetchReturns();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to approve return.',
        variant: 'destructive'
      });
    } finally {
      setActioningId(null);
    }
  };

  const openRejectDialog = (returnReq: Return) => {
    setSelectedReturn(returnReq);
    setAdminNotes('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedReturn) return;
    setActioningId(selectedReturn._id);
    try {
      const res = await apiFetch(`/api/admin/returns/${selectedReturn._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected', adminNotes })
      });
      if (!res.ok) throw new Error('Failed to reject');
      toast({ title: 'Rejected', description: 'Return rejected.' });
      setRejectDialogOpen(false);
      fetchReturns();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reject return.',
        variant: 'destructive'
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleRefund = async (returnReq: Return) => {
    setActioningId(returnReq._id);
    try {
      const res = await apiFetch(`/api/admin/returns/${returnReq._id}`, {
        method: 'POST',
        body: JSON.stringify({
          refundAmount: Number(refundAmount) || returnReq.refundAmount
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Refund failed');
      }
      toast({ title: 'Refunded', description: 'Stripe refund processed.' });
      fetchReturns();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Returns & Refunds</h1>
          <p className="text-muted-foreground">
            Manage customer return requests
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <CardDescription>{returns.length} request(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : returns.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No return requests found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((ret) => (
                  <TableRow key={ret._id}>
                    <TableCell className="font-mono text-sm">
                      {ret.returnNumber}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {ret.orderNumber}
                    </TableCell>
                    <TableCell>{ret.userEmail}</TableCell>
                    <TableCell className="capitalize">
                      {ret.reason.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>${ret.refundAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[ret.status] ?? 'outline'}>
                        {ret.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ret.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {ret.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              disabled={actioningId === ret._id}
                              onClick={() => handleApprove(ret)}
                            >
                              {actioningId === ret._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={actioningId === ret._id}
                              onClick={() => openRejectDialog(ret)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {ret.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === ret._id}
                            onClick={() => handleRefund(ret)}
                          >
                            {actioningId === ret._id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <CreditCard className="mr-1 h-4 w-4" />
                            )}
                            Refund
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Return Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Admin Notes (optional)</Label>
              <Textarea
                placeholder="Reason for rejection..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!!actioningId}
            >
              {actioningId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
