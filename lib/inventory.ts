import mongoose from 'mongoose';
import { Product } from '@/models/Product';

export interface StockRestoreItem {
  productId?: mongoose.Types.ObjectId | string | null;
  quantity: number;
  variantAttributes?: Record<string, string> | null;
}

/**
 * Restores inventory for the given line items — the inverse of the stock
 * decrement performed at order creation. Used when an order is cancelled or a
 * return is accepted.
 *
 * Variant line items restock the matching variant; items with no (or an
 * unknown) variant restock base product stock so units are never lost.
 * `salesCount` is decremented to mirror the increment done at checkout.
 *
 * Idempotency is the caller's responsibility — guard each order/return with a
 * `stockRestored` flag so this runs at most once per cancellation/return.
 */
export async function restoreStock(items: StockRestoreItem[]): Promise<void> {
  await Promise.all(
    items.map(async (item) => {
      if (!item.productId || !item.quantity || item.quantity <= 0) return;

      const attrs = item.variantAttributes;
      const hasAttrs = !!attrs && Object.keys(attrs).length > 0;

      if (hasAttrs) {
        const product = await Product.findById(item.productId).select(
          'variants'
        );
        const matchesVariant = product?.variants?.some((v) =>
          Object.keys(attrs).every((k) => v.attributes?.[k] === attrs[k])
        );

        if (matchesVariant) {
          await Product.updateOne(
            { _id: item.productId },
            {
              $inc: {
                'variants.$[v].stock': item.quantity,
                salesCount: -item.quantity
              }
            },
            { arrayFilters: [{ 'v.attributes': attrs }] }
          );
          return;
        }
      }

      // Base stock — no variant, or the variant no longer exists on the product.
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity, salesCount: -item.quantity } }
      );
    })
  );
}

/**
 * Normalizes order line items into the shape {@link restoreStock} expects.
 */
export function orderItemsToRestore(
  items: Array<{
    productId?: mongoose.Types.ObjectId | string | null;
    quantity: number;
    variant?: { attributes?: Record<string, string> } | null;
  }>
): StockRestoreItem[] {
  return items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    variantAttributes: i.variant?.attributes ?? null
  }));
}
