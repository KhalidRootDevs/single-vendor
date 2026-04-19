import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the role types
export type UserRole = 'user' | 'admin' | 'moderator' | 'support';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface IOrderReference {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  date: Date;
  total: number;
  status: OrderStatus;
  items: number; // Total quantity of items
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

export interface IAddress {
  type: 'shipping' | 'billing';
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INote {
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  dateOfBirth?: Date;
  addresses: IAddress[];
  orders: IOrderReference[];
  notes: INote[];
  lastLogin?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  guestAccount: boolean; // New field for guest accounts
  preferences: {
    newsletter: boolean;
    marketing: boolean;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const orderReferenceSchema = new Schema<IOrderReference>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ],
    required: true,
    default: 'pending'
  },
  items: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    required: true,
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: [
      'credit_card',
      'debit_card',
      'paypal',
      'bank_transfer',
      'cash_on_delivery'
    ],
    required: true
  }
});

const addressSchema = new Schema<IAddress>(
  {
    type: {
      type: String,
      enum: ['shipping', 'billing'],
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const noteSchema = new Schema<INote>({
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: [1000, 'Note cannot exceed 1000 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
    },
    avatar: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'moderator', 'support'],
        message: 'Role must be either user, admin, moderator, or support'
      },
      default: 'user'
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended', 'pending'],
        message: 'Status must be active, inactive, suspended, or pending'
      },
      default: 'active'
    },
    dateOfBirth: {
      type: Date
    },
    addresses: [addressSchema],
    orders: [orderReferenceSchema],
    notes: [noteSchema],
    lastLogin: {
      type: Date
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    guestAccount: {
      type: Boolean,
      default: false
    },
    preferences: {
      newsletter: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      },
      notifications: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update updatedAt for notes when modified
userSchema.pre('save', function (next) {
  if (this.isModified('notes')) {
    this.notes.forEach((note) => {
      if (note.isModified()) {
        note.updatedAt = new Date();
      }
    });
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent password from being returned in queries
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to get user stats
userSchema.statics.getUserStats = async function () {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ status: 'active' });
  const guestUsers = await this.countDocuments({ guestAccount: true });
  const newUsers = await this.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  return {
    totalUsers,
    activeUsers,
    guestUsers,
    newUsers,
    inactiveUsers: totalUsers - activeUsers
  };
};

// Instance method to add order reference
userSchema.methods.addOrder = function (
  orderId: mongoose.Types.ObjectId,
  orderNumber: string,
  total: number,
  items: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus = 'pending',
  status: OrderStatus = 'pending'
) {
  this.orders.push({
    orderId,
    orderNumber,
    date: new Date(),
    total,
    items,
    paymentMethod,
    paymentStatus,
    status
  });
  return this.save();
};

// Instance method to add address
userSchema.methods.addAddress = function (
  addressData: Omit<IAddress, 'createdAt' | 'updatedAt'>
) {
  // If this is the first address or marked as default, set it as default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Remove default from other addresses
    this.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  this.addresses.push({
    ...addressData,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return this.save();
};

// Instance method to set default address
userSchema.methods.setDefaultAddress = function (addressIndex: number) {
  if (addressIndex >= 0 && addressIndex < this.addresses.length) {
    this.addresses.forEach((addr, index) => {
      addr.isDefault = index === addressIndex;
    });
    return this.save();
  }
  throw new Error('Invalid address index');
};

// Instance method to add note
userSchema.methods.addNote = function (
  content: string,
  createdBy: mongoose.Types.ObjectId
) {
  this.notes.push({
    content,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return this.save();
};

// Static method to find or create guest user
userSchema.statics.findOrCreateGuest = async function (
  email: string,
  name: string,
  phone?: string
) {
  let user = await this.findOne({ email: email.toLowerCase() });

  if (!user) {
    const password = Math.random().toString(36).slice(-8); // Generate random password
    const hashedPassword = await bcrypt.hash(password, 12);

    user = new this({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      guestAccount: true,
      emailVerified: false,
      status: 'active'
    });

    await user.save();

    // Return user with plain password for email sending (will be removed by toJSON)
    (user as any).plainPassword = password;
  }

  return user;
};

// Static method to convert guest to regular user
userSchema.statics.convertGuestToRegular = async function (
  userId: mongoose.Types.ObjectId
) {
  return this.findByIdAndUpdate(
    userId,
    {
      guestAccount: false,
      status: 'active'
    },
    { new: true }
  );
};

// Index for efficient queries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ guestAccount: 1 });
userSchema.index({ 'orders.date': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'addresses.isDefault': 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
