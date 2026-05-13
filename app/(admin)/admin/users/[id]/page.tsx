'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ArrowLeft,
  Ban,
  Edit,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
  Calendar,
  MapPin,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Order, User as IUser } from '@/types';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<IUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch user data
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 404) {
        toast({
          title: 'User not found',
          description: 'The requested user does not exist.',
          variant: 'destructive'
        });
        router.push('/admin/users');
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch(
        `/api/admin/orders?userId=${userId}&limit=50`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        throw new Error('Failed to fetch user orders');
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user orders.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserOrders();
    }
  }, [userId]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        })
      });

      if (response.ok) {
        toast({
          title: 'User updated',
          description: 'User information has been updated successfully.'
        });
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update user. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast({
          title: 'Status updated',
          description: `User status has been updated to ${status}.`
        });
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

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: newNote })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setNewNote('');
        toast({
          title: 'Note added',
          description: 'Note has been added successfully.'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add note');
      }
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add note. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleRoleChange = async (role: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast({
          title: 'Role updated',
          description: `User role has been updated to ${role}.`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update user role. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const calculateUserStats = () => {
    if (!user) return { totalOrders: 0, totalSpent: 0, completedOrders: 0 };

    const totalOrders = user.orders.length;
    const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);
    const completedOrders = user.orders.filter(
      (order) => order.status === 'delivered'
    ).length;

    return {
      totalOrders,
      totalSpent,
      completedOrders
    };
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      case 'support':
        return 'secondary';
      case 'user':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'processing':
        return 'outline';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              User Not Found
            </h2>
            <p className="text-muted-foreground">
              The requested user does not exist.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  const stats = calculateUserStats();
  const defaultAddress =
    user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
  const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const lastLoginFormatted = user.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Never';

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
            <p className="text-muted-foreground">
              View and manage user information.
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Basic user information and status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <Avatar className="mb-4 h-24 w-24">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone || 'N/A'}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Badge
                    variant={getStatusVariant(user.status)}
                    className="capitalize"
                  >
                    {user.status}
                  </Badge>
                  <Badge variant={getRoleVariant(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Account Details</h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div className="text-muted-foreground">User ID:</div>
                  <div className="font-mono text-xs">{user._id}</div>
                  <div className="text-muted-foreground">Registered:</div>
                  <div>{formattedDate}</div>
                  <div className="text-muted-foreground">Last Login:</div>
                  <div>{lastLoginFormatted}</div>
                  <div className="text-muted-foreground">Total Orders:</div>
                  <div>{stats.totalOrders}</div>
                  <div className="text-muted-foreground">Total Spent:</div>
                  <div>${stats.totalSpent.toFixed(2)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Change Status</h4>
                  <Select
                    value={user.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Change Role</h4>
                  <Select value={user.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {user.status !== 'suspended' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleStatusChange('suspended')}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend User
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  User's personal and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={user.name}
                      onChange={(e) =>
                        setUser({ ...user, name: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={user.phone || ''}
                      onChange={(e) =>
                        setUser({ ...user, phone: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <DatePicker
                      id="dateOfBirth"
                      value={user.dateOfBirth || ''}
                      onChange={(date) =>
                        setUser({ ...user, dateOfBirth: date })
                      }
                      disabled={!isEditing}
                      placeholder="Select date of birth"
                      maxDate={new Date()}
                    />
                  </div>
                </div>

                {/* Address Information */}
                {defaultAddress && (
                  <div className="mt-6 space-y-2">
                    <Label>Default Address</Label>
                    <div className="rounded-md border bg-muted/50 p-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {defaultAddress.fullName}
                          </div>
                          <div>{defaultAddress.address}</div>
                          <div>
                            {defaultAddress.city}, {defaultAddress.state}{' '}
                            {defaultAddress.zipCode}
                          </div>
                          <div>{defaultAddress.country}</div>
                          <div className="mt-1 text-muted-foreground">
                            {defaultAddress.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Status */}
                <div className="mt-6 space-y-2">
                  <Label>Verification Status</Label>
                  <div className="flex gap-4">
                    <Badge
                      variant={user.emailVerified ? 'default' : 'secondary'}
                    >
                      {user.emailVerified
                        ? 'Email Verified'
                        : 'Email Not Verified'}
                    </Badge>
                    <Badge
                      variant={user.phoneVerified ? 'default' : 'secondary'}
                    >
                      {user.phoneVerified
                        ? 'Phone Verified'
                        : 'Phone Not Verified'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Orders and Notes */}
            <Tabs defaultValue="orders">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Order History</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>
                      View all orders placed by this user.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order Number</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order._id}>
                                <TableCell className="font-medium">
                                  {order.orderNumber}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {order.items.reduce(
                                    (sum, item) => sum + item.quantity,
                                    0
                                  )}
                                </TableCell>
                                <TableCell>${order.total.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={getOrderStatusVariant(
                                      order.status
                                    )}
                                    className="capitalize"
                                  >
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link href={`/admin/orders/${order._id}`}>
                                    <Button variant="ghost" size="sm">
                                      View
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-muted-foreground">
                        This user has not placed any orders yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Notes</CardTitle>
                    <CardDescription>
                      Internal notes about this user.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Add New Note */}
                    <div className="mb-6 space-y-4">
                      <Label htmlFor="newNote">Add New Note</Label>
                      <Textarea
                        id="newNote"
                        placeholder="Enter a note about this user..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isAddingNote}
                        size="sm"
                      >
                        {isAddingNote ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Note'
                        )}
                      </Button>
                    </div>

                    {/* Existing Notes */}
                    <div className="space-y-4">
                      {user.notes.length > 0 ? (
                        user.notes.map((note) => (
                          <div key={note._id} className="rounded-lg border p-4">
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {note.createdBy.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-muted-foreground">
                          No notes have been added for this user.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Container>
  );
}
