'use client';

import AdvanceSettings from '@/components/forms/settings/advance-settings';
import CmsSettings from '@/components/forms/settings/cms-settings';
import EmailSettings from '@/components/forms/settings/email-settings';
import GeneralSettings from '@/components/forms/settings/general-settings';
import PaymentMethodSettings from '@/components/forms/settings/payment-method-settings';
import ShippingSettings from '@/components/forms/settings/shipping-settings';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { SettingsFormData, settingsSchema } from '@/lib/validations/index';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldErrors, FormProvider, useForm } from 'react-hook-form';

// Strip [HIDDEN] / [UPDATED] sentinel values returned by the API so they are
// never written back to the database on the next save.
const stripHidden = (val: string | undefined): string =>
  val === '[HIDDEN]' || val === '[UPDATED]' ? '' : val || '';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoUrl] = useState<string | null>(
    '/placeholder.svg?height=100&width=200'
  );
  const [faviconUrl] = useState<string | null>(
    '/placeholder.svg?height=32&width=32'
  );

  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      general: {
        storeInfo: {
          storeName: '',
          storeEmail: '',
          storePhone: '',
          storeAddress: ''
        },
        seo: {
          metaTitle: '',
          metaDescription: '',
          metaKeywords: ''
        },
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: ''
        }
      },
      payment: {
        paymentMethods: {
          creditCards: true,
          stripe: {
            publishableKey: '',
            secretKey: ''
          },
          paypal: {
            enabled: false,
            clientId: '',
            secret: ''
          },
          cashOnDelivery: true
        },
        currency: {
          defaultCurrency: 'usd',
          currencyFormat: 'symbol'
        },
        tax: {
          enabled: false,
          taxRate: 0,
          pricesIncludeTax: false
        }
      },
      shipping: {
        methods: {
          freeShipping: {
            enabled: false,
            minimumAmount: 0
          },
          flatRate: {
            enabled: true,
            cost: 0
          },
          expressShipping: {
            enabled: false,
            cost: 0
          }
        },
        options: {
          shippingCalculator: true,
          internationalShipping: false,
          shippingOrigin: ''
        }
      },
      email: {
        provider: {
          service: 'smtp',
          smtp: {
            host: '',
            port: 587,
            security: 'tls',
            username: '',
            password: ''
          }
        },
        notifications: {
          orderConfirmation: true,
          shippingConfirmation: true,
          orderCanceled: true,
          customerAccount: true,
          passwordReset: true,
          abandonedCart: false
        }
      },
      cms: {
        termsAndConditions: '',
        privacyPolicy: '',
        returnPolicy: '',
        aboutUs: '',
        faq: ''
      },
      advanced: {
        analytics: {
          googleAnalyticsId: '',
          facebookPixelId: '',
          enabled: false
        },
        api: {
          apiKey: '',
          webhookUrl: '',
          webhooksEnabled: false
        },
        cloudinary: {
          cloudName: '',
          apiKey: '',
          apiSecret: '',
          uploadPreset: '',
          secure: true,
          folder: 'ecommerce'
        },
        performance: {
          pageCaching: true,
          cacheDuration: 3600,
          imageOptimization: true,
          minifyAssets: true
        },
        maintenance: {
          enabled: false,
          message:
            "We're currently performing maintenance. Please check back later.",
          allowAdminAccess: true
        }
      }
    }
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = methods;

  // Derive which tabs have validation errors
  const tabHasError = {
    general: Boolean(errors.general),
    payment: Boolean(errors.payment),
    shipping: Boolean(errors.shipping),
    email: Boolean(errors.email),
    cms: Boolean(errors.cms),
    advanced: Boolean(errors.advanced)
  };

  // Fetch settings on component mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/settings');

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();

        if (data.settings) {
          const transformedSettings = transformSettingsFromAPI(data.settings);
          reset(transformedSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings. Using default values.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [reset]);

  // Transform API response to form structure, stripping [HIDDEN] sentinel values
  const transformSettingsFromAPI = (apiSettings: any): SettingsFormData => {
    return {
      general: {
        storeInfo: {
          storeName: apiSettings.general?.storeInfo?.storeName || '',
          storeEmail: apiSettings.general?.storeInfo?.storeEmail || '',
          storePhone: apiSettings.general?.storeInfo?.storePhone || '',
          storeAddress: apiSettings.general?.storeInfo?.storeAddress || ''
        },
        seo: {
          metaTitle: apiSettings.general?.seo?.metaTitle || '',
          metaDescription: apiSettings.general?.seo?.metaDescription || '',
          metaKeywords: apiSettings.general?.seo?.metaKeywords || ''
        },
        socialMedia: {
          facebook: apiSettings.general?.socialMedia?.facebook || '',
          instagram: apiSettings.general?.socialMedia?.instagram || '',
          twitter: apiSettings.general?.socialMedia?.twitter || '',
          youtube: apiSettings.general?.socialMedia?.youtube || ''
        }
      },
      payment: {
        paymentMethods: {
          creditCards: apiSettings.payment?.paymentMethods?.creditCards ?? true,
          stripe: {
            publishableKey: stripHidden(
              apiSettings.payment?.paymentMethods?.stripe?.publishableKey
            ),
            secretKey: stripHidden(
              apiSettings.payment?.paymentMethods?.stripe?.secretKey
            )
          },
          paypal: {
            enabled:
              apiSettings.payment?.paymentMethods?.paypal?.enabled ?? false,
            clientId: stripHidden(
              apiSettings.payment?.paymentMethods?.paypal?.clientId
            ),
            secret: stripHidden(
              apiSettings.payment?.paymentMethods?.paypal?.secret
            )
          },
          cashOnDelivery:
            apiSettings.payment?.paymentMethods?.cashOnDelivery ?? true
        },
        currency: {
          defaultCurrency:
            apiSettings.payment?.currency?.defaultCurrency || 'usd',
          currencyFormat:
            apiSettings.payment?.currency?.currencyFormat || 'symbol'
        },
        tax: {
          enabled: apiSettings.payment?.tax?.enabled ?? false,
          taxRate: apiSettings.payment?.tax?.taxRate || 0,
          pricesIncludeTax: apiSettings.payment?.tax?.pricesIncludeTax ?? false
        }
      },
      shipping: {
        methods: {
          freeShipping: {
            enabled:
              apiSettings.shipping?.methods?.freeShipping?.enabled ?? false,
            minimumAmount:
              apiSettings.shipping?.methods?.freeShipping?.minimumAmount || 0
          },
          flatRate: {
            enabled: apiSettings.shipping?.methods?.flatRate?.enabled ?? true,
            cost: apiSettings.shipping?.methods?.flatRate?.cost || 0
          },
          expressShipping: {
            enabled:
              apiSettings.shipping?.methods?.expressShipping?.enabled ?? false,
            cost: apiSettings.shipping?.methods?.expressShipping?.cost || 0
          }
        },
        options: {
          shippingCalculator:
            apiSettings.shipping?.options?.shippingCalculator ?? true,
          internationalShipping:
            apiSettings.shipping?.options?.internationalShipping ?? false,
          shippingOrigin: apiSettings.shipping?.options?.shippingOrigin || ''
        }
      },
      email: {
        provider: {
          service: apiSettings.email?.provider?.service || 'smtp',
          smtp: {
            host: apiSettings.email?.provider?.smtp?.host || '',
            port: apiSettings.email?.provider?.smtp?.port || 587,
            security: apiSettings.email?.provider?.smtp?.security || 'tls',
            username: stripHidden(apiSettings.email?.provider?.smtp?.username),
            password: stripHidden(apiSettings.email?.provider?.smtp?.password)
          }
        },
        notifications: {
          orderConfirmation:
            apiSettings.email?.notifications?.orderConfirmation ?? true,
          shippingConfirmation:
            apiSettings.email?.notifications?.shippingConfirmation ?? true,
          orderCanceled:
            apiSettings.email?.notifications?.orderCanceled ?? true,
          customerAccount:
            apiSettings.email?.notifications?.customerAccount ?? true,
          passwordReset:
            apiSettings.email?.notifications?.passwordReset ?? true,
          abandonedCart:
            apiSettings.email?.notifications?.abandonedCart ?? false
        }
      },
      cms: {
        termsAndConditions: apiSettings.cms?.termsAndConditions || '',
        privacyPolicy: apiSettings.cms?.privacyPolicy || '',
        returnPolicy: apiSettings.cms?.returnPolicy || '',
        aboutUs: apiSettings.cms?.aboutUs || '',
        faq: apiSettings.cms?.faq || ''
      },
      advanced: {
        analytics: {
          googleAnalyticsId:
            apiSettings.advanced?.analytics?.googleAnalyticsId || '',
          facebookPixelId:
            apiSettings.advanced?.analytics?.facebookPixelId || '',
          enabled: apiSettings.advanced?.analytics?.enabled ?? false
        },
        api: {
          apiKey: stripHidden(apiSettings.advanced?.api?.apiKey),
          webhookUrl: apiSettings.advanced?.api?.webhookUrl || '',
          webhooksEnabled: apiSettings.advanced?.api?.webhooksEnabled ?? false
        },
        cloudinary: {
          cloudName: apiSettings.advanced?.cloudinary?.cloudName || '',
          apiKey: stripHidden(apiSettings.advanced?.cloudinary?.apiKey),
          apiSecret: stripHidden(apiSettings.advanced?.cloudinary?.apiSecret),
          uploadPreset: apiSettings.advanced?.cloudinary?.uploadPreset || '',
          secure: apiSettings.advanced?.cloudinary?.secure ?? true,
          folder: apiSettings.advanced?.cloudinary?.folder || 'ecommerce'
        },
        performance: {
          pageCaching: apiSettings.advanced?.performance?.pageCaching ?? true,
          cacheDuration:
            apiSettings.advanced?.performance?.cacheDuration || 3600,
          imageOptimization:
            apiSettings.advanced?.performance?.imageOptimization ?? true,
          minifyAssets: apiSettings.advanced?.performance?.minifyAssets ?? true
        },
        maintenance: {
          enabled: apiSettings.advanced?.maintenance?.enabled ?? false,
          message:
            apiSettings.advanced?.maintenance?.message ||
            "We're currently performing maintenance. Please check back later.",
          allowAdminAccess:
            apiSettings.advanced?.maintenance?.allowAdminAccess ?? true
        }
      }
    };
  };

  const handleLogoChange = (file: File | null) => setLogoFile(file);
  const handleFaviconChange = (file: File | null) => setFaviconFile(file);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: data })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result = await response.json();

      toast({
        title: 'Settings saved',
        description:
          result.message || 'Your settings have been saved successfully.'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to the first tab that has validation errors and notify the user
  const onError = (fieldErrors: FieldErrors<SettingsFormData>) => {
    const tabs = [
      'general',
      'payment',
      'shipping',
      'email',
      'cms',
      'advanced'
    ] as const;

    for (const tab of tabs) {
      if (fieldErrors[tab]) {
        setActiveTab(tab);
        toast({
          title: 'Validation errors',
          description: `Please fix the highlighted errors in the "${tab}" tab before saving.`,
          variant: 'destructive'
        });
        return;
      }
    }
  };

  // Helper function to handle boolean changes (used by child components)
  const handleBooleanChange = (path: string, value: boolean) => {
    setValue(path as any, value);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your store settings and configurations.
          </p>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit, onError)}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
                <TabsTrigger value="general" className="relative">
                  General
                  {tabHasError.general && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="payment" className="relative">
                  Payment
                  {tabHasError.payment && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="shipping" className="relative">
                  Shipping
                  {tabHasError.shipping && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="email" className="relative">
                  Email
                  {tabHasError.email && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="cms" className="relative">
                  CMS
                  {tabHasError.cms && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="advanced" className="relative">
                  Advanced
                  {tabHasError.advanced && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general">
                <GeneralSettings
                  logo={logoFile ?? logoUrl}
                  favicon={faviconFile ?? faviconUrl}
                  handleLogoChange={handleLogoChange}
                  handleFaviconChange={handleFaviconChange}
                />
              </TabsContent>

              {/* Payment Settings */}
              <TabsContent value="payment" className="space-y-4">
                <PaymentMethodSettings
                  handleBooleanChange={handleBooleanChange}
                />
              </TabsContent>

              {/* Shipping Settings */}
              <TabsContent value="shipping" className="space-y-4">
                <ShippingSettings handleBooleanChange={handleBooleanChange} />
              </TabsContent>

              {/* Email Settings */}
              <TabsContent value="email" className="space-y-4">
                <EmailSettings handleBooleanChange={handleBooleanChange} />
              </TabsContent>

              {/* CMS Settings */}
              <TabsContent value="cms" className="space-y-4">
                <CmsSettings />
              </TabsContent>

              {/* Advanced Settings */}
              <TabsContent value="advanced" className="space-y-4">
                <AdvanceSettings handleBooleanChange={handleBooleanChange} />
              </TabsContent>
            </Tabs>

            <div className="mt-5 flex justify-end">
              <Button type="submit" disabled={isSaving || isSubmitting}>
                {isSaving || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Container>
  );
}
