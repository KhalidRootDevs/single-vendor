/**
 * Payment integration tests
 * Covers: Stripe config shape, order payment status updates.
 */
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { Product } from '@/models/Product';

beforeAll(async () => {
  const uri = process.env.MONGO_URI_FOR_TESTS!;
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-only';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await Promise.all([
    Order.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({})
  ]);
});

async function createTestOrder() {
  const user = await User.create({
    name: 'Pay User',
    email: `payuser-${Date.now()}@example.com`,
    password: 'password123'
  });
  const product = await Product.create({
    name: 'Paid Product',
    description: 'A product used by the payment integration tests.',
    price: 50,
    stock: 10,
    active: true,
    images: ['https://example.com/img.jpg'],
    categoryId: new mongoose.Types.ObjectId()
  });
  return Order.create({
    customer: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: '1234567890',
      address: '1 Pay St'
    },
    items: [
      {
        id: 1,
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images[0]
      }
    ],
    subtotal: 50,
    tax: 4,
    shipping: 5.99,
    total: 59.99,
    paymentMethod: 'credit_card',
    shippingMethod: 'standard',
    shippingAddress: {
      fullName: 'Pay User',
      address: '1 Pay St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'US',
      phone: '1234567890'
    }
  });
}

describe('Stripe configuration', () => {
  it('getStripeConfig returns an object with the required shape', async () => {
    const { getStripeConfig } = await import('@/lib/admin-settings');
    const config = await getStripeConfig();

    expect(config).toHaveProperty('publishableKey');
    expect(config).toHaveProperty('secretKey');
    expect(config).toHaveProperty('enabled');
    expect(typeof config.enabled).toBe('boolean');
  });
});

describe('Order payment status updates', () => {
  it('updates paymentStatus to paid when payment succeeds', async () => {
    const order = await createTestOrder();
    expect(order.paymentStatus).toBe('pending');

    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: 'paid',
      paymentIntentId: 'pi_test_12345'
    });

    const updated = await Order.findById(order._id);
    expect(updated!.paymentStatus).toBe('paid');
    expect(updated!.paymentIntentId).toBe('pi_test_12345');
  });

  it('persists refund fields when a refund is recorded', async () => {
    const order = await createTestOrder();

    order.paymentStatus = 'refunded';
    order.refundId = 're_test_12345';
    order.refundedAmount = 59.99;
    order.refundedAt = new Date();
    await order.save();

    const updated = await Order.findById(order._id);
    expect(updated!.paymentStatus).toBe('refunded');
    expect(updated!.refundId).toBe('re_test_12345');
    expect(updated!.refundedAmount).toBe(59.99);
    expect(updated!.refundedAt).toBeInstanceOf(Date);
  });

  it('sets paymentStatus to failed without changing order status', async () => {
    const order = await createTestOrder();

    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' });

    const updated = await Order.findById(order._id);
    expect(updated!.paymentStatus).toBe('failed');
    expect(updated!.status).toBe('pending'); // order flow status unchanged
  });
});
