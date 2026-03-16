import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  general: {
    storeInfo: {
      storeName: string;
      storeEmail: string;
      storePhone: string;
      storeAddress: string;
    };
    seo: {
      metaTitle: string;
      metaDescription: string;
      metaKeywords: string;
    };
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      youtube: string;
    };
  };
  payment: {
    paymentMethods: {
      creditCards: boolean;
      stripe: {
        publishableKey: string;
        secretKey: string;
      };
      paypal: {
        enabled: boolean;
        clientId: string;
        secret: string;
      };
      cashOnDelivery: boolean;
    };
    currency: {
      defaultCurrency: 'usd' | 'eur' | 'gbp' | 'cad' | 'aud';
      currencyFormat: 'symbol' | 'code' | 'symbol-code';
    };
    tax: {
      enabled: boolean;
      taxRate: number;
      pricesIncludeTax: boolean;
    };
  };
  shipping: {
    methods: {
      freeShipping: {
        enabled: boolean;
        minimumAmount: number;
      };
      flatRate: {
        enabled: boolean;
        cost: number;
      };
      expressShipping: {
        enabled: boolean;
        cost: number;
      };
    };
    options: {
      shippingCalculator: boolean;
      internationalShipping: boolean;
      shippingOrigin: string;
    };
  };
  email: {
    provider: {
      service: 'smtp' | 'sendgrid' | 'mailchimp' | 'aws-ses';
      smtp: {
        host: string;
        port: number;
        security: 'none' | 'ssl' | 'tls';
        username: string;
        password: string;
      };
    };
    notifications: {
      orderConfirmation: boolean;
      shippingConfirmation: boolean;
      orderCanceled: boolean;
      customerAccount: boolean;
      passwordReset: boolean;
      abandonedCart: boolean;
    };
  };
  cms: {
    termsAndConditions: string;
    privacyPolicy: string;
    returnPolicy: string;
    aboutUs: string;
    faq: string;
  };
  advanced: {
    analytics: {
      googleAnalyticsId: string;
      facebookPixelId: string;
      enabled: boolean;
    };
    api: {
      apiKey: string;
      webhookUrl: string;
      webhooksEnabled: boolean;
    };
    cloudinary: ICloudinaryConfig;
    performance: {
      pageCaching: boolean;
      cacheDuration: number;
      imageOptimization: boolean;
      minifyAssets: boolean;
    };
    maintenance: {
      enabled: boolean;
      message: string;
      allowAdminAccess: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
  secure: boolean;
  folder: string;
}

// Sub-schemas for nested objects
const storeInfoSchema = new Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true
  },
  storeEmail: {
    type: String,
    required: [true, 'Store email is required'],
    trim: true,
    lowercase: true
  },
  storePhone: {
    type: String,
    required: [true, 'Store phone is required'],
    trim: true
  },
  storeAddress: {
    type: String,
    required: [true, 'Store address is required'],
    trim: true
  }
});

const seoSchema = new Schema({
  metaTitle: {
    type: String,
    required: [true, 'Meta title is required'],
    trim: true
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required'],
    trim: true
  },
  metaKeywords: {
    type: String,
    required: [true, 'Meta keywords are required'],
    trim: true
  }
});

const socialMediaSchema = new Schema({
  facebook: {
    type: String,
    default: ''
  },
  instagram: {
    type: String,
    default: ''
  },
  twitter: {
    type: String,
    default: ''
  },
  youtube: {
    type: String,
    default: ''
  }
});

const stripeSchema = new Schema({
  publishableKey: {
    type: String,
    default: ''
  },
  secretKey: {
    type: String,
    default: ''
  }
});

const paypalSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  clientId: {
    type: String,
    default: ''
  },
  secret: {
    type: String,
    default: ''
  }
});

const paymentMethodsSchema = new Schema({
  creditCards: {
    type: Boolean,
    default: true
  },
  stripe: stripeSchema,
  paypal: paypalSchema,
  cashOnDelivery: {
    type: Boolean,
    default: true
  }
});

const currencySchema = new Schema({
  defaultCurrency: {
    type: String,
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud'],
    default: 'usd'
  },
  currencyFormat: {
    type: String,
    enum: ['symbol', 'code', 'symbol-code'],
    default: 'symbol'
  }
});

const taxSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  pricesIncludeTax: {
    type: Boolean,
    default: false
  }
});

const freeShippingSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  minimumAmount: {
    type: Number,
    min: 0,
    default: 0
  }
});

const flatRateShippingSchema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  }
});

const expressShippingSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  }
});

const shippingMethodsSchema = new Schema({
  freeShipping: freeShippingSchema,
  flatRate: flatRateShippingSchema,
  expressShipping: expressShippingSchema
});

const shippingOptionsSchema = new Schema({
  shippingCalculator: {
    type: Boolean,
    default: true
  },
  internationalShipping: {
    type: Boolean,
    default: false
  },
  shippingOrigin: {
    type: String,
    required: [true, 'Shipping origin is required'],
    default: 'United States'
  }
});

const smtpSchema = new Schema({
  host: {
    type: String,
    default: ''
  },
  port: {
    type: Number,
    min: 1,
    max: 65535,
    default: 587
  },
  security: {
    type: String,
    enum: ['none', 'ssl', 'tls'],
    default: 'tls'
  },
  username: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  }
});

const emailProviderSchema = new Schema({
  service: {
    type: String,
    enum: ['smtp', 'sendgrid', 'mailchimp', 'aws-ses'],
    default: 'smtp'
  },
  smtp: smtpSchema
});

const emailNotificationsSchema = new Schema({
  orderConfirmation: {
    type: Boolean,
    default: true
  },
  shippingConfirmation: {
    type: Boolean,
    default: true
  },
  orderCanceled: {
    type: Boolean,
    default: true
  },
  customerAccount: {
    type: Boolean,
    default: true
  },
  passwordReset: {
    type: Boolean,
    default: true
  },
  abandonedCart: {
    type: Boolean,
    default: false
  }
});

const cmsSchema = new Schema({
  termsAndConditions: {
    type: String,
    required: [true, 'Terms and conditions content is required'],
    default: 'Please update your terms and conditions.'
  },
  privacyPolicy: {
    type: String,
    required: [true, 'Privacy policy content is required'],
    default: 'Please update your privacy policy.'
  },
  returnPolicy: {
    type: String,
    required: [true, 'Return policy content is required'],
    default: 'Please update your return policy.'
  },
  aboutUs: {
    type: String,
    required: [true, 'About us content is required'],
    default: 'Please update your about us content.'
  },
  faq: {
    type: String,
    required: [true, 'FAQ content is required'],
    default: 'Please update your FAQ content.'
  }
});

const analyticsSchema = new Schema({
  googleAnalyticsId: {
    type: String,
    default: ''
  },
  facebookPixelId: {
    type: String,
    default: ''
  },
  enabled: {
    type: Boolean,
    default: false
  }
});

const apiSchema = new Schema({
  apiKey: {
    type: String,
    required: [true, 'API key is required'],
    default: ''
  },
  webhookUrl: {
    type: String,
    default: ''
  },
  webhooksEnabled: {
    type: Boolean,
    default: false
  }
});

const cloudinarySchema = new Schema({
  cloudName: {
    type: String,
    required: [true, 'Cloudinary cloud name is required'],
    trim: true
  },
  apiKey: {
    type: String,
    required: [true, 'Cloudinary API key is required'],
    trim: true
  },
  apiSecret: {
    type: String,
    required: [true, 'Cloudinary API secret is required'],
    trim: true
  },
  uploadPreset: {
    type: String,
    default: ''
  },
  secure: {
    type: Boolean,
    default: true
  },
  folder: {
    type: String,
    default: 'ecommerce'
  }
});

const performanceSchema = new Schema({
  pageCaching: {
    type: Boolean,
    default: true
  },
  cacheDuration: {
    type: Number,
    min: 1,
    default: 3600
  },
  imageOptimization: {
    type: Boolean,
    default: true
  },
  minifyAssets: {
    type: Boolean,
    default: true
  }
});

const maintenanceSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: [true, 'Maintenance message is required'],
    default: "We're currently performing maintenance. Please check back later."
  },
  allowAdminAccess: {
    type: Boolean,
    default: true
  }
});

// Main settings schema
const settingsSchema = new Schema(
  {
    general: {
      storeInfo: storeInfoSchema,
      seo: seoSchema,
      socialMedia: socialMediaSchema
    },
    payment: {
      paymentMethods: paymentMethodsSchema,
      currency: currencySchema,
      tax: taxSchema
    },
    shipping: {
      methods: shippingMethodsSchema,
      options: shippingOptionsSchema
    },
    email: {
      provider: emailProviderSchema,
      notifications: emailNotificationsSchema
    },
    cms: cmsSchema,
    advanced: {
      analytics: analyticsSchema,
      api: apiSchema,
      cloudinary: cloudinarySchema,
      performance: performanceSchema,
      maintenance: maintenanceSchema
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const Settings =
  mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', settingsSchema);
