/**
 * Order integration tests
 * Covers: stock validation, atomic decrement (race condition), tax from settings, order number generation.
 */
import mongoose from 'mongoose';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { User } from '@/models/User';

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
    Product.deleteMany({}),
    Order.deleteMany({}),
    User.deleteMany({})
  ]);
});

async function makeProduct(stock = 5, price = 10) {
  return Product.create({
    name: `Product-${Date.now()}-${Math.random()}`,
    price,
    stock,
    active: true,
    images: ['https://example.com/img.jpg'],
    categoryId: new mongoose.Types.ObjectId()
  });
}

async function makeUser() {
  return User.create({
    name: 'Test User',
    email: `u-${Date.now()}@example.com`,
    password: 'password123'
  });
}

describe('Atomic stock decrement', () => {
  it('rejects decrement when requested quantity exceeds available stock', async () => {
    const product = await makeProduct(2); // only 2 in stock

    const result = await Product.findOneAndUpdate(
      { _id: product._id, stock: { $gte: 5 }, active: true },
      { $inc: { stock: -5, salesCount: 5 } }
    );

    // No document returned → condition failed → stock unchanged
    expect(result).toBeNull();

    const unchanged = await Product.findById(product._id);
    expect(unchanged!.stock).toBe(2);
  });

  it('prevents overselling when two concurrent orders race for qty=1 stock', async () => {
    const product = await makeProduct(1); // exactly 1 in stock

    const [r1, r2] = await Promise.all([
      Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: 1 }, active: true },
        { $inc: { stock: -1, salesCount: 1 } }
      ),
      Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: 1 }, active: true },
        { $inc: { stock: -1, salesCount: 1 } }
      )
    ]);

    const successCount = [r1, r2].filter(Boolean).length;
    expect(successCount).toBe(1); // only one succeeds

    const final = await Product.findById(product._id);
    expect(final!.stock).toBe(0); // never goes negative
  });
});

describe('Tax and shipping settings', () => {
  it('getTaxAndShipping returns a numeric taxRate between 0 and 1', async () => {
    const { getTaxAndShipping } = await import('@/lib/admin-settings');
    const { taxRate } = await getTaxAndShipping();

    expect(typeof taxRate).toBe('number');
    expect(taxRate).toBeGreaterThanOrEqual(0);
    expect(taxRate).toBeLessThanOrEqual(1);
  });

  it('getTaxAndShipping returns shippingMethods with standard cost', async () => {
    const { getTaxAndShipping } = await import('@/lib/admin-settings');
    const { shippingMethods } = await getTaxAndShipping();

    expect(typeof shippingMethods.standard).toBe('number');
    expect(shippingMethods.standard).toBeGreaterThanOrEqual(0);
  });
});

describe('Order model', () => {
  it('auto-generates a valid order number', async () => {
    const user = await makeUser();
    const product = await makeProduct(10, 20);

    const order = await Order.create({
      customer: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: '1234567890',
        address: '123 Main St'
      },
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images[0]
        }
      ],
      subtotal: 20,
      tax: 1.6,
      shipping: 5.99,
      total: 27.59,
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      shippingAddress: {
        fullName: 'Test User',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        phone: '1234567890'
      }
    });

    expect(order.orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
  });
});
