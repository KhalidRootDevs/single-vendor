'use client';

import { useState, useEffect } from 'react';
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
import { Eye, Search, Trash2 } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { toast } from '@/components/ui/use-toast';
import { ContactSubmission } from '@/types';

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<
    ContactSubmission[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    const storedSubmissions = localStorage.getItem('contactSubmissions');
    if (storedSubmissions) {
      const parsedSubmissions = JSON.parse(storedSubmissions);
      setSubmissions(parsedSubmissions);
      setFilteredSubmissions(parsedSubmissions);
    }
  }, []);

  useEffect(() => {
    let filtered = [...submissions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (submission) =>
          submission.name.toLowerCase().includes(query) ||
          submission.email.toLowerCase().includes(query) ||
          submission.subject.toLowerCase().includes(query) ||
          submission.message.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (submission) => submission.status === statusFilter
      );
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, statusFilter]);

  const handleViewSubmission = (submission: ContactSubmission) => {
    // Mark as read if it's new
    if (submission.status === 'new') {
      const updatedSubmissions = submissions.map((s) =>
        s.id === submission.id
          ? { ...s, status: 'read' as ContactSubmission['status'] }
          : s
      );
      setSubmissions(updatedSubmissions as ContactSubmission[]);
      localStorage.setItem(
        'contactSubmissions',
        JSON.stringify(updatedSubmissions)
      );
    }

    setSelectedSubmission(submission);
    setIsDialogOpen(true);
  };

  const handleDeleteSubmission = (id: number) => {
    const updatedSubmissions = submissions.filter((s) => s.id !== id);
    setSubmissions(updatedSubmissions);
    localStorage.setItem(
      'contactSubmissions',
      JSON.stringify(updatedSubmissions)
    );

    toast({
      title: 'Submission deleted',
      description: 'The contact submission has been deleted.'
    });
  };

  const handleUpdateStatus = (
    id: number,
    status: 'new' | 'read' | 'replied' | 'archived'
  ) => {
    const updatedSubmissions = submissions.map((s) =>
      s.id === id ? { ...s, status } : s
    );
    setSubmissions(updatedSubmissions);
    localStorage.setItem(
      'contactSubmissions',
      JSON.stringify(updatedSubmissions)
    );

    toast({
      title: 'Status updated',
      description: `The submission status has been updated to "${status}".`
    });

    if (selectedSubmission?.id === id) {
      setSelectedSubmission({ ...selectedSubmission, status });
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

            {filteredSubmissions.length === 0 ? (
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
                      <TableRow key={submission.id}>
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
                                handleDeleteSubmission(submission.id)
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

      {/* Submission Detail Dialog */}
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
                <div className="flex gap-2">
                  <Select
                    value={selectedSubmission.status}
                    onValueChange={(value) =>
                      handleUpdateStatus(
                        selectedSubmission.id,
                        value as 'new' | 'read' | 'replied' | 'archived'
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
                    handleDeleteSubmission(selectedSubmission.id);
                    setIsDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateStatus(selectedSubmission.id, 'replied');
                    toast({
                      title: 'Reply sent',
                      description:
                        'In a real application, this would open an email interface.'
                    });
                  }}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
