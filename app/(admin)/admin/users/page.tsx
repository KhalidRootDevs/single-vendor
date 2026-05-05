'use client';

import { DataTable } from '@/components/tables/data-table';
import { createUserColumns } from '@/components/tables/user/columns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { PaginationInfo, User } from '@/types';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const roleFilter = searchParams.get('role') || 'all';
  const currentPage = Number.parseInt(searchParams.get('page') || '1');
  const currentPageSize = Number.parseInt(searchParams.get('pageSize') || '10');

  const isFetchingRef = useRef(false);

  const fetchUsers = useCallback(
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
        if (roleFilter && roleFilter !== 'all') {
          params.append('role', roleFilter);
        }

        const response = await fetch(`/api/admin/users?${params}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
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
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [searchTerm, statusFilter, roleFilter]
  );

  useEffect(() => {
    fetchUsers(currentPage, currentPageSize);
  }, [fetchUsers, currentPage, currentPageSize]);

  const handleStatusUpdate = async (
    userId: string,
    currentStatus: string,
    userName: string
  ) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: 'Status updated',
          description: `User "${userName}" has been ${
            newStatus === 'active' ? 'activated' : 'deactivated'
          }.`
        });
        fetchUsers(currentPage, currentPageSize);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update user status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: 'User deleted',
          description: `User "${userName}" has been deleted successfully.`
        });
        fetchUsers(currentPage, currentPageSize);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const columns = createUserColumns({
    onStatusUpdate: handleStatusUpdate,
    onDeleteUser: handleDeleteUser
  });

  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      name: 'role',
      label: 'Role',
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
        { value: 'moderator', label: 'Moderator' },
        { value: 'support', label: 'Support' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage your customer accounts and permissions.
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            search={true}
            searchPlaceholder="Search users..."
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
