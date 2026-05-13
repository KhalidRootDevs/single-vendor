'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Eye, Loader2, Search, Trash2 } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { toast } from '@/components/ui/use-toast';
import { ContactSubmission } from '@/types';
import { apiFetch } from '@/lib/api-fetch';

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await apiFetch('/api/admin/contact?limit=200');
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setSubmissions(data.submissions);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load submissions.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.subject.toLowerCase().includes(q) ||
          s.message.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    return filtered;
  }, [submissions, searchQuery, statusFilter]);

  const handleViewSubmission = async (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsDialogOpen(true);

    if (submission.status === 'new') {
      try {
        await apiFetch(`/api/admin/contact/${submission._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'read' })
        });
        setSubmissions((prev) =>
          prev.map((s) =>
            s._id === submission._id ? { ...s, status: 'read' } : s
          )
        );
        setSelectedSubmission({ ...submission, status: 'read' });
      } catch {
        // Non-critical — don't show error
      }
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: ContactSubmission['status']
  ) => {
    try {
      const res = await apiFetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');

      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status } : s))
      );
      if (selectedSubmission?._id === id) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
      toast({
        title: 'Status updated',
        description: `Status set to "${status}".`
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/contact/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete submission');
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      toast({
        title: 'Deleted',
        description: 'The submission has been deleted.'
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete submission.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'read':
        return <Badge variant="outline">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-500">Replied</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Contact Submissions
          </h2>
          <p className="text-muted-foreground">
            View and manage customer inquiries from the contact form.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Inquiries</CardTitle>
            <CardDescription>
              {filteredSubmissions.length}{' '}
              {filteredSubmissions.length === 1 ? 'submission' : 'submissions'}{' '}
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9"
                />
                <Button type="button" size="sm" className="h-9">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No submissions found.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {submission.name}
                        </TableCell>
                        <TableCell>{submission.email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {submission.subject}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSubmission(submission)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteSubmission(submission._id)
                              }
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Contact Submission</DialogTitle>
            <DialogDescription>
              Received on{' '}
              {selectedSubmission &&
                new Date(selectedSubmission.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Status</h3>
                  {getStatusBadge(selectedSubmission.status)}
                </div>
                <Select
                  value={selectedSubmission.status}
                  onValueChange={(value) =>
                    handleUpdateStatus(
                      selectedSubmission._id,
                      value as ContactSubmission['status']
                    )
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h3 className="font-medium">From</h3>
                <p>
                  {selectedSubmission.name} ({selectedSubmission.email})
                </p>
              </div>
              <div>
                <h3 className="font-medium">Subject</h3>
                <p>{selectedSubmission.subject}</p>
              </div>
              <div>
                <h3 className="font-medium">Message</h3>
                <div className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/50 p-4">
                  {selectedSubmission.message}
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteSubmission(selectedSubmission._id);
                    setIsDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateStatus(selectedSubmission._id, 'replied')
                  }
                >
                  Mark as Replied
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
