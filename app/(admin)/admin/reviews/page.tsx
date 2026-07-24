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
import { CheckCircle, XCircle, Trash2, Loader2, Star } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { toast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api-fetch';
import type { Review } from '@/types';

const STATUS_COLORS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive'
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/reviews${query}&limit=50`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      setReviews(data.reviews);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load reviews.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActioningId(id);
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action })
      });
      if (!res.ok) throw new Error('Failed to update review');
      toast({ title: 'Success', description: `Review ${action}.` });
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update review.',
        variant: 'destructive'
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActioningId(id);
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete review');
      toast({ title: 'Deleted', description: 'Review removed.' });
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete review.',
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
          <h1 className="text-2xl font-bold">Product Reviews</h1>
          <p className="text-muted-foreground">
            Moderate customer reviews before they go live
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
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>{reviews.length} review(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No reviews found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell className="font-medium">
                      {review.userName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {review.title}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {review.body}
                    </TableCell>
                    <TableCell>
                      {review.verified && (
                        <Badge
                          variant="outline"
                          className="border-green-600 text-green-600"
                        >
                          Verified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_COLORS[review.status] ?? 'outline'}
                      >
                        {review.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {review.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            disabled={actioningId === review._id}
                            onClick={() => handleAction(review._id, 'approved')}
                          >
                            {actioningId === review._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {review.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={actioningId === review._id}
                            onClick={() => handleAction(review._id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={actioningId === review._id}
                          onClick={() => handleDelete(review._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
