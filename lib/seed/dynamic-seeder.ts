import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import connectDB from '@/lib/database';

// Configuration for different product types
const PRODUCT_CONFIG = {
  smartphones: {
    brands: [
      'Apple',
      'Samsung',
      'Google',
      'OnePlus',
      'Xiaomi',
      'Oppo',
      'Vivo',
      'Realme'
    ],
    features: [
      '5G',
      'OLED Display',
      'Fast Charging',
      'Wireless Charging',
      'Water Resistant',
      'Face Recognition',
      'Fingerprint Sensor'
    ],
    colors: [
      'Black',
      'White',
      'Blue',
      'Green',
      'Purple',
      'Red',
      'Silver',
      'Gold'
    ],
    storage: ['64GB', '128GB', '256GB', '512GB', '1TB']
  },
  laptops: {
    brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer'],
    features: [
      'SSD Storage',
      'Dedicated GPU',
      'Thunderbolt',
      'Backlit Keyboard',
      'Touchscreen',
      '2-in-1',
      'Gaming'
    ],
    colors: ['Silver', 'Space Gray', 'Black', 'Blue', 'White'],
    processors: [
      'Intel i5',
      'Intel i7',
      'Intel i9',
      'Ryzen 5',
      'Ryzen 7',
      'Ryzen 9',
      'M1',
      'M2',
      'M3'
    ]
  },
  audio: {
    brands: [
      'Sony',
      'Bose',
      'JBL',
      'Sennheiser',
      'Audio-Technica',
      'Beats',
      'Samsung',
      'Apple'
    ],
    features: [
      'Noise Cancelling',
      'Wireless',
      'Water Resistant',
      'Voice Assistant',
      'Long Battery',
      'Fast Charge'
    ],
    colors: ['Black', 'White', 'Blue', 'Red', 'Silver', 'Pink']
  },
  gaming: {
    brands: [
      'Sony',
      'Microsoft',
      'Nintendo',
      'Steam',
      'Razer',
      'Logitech',
      'Corsair'
    ],
    features: [
      '4K Gaming',
      'VR Ready',
      'Ray Tracing',
      'High Refresh Rate',
      'Customizable RGB',
      'Wireless'
    ],
    colors: ['Black', 'White', 'Special Edition']
  },
  general: {
    brands: ['Generic', 'Premium', 'Elite', 'Pro', 'Standard', 'Advanced'],
    features: [
      'Premium Quality',
      'Eco Friendly',
      'Durable',
      'Lightweight',
      'Compact',
      'Multi-functional'
    ],
    colors: ['Black', 'White', 'Gray', 'Blue', 'Red']
  }
};

// Predefined category structure
const CATEGORY_STRUCTURE = [
  {
    name: 'Electronics',
    children: ['Smartphones', 'Laptops', 'Tablets', 'Wearables', 'Cameras']
  },
  {
    name: 'Audio',
    children: ['Headphones', 'Speakers', 'Earbuds', 'Home Audio']
  },
  {
    name: 'Gaming',
    children: [
      'Gaming Consoles',
      'Gaming PCs',
      'Gaming Accessories',
      'VR Headsets'
    ]
  },
  {
    name: 'Home Appliances',
    children: ['Kitchen', 'Cleaning', 'Climate Control', 'Personal Care']
  },
  {
    name: 'Fashion',
    children: ["Men's Clothing", "Women's Clothing", 'Shoes', 'Accessories']
  }
];

interface ProductConfig {
  brands: string[];
  features: string[];
  colors?: string[];
  storage?: string[];
  processors?: string[];
  editions?: string[];
}

interface SeederOptions {
  categoriesCount: number;
  productsCount: number;
  clearExisting?: boolean;
}

interface SeederResult {
  categories: number;
  products: number;
  timeElapsed: number;
}

export class DynamicSeeder {
  private createdCategories: mongoose.Types.ObjectId[] = [];

  async seed(options: SeederOptions): Promise<SeederResult> {
    const startTime = Date.now();

    try {
      await connectDB();

      if (options.clearExisting) {
        console.log('🗑️ Clearing existing data...');
        await this.clearDatabase();
      }

      console.log(
        `🌱 Seeding ${options.categoriesCount} categories and ${options.productsCount} products...`
      );

      // Create categories
      const categories = await this.createCategories(options.categoriesCount);
      this.createdCategories = categories.map(
        (cat) => cat._id as mongoose.Types.ObjectId
      );

      // Create products
      const products = await this.createProducts(options.productsCount);

      const timeElapsed = Date.now() - startTime;

      console.log('✅ Seeding completed successfully!');
      console.log(
        `📊 Created: ${categories.length} categories, ${products.length} products`
      );
      console.log(`⏱️ Time elapsed: ${(timeElapsed / 1000).toFixed(2)}s`);

      return {
        categories: categories.length,
        products: products.length,
        timeElapsed
      };
    } catch (error) {
      console.error('❌ Seeding error:', error);
      throw error;
    }
  }

  private async createCategories(count: number) {
    const categories = [];
    const usedNames = new Set<string>();

    // First, create some structured categories
    for (const mainCategory of CATEGORY_STRUCTURE) {
      if (categories.length >= count) break;

      const mainCat = await this.createCategory({
        name: mainCategory.name,
        description: faker.commerce.productDescription(),
        featured: faker.datatype.boolean({ probability: 0.3 }),
        parentId: null
      });
      categories.push(mainCat);
      usedNames.add(mainCategory.name);

      // Create children for this category
      for (const childName of mainCategory.children) {
        if (categories.length >= count) break;

        const childCat = await this.createCategory({
          name: childName,
          description: faker.commerce.productDescription(),
          featured: faker.datatype.boolean({ probability: 0.2 }),
          parentId: mainCat._id as mongoose.Types.ObjectId
        });
        categories.push(childCat);
        usedNames.add(childName);
      }
    }

    // Fill remaining with random categories
    while (categories.length < count) {
      const categoryName = this.generateUniqueCategoryName(usedNames);

      const category = await this.createCategory({
        name: categoryName,
        description: faker.commerce.productDescription(),
        featured: faker.datatype.boolean({ probability: 0.2 }),
        parentId:
          categories.length > 0 && faker.datatype.boolean({ probability: 0.3 })
            ? (faker.helpers.arrayElement(categories.filter((c) => !c.parentId))
                ._id as mongoose.Types.ObjectId)
            : null
      });

      categories.push(category);
      usedNames.add(categoryName);
    }

    return categories;
  }

  private async createCategory(data: {
    name: string;
    description: string;
    featured: boolean;
    parentId: mongoose.Types.ObjectId | null;
  }) {
    const categoryData = {
      name: data.name,
      description: data.description,
      image: `/images/categories/${faker.helpers
        .slugify(data.name)
        .toLowerCase()}.jpg`,
      featured: data.featured,
      active: true,
      slug: faker.helpers.slugify(data.name).toLowerCase(),
      parentId: data.parentId
    };

    return await Category.create(categoryData);
  }

  private generateUniqueCategoryName(usedNames: Set<string>): string {
    let name: string;
    do {
      name = faker.commerce.department();
    } while (usedNames.has(name));
    return name;
  }

  private async createProducts(count: number) {
    const products = [];

    for (let i = 0; i < count; i++) {
      const productType = this.getRandomProductType();
      const config = PRODUCT_CONFIG[productType] || PRODUCT_CONFIG.general;

      const product = await this.createProduct(config, productType);
      products.push(product);

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`📦 Created ${i + 1}/${count} products...`);
      }
    }

    return products;
  }

  private getRandomProductType(): keyof typeof PRODUCT_CONFIG {
    const types = Object.keys(
      PRODUCT_CONFIG
    ) as (keyof typeof PRODUCT_CONFIG)[];
    return faker.helpers.arrayElement(types);
  }

  private async createProduct(config: ProductConfig, productType: string) {
    const brand = faker.helpers.arrayElement(config.brands);
    const productName = `${brand} ${faker.commerce.productName()}`;

    const basePrice = faker.commerce.price({ min: 50, max: 2000 });
    const price = parseFloat(basePrice);
    const compareAtPrice = faker.datatype.boolean({ probability: 0.7 })
      ? price * faker.number.float({ min: 1.1, max: 1.5 })
      : undefined;

    const variantsCount = faker.number.int({ min: 1, max: 4 });
    const variants = this.createVariants(variantsCount, config, price);

    const productData = {
      name: productName,
      description: faker.commerce.productDescription(),
      price: price,
      compareAtPrice: compareAtPrice,
      cost: price * faker.number.float({ min: 0.4, max: 0.7 }),
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      barcode: faker.string.numeric(12),
      categoryId: faker.helpers.arrayElement(this.createdCategories),
      tags: faker.helpers.arrayElements(
        [
          productType,
          brand.toLowerCase(),
          ...faker.helpers.arrayElements(config.features, 3)
        ],
        faker.number.int({ min: 3, max: 8 })
      ),
      stock: faker.number.int({ min: 0, max: 1000 }),
      weight: faker.number.float({ min: 0.1, max: 5 }),
      dimensions: {
        length: faker.number.float({ min: 5, max: 50 }),
        width: faker.number.float({ min: 5, max: 30 }),
        height: faker.number.float({ min: 1, max: 20 })
      },
      brand: brand,
      active: faker.datatype.boolean({ probability: 0.9 }),
      featured: faker.datatype.boolean({ probability: 0.2 }),
      rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 0, max: 1000 }),
      salesCount: faker.number.int({ min: 0, max: 5000 }),
      variants: variants,
      seo: {
        title: `${productName} - Buy Now`,
        description: faker.lorem.sentence(),
        keywords: faker.helpers
          .arrayElements([productType, brand, ...config.features], 5)
          .join(', ')
      },
      images: Array.from(
        { length: faker.number.int({ min: 1, max: 4 }) },
        (_, i) =>
          `/images/products/${faker.helpers
            .slugify(productName)
            .toLowerCase()}-${i + 1}.jpg`
      )
    };

    return await Product.create(productData);
  }

  private createVariants(
    count: number,
    config: ProductConfig,
    basePrice: number
  ) {
    const variants = [];
    const usedCombinations = new Set<string>();

    for (let i = 0; i < count; i++) {
      let attributes: Record<string, string>;
      let combinationKey: string;

      // Ensure unique attribute combinations
      do {
        attributes = {};

        if (config.colors) {
          attributes.color = faker.helpers.arrayElement(config.colors);
        }

        if (config.storage) {
          attributes.storage = faker.helpers.arrayElement(config.storage);
        }

        if (config.processors) {
          attributes.processor = faker.helpers.arrayElement(config.processors);
        }

        if (config.editions) {
          attributes.edition = faker.helpers.arrayElement(config.editions);
        }

        combinationKey = JSON.stringify(attributes);
      } while (
        usedCombinations.has(combinationKey) &&
        usedCombinations.size < Object.keys(attributes).length * 5
      );

      usedCombinations.add(combinationKey);

      const variantPrice =
        basePrice * faker.number.float({ min: 0.8, max: 1.5 });

      variants.push({
        sku: `VAR-${faker.string.alphanumeric(6).toUpperCase()}`,
        attributes,
        price: variantPrice,
        stock: faker.number.int({ min: 0, max: 200 }),
        image: `/images/products/variant-${faker.string
          .alphanumeric(6)
          .toLowerCase()}.jpg`
      });
    }

    return variants;
  }

  async clearDatabase() {
    await Product.deleteMany({});
    await Category.deleteMany({});
  }
}

// Convenience functions
export async function seedDynamic(
  options: SeederOptions
): Promise<SeederResult> {
  const seeder = new DynamicSeeder();
  return await seeder.seed(options);
}

export async function clearDatabase() {
  const seeder = new DynamicSeeder();
  await seeder.clearDatabase();
}
