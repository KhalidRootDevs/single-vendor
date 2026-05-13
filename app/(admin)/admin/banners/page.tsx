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
import { Switch } from '@/components/ui/switch';
import {
  Edit,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { apiFetch } from '@/lib/api-fetch';
import { Banner } from '@/types';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await apiFetch('/api/admin/banners');
      if (!res.ok) throw new Error('Failed to load banners');
      const data = await res.json();
      setBanners(data.banners);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load banners.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      const res = await apiFetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });
      if (!res.ok) throw new Error('Failed to update banner');
      setBanners((prev) =>
        prev.map((b) => (b._id === id ? { ...b, active: !currentActive } : b))
      );
      toast({ title: 'Banner updated', description: 'Visibility updated.' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update banner.',
        variant: 'destructive'
      });
    } finally {
      setTogglingId(null);
    }
  };

  const reorder = async (updated: Banner[]) => {
    const payload = updated.map((b, i) => ({ id: b._id, order: i + 1 }));
    try {
      await apiFetch('/api/admin/banners/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: payload })
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save order.',
        variant: 'destructive'
      });
    }
  };

  const handleMoveUp = async (id: string) => {
    const index = banners.findIndex((b) => b._id === id);
    if (index <= 0) return;
    const updated = [...banners];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setBanners(updated);
    await reorder(updated);
    toast({ title: 'Order updated', description: 'Banner moved up.' });
  };

  const handleMoveDown = async (id: string) => {
    const index = banners.findIndex((b) => b._id === id);
    if (index >= banners.length - 1) return;
    const updated = [...banners];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setBanners(updated);
    await reorder(updated);
    toast({ title: 'Order updated', description: 'Banner moved down.' });
  };

  const handleDeleteClick = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      const res = await apiFetch(`/api/admin/banners/${bannerToDelete}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete banner');
      setBanners((prev) => prev.filter((b) => b._id !== bannerToDelete));
      toast({
        title: 'Banner deleted',
        description: 'The banner has been permanently deleted.'
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete banner.',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Banners</h2>
            <p className="text-muted-foreground">
              Manage promotional banners displayed on your store.
            </p>
          </div>
          <Link href="/admin/banners/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Banner Management</CardTitle>
            <CardDescription>
              Control which banners are displayed on your store and their order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : banners.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No banners yet.</p>
                <Link href="/admin/banners/new" className="mt-4 inline-block">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first banner
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Description
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Link
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Dates
                      </TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner, index) => (
                      <TableRow key={banner._id}>
                        <TableCell>
                          <div className="relative h-16 w-28 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={banner.imageUrl || '/placeholder.svg'}
                              alt={banner.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {banner.title}
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                          {banner.description}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {banner.link}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            {banner.startDate && (
                              <div>
                                {new Date(
                                  banner.startDate
                                ).toLocaleDateString()}
                              </div>
                            )}
                            {banner.startDate && banner.endDate && (
                              <div>to</div>
                            )}
                            {banner.endDate && (
                              <div>
                                {new Date(banner.endDate).toLocaleDateString()}
                              </div>
                            )}
                            {!banner.startDate && !banner.endDate && (
                              <span className="text-muted-foreground">
                                No dates
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={banner.active}
                            disabled={togglingId === banner._id}
                            onCheckedChange={() =>
                              handleToggleActive(banner._id, banner.active)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMoveUp(banner._id)}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                              <span className="sr-only">Move up</span>
                            </Button>
                            <span className="w-4 text-center text-sm">
                              {index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMoveDown(banner._id)}
                              disabled={index === banners.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                              <span className="sr-only">Move down</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/banners/${banner._id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </Link>
                            <Link href={`/admin/banners/preview/${banner._id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Preview</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteClick(banner._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the banner and its image. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
