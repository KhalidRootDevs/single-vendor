'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { StarRating } from './StarRating';
import type { Review } from '@/types';

interface ReviewSectionProps {
  productId: string;
  isAuthenticated: boolean;
}

export function ReviewSection({
  productId,
  isAuthenticated
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const fetchReviews = useCallback(
    async (p: number) => {
      try {
        const res = await fetch(
          `/api/products/${productId}/reviews?page=${p}&limit=10`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReviews((prev) =>
          p === 1 ? data.reviews : [...prev, ...data.reviews]
        );
        setHasMore(data.pagination.hasNext);
        setTotal(data.pagination.total);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load reviews.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating.',
        variant: 'destructive'
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, body })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      toast({
        title: 'Review submitted',
        description: 'Your review is pending approval.'
      });
      setShowForm(false);
      setRating(0);
      setTitle('');
      setBody('');
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Customer Reviews
          {total > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({total})
            </span>
          )}
        </h2>
        {isAuthenticated && !showForm && (
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Your Rating</Label>
                <StarRating
                  rating={rating}
                  interactive
                  onChange={setRating}
                  size={24}
                  className="mt-1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="review-title">Title</Label>
                <Input
                  id="review-title"
                  placeholder="Summarise your experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="review-body">Review</Label>
                <Textarea
                  id="review-body"
                  placeholder="Tell others what you think about this product..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Review
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Review List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="pb-5 pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.userName}</span>
                      {review.verified && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-green-300 text-xs text-green-600"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <StarRating
                      rating={review.rating}
                      size={14}
                      className="mt-0.5"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-3 font-medium">{review.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.body}
                </p>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={handleLoadMore}>
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
