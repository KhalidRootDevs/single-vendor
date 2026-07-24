'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RotateCcw, Loader2, Package } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Return, ReturnReason } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200'
};

const REASON_LABELS: Record<string, string> = {
  defective: 'Defective / Damaged',
  wrong_item: 'Wrong Item Received',
  not_as_described: 'Not As Described',
  changed_mind: 'Changed My Mind',
  other: 'Other'
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Return | null>(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await fetch('/api/user/returns?limit=50', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load returns');
      const data = await res.json();
      setReturns(data.returns);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load your returns.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Return Requests</h1>
        <p className="text-muted-foreground">
          Track the status of your return requests
        </p>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <RotateCcw className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Return Requests</h3>
            <p className="mt-1 text-muted-foreground">
              You haven&apos;t submitted any return requests yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Card key={ret._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-mono text-base">
                      {ret.returnNumber}
                    </CardTitle>
                    <CardDescription>Order #{ret.orderNumber}</CardDescription>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[ret.status] ?? 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <p className="font-medium">
                      {REASON_LABELS[ret.reason] ?? ret.reason}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Refund Amount</span>
                    <p className="font-medium">
                      ${ret.refundAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items</span>
                    <p className="font-medium">{ret.items.length} item(s)</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted</span>
                    <p className="font-medium">
                      {new Date(ret.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {ret.adminNotes && (
                  <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                    <span className="font-medium">Note from support: </span>
                    {ret.adminNotes}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mt-3"
                  onClick={() => setSelected(ret)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return {selected?.returnNumber}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Order</p>
                  <p className="font-mono font-medium">
                    {selected.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[selected.status] ?? ''
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p>{REASON_LABELS[selected.reason] ?? selected.reason}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Refund Amount</p>
                  <p className="font-semibold">
                    ${selected.refundAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-muted-foreground">Description</p>
                <p className="rounded bg-muted p-3 text-sm">
                  {selected.description}
                </p>
              </div>
              <div>
                <p className="mb-2 text-muted-foreground">Items</p>
                <ul className="space-y-1">
                  {selected.items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {selected.adminNotes && (
                <div className="rounded bg-muted p-3 text-sm">
                  <span className="font-medium">Support note: </span>
                  {selected.adminNotes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
