// ============================================================================
// COMMON / UTILITY TYPES
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TimelineEvent {
  status: string;
  date: string;
  description: string;
  updatedBy?: string | { _id: string; name: string; email: string };
}

// ============================================================================
// ADDRESS TYPES
// ============================================================================

export type AddressLabel = 'Home' | 'Work' | 'Office' | 'Other';

export interface Address {
  _id?: string;
  userId: string;
  label: AddressLabel;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequest {
  label: AddressLabel;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  featured: boolean;
  active: boolean;
  slug: string;
  parentId?: { _id: string; name: string } | null;
  products?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  _id: string;
  name: string;
  slug: string;
}

// ============================================================================
// BANNER TYPES
// ============================================================================

export interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePublicId?: string;
  link: string;
  buttonText: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONTACT TYPES
// ============================================================================

export type ContactSubmissionStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: {
    attributes: Record<string, string>;
    sku?: string;
  };
  productId?: string | { _id: string; name: string };
  sku?: string;
}

export interface Customer {
  id: string;
  _id?: string; // MongoDB _id
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CardDetails {
  type: string;
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface BillingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: Customer;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cardDetails?: CardDetails;
  shippingMethod: string;
  trackingNumber?: string;
  timeline: TimelineEvent[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface ProductVariant {
  sku?: string;
  attributes: Record<string, string>;
  price?: number;
  stock?: number;
  image?: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  sku: string;
  barcode?: string;
  categoryId: CategorySummary;
  tags: string[];
  stock: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  active: boolean;
  featured: boolean;
  brand: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  variants: ProductVariant[];
  seo?: ProductSEO;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupedVariant {
  name: string;
  options: string[];
  hasPriceVariation: boolean;
  hasStockVariation: boolean;
}

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  description: string;
  stock: number;
  variants?: ProductVariant[];
}

export interface ProductCardProps {
  product: ProductCardData;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'user' | 'admin' | 'moderator' | 'support';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface UserAddress {
  _id: string;
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UserOrder {
  orderId: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  items: number;
  paymentStatus: string;
}

export interface UserNote {
  _id: string;
  content: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  newsletter: boolean;
  marketing: boolean;
  notifications: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  dateOfBirth?: string;
  addresses: UserAddress[];
  orders: UserOrder[];
  notes: UserNote[];
  lastLogin?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDeleteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  action: () => void;
}

export interface CartItem {
  id: number;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant: string;
  selectedOptions?: Record<string, string>;
  variantSku?: string;
  maxStock?: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentTransaction {
  _id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cardDetails?: CardDetails;
  status: OrderStatus;
}

export interface PaymentStats {
  totalSpent: number;
  totalTransactions: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  failedCount: number;
}

export interface PaymentsApiResponse {
  payments: PaymentTransaction[];
  stats: PaymentStats;
  pagination: PaginationInfo;
}
