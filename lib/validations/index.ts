import { z } from 'zod';

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

const emailField = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Please enter a valid email address' });

const passwordField = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters' });

const nameField = z
  .string()
  .min(2, { message: 'Name must be at least 2 characters' });

export const adminLoginSchema = z.object({
  email: emailField,
  password: passwordField
});

export const loginSchema = z.object({
  email: emailField,
  password: passwordField
});

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required' }),
    newPassword: passwordField,
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' })
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const emailSchema = z.object({
  newEmail: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// ============================================================================
// BANNER SCHEMA
// ============================================================================

export const bannerSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' }),
  link: z.string().url({ message: 'Please enter a valid URL' }),
  buttonText: z.string().min(1, { message: 'Button text is required' }),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  endDate: z.string().min(1, { message: 'End date is required' }),
  active: z.boolean().default(true)
});

// ============================================================================
// CATEGORY SCHEMA
// ============================================================================

const imageFileSchema = z
  .instanceof(File, { message: 'Required!' })
  .refine((file) => file.size > 0, {
    message: 'Image file cannot be empty!'
  })
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    { message: 'Only JPEG, PNG, or WEBP images are allowed!' }
  );

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Required!' })
    .min(2, { message: 'Category name must be at least 2 characters!' }),
  image: z.union([imageFileSchema, z.string()]).refine((val) => Boolean(val), {
    message: 'Required!'
  }),
  description: z.string().optional(),
  featured: z.boolean().default(false).optional(),
  active: z.boolean().default(true).optional(),
  parentId: z.string().default('none').optional()
});

// ============================================================================
// PRODUCT SCHEMA
// ============================================================================

const positiveNumber = z.coerce.number().positive().optional().nullable();
const nonNegativeInt = z.coerce.number().int().nonnegative();

const variantSchema = z.object({
  sku: z.string().optional(),
  attributes: z
    .record(z.string())
    .refine((attrs) => Object.keys(attrs).length > 0, {
      message: 'At least one attribute is required'
    }),
  price: positiveNumber,
  stock: nonNegativeInt.optional().nullable(),
  image: z.string().optional()
});

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional()
});

export const productSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Product name must be at least 2 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce
    .number()
    .positive({ message: 'Price must be a positive number' }),
  compareAtPrice: positiveNumber,
  cost: positiveNumber,
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string({ required_error: 'Please select a category' }),
  tags: z.array(z.string()).optional(),
  stock: nonNegativeInt,
  weight: positiveNumber,
  length: positiveNumber,
  width: positiveNumber,
  height: positiveNumber,
  brand: z.string().optional(),
  active: z.boolean().default(true).optional(),
  featured: z.boolean().default(true).optional(),
  variants: z.array(variantSchema).optional(),
  seo: seoSchema.optional()
});

// ============================================================================
// CHECKOUT SCHEMA
// ============================================================================

const addressSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  address: z.string().min(5, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  zipCode: z.string().min(4, { message: 'ZIP code is required' }),
  country: z.string().min(2, { message: 'Country is required' }),
  phone: z.string().min(5, { message: 'Phone number is required' })
});

const optionalAddressSchema = z.object({
  fullName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional()
});

export const checkoutSchema = z.object({
  contactInfo: z.object({
    fullName: z.string().min(2, { message: 'Full name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z.string().min(5, { message: 'Phone number is required' })
  }),
  shippingAddress: addressSchema,
  billingAddress: optionalAddressSchema,
  paymentMethod: z.enum([
    'credit_card',
    'debit_card',
    'paypal',
    'cash_on_delivery'
  ]),
  shippingMethod: z.string().min(1, { message: 'Shipping method is required' }),
  notes: z.string().optional()
});

// ============================================================================
// CONTACT SCHEMA
// ============================================================================

export const contactFormSchema = z.object({
  name: nameField,
  email: emailField,
  subject: z
    .string()
    .min(5, { message: 'Subject must be at least 5 characters' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters' })
});

// ============================================================================
// SETTINGS SCHEMA
// ============================================================================

export const settingsSchema = z.object({
  general: z.object({
    storeInfo: z.object({
      storeName: z.string().min(1, { message: 'Store name is required' }),
      storeEmail: z.string().email({ message: 'Invalid email address' }),
      storePhone: z.string().min(1, { message: 'Phone number is required' }),
      storeAddress: z.string().min(1, { message: 'Address is required' })
    }),
    seo: z.object({
      metaTitle: z.string().min(1, { message: 'Meta title is required' }),
      metaDescription: z
        .string()
        .min(1, { message: 'Meta description is required' }),
      metaKeywords: z.string().min(1, { message: 'Meta keywords are required' })
    }),
    socialMedia: z.object({
      facebook: z.union([
        z.string().url({ message: 'Invalid URL' }),
        z.literal('')
      ]),
      instagram: z.union([
        z.string().url({ message: 'Invalid URL' }),
        z.literal('')
      ]),
      twitter: z.union([
        z.string().url({ message: 'Invalid URL' }),
        z.literal('')
      ]),
      youtube: z.union([
        z.string().url({ message: 'Invalid URL' }),
        z.literal('')
      ])
    })
  }),
  payment: z.object({
    paymentMethods: z.object({
      creditCards: z.boolean(),
      stripe: z.object({
        publishableKey: z.string().optional(),
        secretKey: z.string().optional()
      }),
      paypal: z.object({
        enabled: z.boolean(),
        clientId: z.string().optional(),
        secret: z.string().optional()
      }),
      cashOnDelivery: z.boolean()
    }),
    currency: z.object({
      defaultCurrency: z.enum(['usd', 'eur', 'gbp', 'cad', 'aud']),
      currencyFormat: z.enum(['symbol', 'code', 'symbol-code'])
    }),
    tax: z.object({
      enabled: z.boolean(),
      taxRate: z.number().min(0).max(100),
      pricesIncludeTax: z.boolean()
    })
  }),
  shipping: z.object({
    methods: z.object({
      freeShipping: z.object({
        enabled: z.boolean(),
        minimumAmount: z.number().min(0)
      }),
      flatRate: z.object({
        enabled: z.boolean(),
        cost: z.number().min(0)
      }),
      expressShipping: z.object({
        enabled: z.boolean(),
        cost: z.number().min(0)
      })
    }),
    options: z.object({
      shippingCalculator: z.boolean(),
      internationalShipping: z.boolean(),
      shippingOrigin: z
        .string()
        .min(1, { message: 'Shipping origin is required' })
    })
  }),
  email: z.object({
    provider: z.object({
      service: z.enum(['smtp', 'sendgrid', 'mailchimp', 'aws-ses']),
      smtp: z
        .object({
          host: z
            .string()
            .min(1, { message: 'SMTP host is required' })
            .optional(),
          port: z.number().min(1).max(65535).optional(),
          security: z.enum(['none', 'ssl', 'tls']).optional(),
          username: z.string().optional(),
          password: z.string().optional()
        })
        .optional()
    }),
    notifications: z.object({
      orderConfirmation: z.boolean(),
      shippingConfirmation: z.boolean(),
      orderCanceled: z.boolean(),
      customerAccount: z.boolean(),
      passwordReset: z.boolean(),
      abandonedCart: z.boolean()
    })
  }),
  cms: z.object({
    termsAndConditions: z
      .string()
      .min(1, { message: 'Terms and conditions content is required' }),
    privacyPolicy: z
      .string()
      .min(1, { message: 'Privacy policy content is required' }),
    returnPolicy: z
      .string()
      .min(1, { message: 'Return policy content is required' }),
    aboutUs: z.string().min(1, { message: 'About us content is required' }),
    faq: z.string().min(1, { message: 'FAQ content is required' })
  }),
  advanced: z.object({
    analytics: z.object({
      googleAnalyticsId: z.string().optional(),
      facebookPixelId: z.string().optional(),
      enabled: z.boolean()
    }),
    api: z.object({
      apiKey: z.string().min(1, { message: 'API key is required' }),
      webhookUrl: z.union([
        z.string().url({ message: 'Invalid URL' }),
        z.literal('')
      ]),
      webhooksEnabled: z.boolean()
    }),
    cloudinary: z.object({
      cloudName: z.string().min(1, { message: 'Cloud name is required' }),
      apiKey: z.string().min(1, { message: 'API key is required' }),
      apiSecret: z.string().min(1, { message: 'API secret is required' }),
      uploadPreset: z.string().optional(),
      secure: z.boolean(),
      folder: z.string().min(1, { message: 'Folder is required' })
    }),
    performance: z.object({
      pageCaching: z.boolean(),
      cacheDuration: z.number().min(1),
      imageOptimization: z.boolean(),
      minifyAssets: z.boolean()
    }),
    maintenance: z.object({
      enabled: z.boolean(),
      message: z
        .string()
        .min(1, { message: 'Maintenance message is required' }),
      allowAdminAccess: z.boolean()
    })
  })
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
export type EmailFormValues = z.infer<typeof emailSchema>;
export type BannerFormValues = z.infer<typeof bannerSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
