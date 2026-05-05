'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import { useAuth } from '@/context/auth-context';
import { Address } from '@/types';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    isDefault: false
  });

  // Fetch addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/addresses', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      } else {
        throw new Error('Failed to fetch addresses');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load addresses. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses((prev) => [...prev, data.address]);
        setIsDialogOpen(false);
        resetForm();
        toast({
          title: 'Address added',
          description: 'Your new address has been saved successfully.'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }
    } catch (error: any) {
      console.error('Error adding address:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to add address. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = async () => {
    if (!editingAddress) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/addresses/${editingAddress._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses((prev) =>
          prev.map((addr) =>
            addr._id === editingAddress._id ? data.address : addr
          )
        );
        setIsDialogOpen(false);
        setEditingAddress(null);
        resetForm();
        toast({
          title: 'Address updated',
          description: 'Your address has been updated successfully.'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update address');
      }
    } catch (error: any) {
      console.error('Error updating address:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update address. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/addresses/${addressToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setAddresses((prev) =>
          prev.filter((addr) => addr._id !== addressToDelete._id)
        );
        setIsDeleteDialogOpen(false);
        setAddressToDelete(null);
        toast({
          title: 'Address deleted',
          description: 'The address has been removed.'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to delete address. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (address: Address) => {
    setAddressToDelete(address);
    setIsDeleteDialogOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state to reflect the new default address
        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: addr._id === id
          }))
        );
        toast({
          title: 'Default address updated',
          description: 'Your default shipping address has been changed.'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to set default address. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      fullName: address.fullName,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      label: '',
      fullName: user?.name || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      phone: '',
      isDefault: false
    });
    setEditingAddress(null);
  };

  // Pre-fill user's name when opening add dialog
  useEffect(() => {
    if (user?.name && !editingAddress) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name
      }));
    }
  }, [user, editingAddress]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saved Addresses</CardTitle>
              <CardDescription>Manage your shipping addresses</CardDescription>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAddress
                      ? 'Update your address information'
                      : 'Add a new shipping address'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Address Label *</Label>
                    <select
                      id="label"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a label</option>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street, Apt 4B"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        value={formData.zipCode}
                        onChange={(e) =>
                          setFormData({ ...formData, zipCode: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        placeholder="United States"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isDefault: e.target.checked
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">
                      Set as default address
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingAddress ? handleEditAddress : handleAddAddress
                    }
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingAddress ? 'Updating...' : 'Adding...'}
                      </>
                    ) : editingAddress ? (
                      'Update Address'
                    ) : (
                      'Add Address'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="relative rounded-lg border p-4"
                >
                  {address.isDefault && (
                    <Badge className="absolute right-4 top-4 bg-primary">
                      Default
                    </Badge>
                  )}
                  <div className="mb-3 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold capitalize">
                        {address.label}
                      </h3>
                      <p className="text-sm">{address.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.country}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {address.phone}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(address)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (address._id) handleSetDefault(address._id);
                        }}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(address)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">No saved addresses</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{' '}
              <span className="font-semibold capitalize">
                {addressToDelete?.label}
              </span>{' '}
              address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setAddressToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Address'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
