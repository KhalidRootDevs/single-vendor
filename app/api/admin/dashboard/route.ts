import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

// Month labels indexed 1-12
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10; // 1 decimal place
}

/**
 * GET /api/admin/dashboard?range=30d
 * Runs all aggregations in parallel. Single DB round-trip set.
 *
 * range: 7d | 30d | 90d | 1y  (default 30d)
 *   Controls the "current vs previous period" comparison window.
 *   Monthly charts always use the current calendar year.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') || '30d';

    const rangeDaysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const rangeDays = rangeDaysMap[rangeParam] ?? 30;

    const now = new Date();
    const periodStart = new Date(now.getTime() - rangeDays * 86_400_000);
    const prevPeriodStart = new Date(
      periodStart.getTime() - rangeDays * 86_400_000
    );
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ── All 7 aggregations run in parallel ──────────────────────────────────
    const [
      periodOrdersResult,
      monthlyOrdersResult,
      monthlyCustomersResult,
      ordersByHourResult,
      topProductsResult,
      productStatsResult,
      customerSegmentsResult,
      recentOrders,
      periodCustomersResult
    ] = await Promise.all([
      // 1. Current period vs previous period — orders + revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: prevPeriodStart } } },
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ['$createdAt', periodStart] },
                'current',
                'previous'
              ]
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]),

      // 2. Monthly revenue + orders for current calendar year
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 3. New customers per month for current calendar year
      User.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, guestAccount: false } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            customers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 4. Orders by hour (last 30 days) — replaces static hourlyTraffic
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(now.getTime() - 30 * 86_400_000) }
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 5. Top 5 products by sales — with month-over-month growth
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              productId: '$items.productId',
              name: '$items.name',
              period: {
                $cond: [
                  { $gte: ['$createdAt', startOfThisMonth] },
                  'current',
                  'previous'
                ]
              }
            },
            sales: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.price', '$items.quantity'] }
            }
          }
        },
        {
          $group: {
            _id: { productId: '$_id.productId', name: '$_id.name' },
            periods: {
              $push: {
                period: '$_id.period',
                sales: '$sales',
                revenue: '$revenue'
              }
            }
          }
        },
        {
          $addFields: {
            currentSales: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$periods',
                    cond: { $eq: ['$$this.period', 'current'] }
                  }
                },
                initialValue: 0,
                in: { $add: ['$$value', '$$this.sales'] }
              }
            },
            currentRevenue: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$periods',
                    cond: { $eq: ['$$this.period', 'current'] }
                  }
                },
                initialValue: 0,
                in: { $add: ['$$value', '$$this.revenue'] }
              }
            },
            previousSales: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$periods',
                    cond: { $eq: ['$$this.period', 'previous'] }
                  }
                },
                initialValue: 0,
                in: { $add: ['$$value', '$$this.sales'] }
              }
            }
          }
        },
        { $sort: { currentSales: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            name: '$_id.name',
            sales: '$currentSales',
            revenue: { $round: ['$currentRevenue', 2] },
            growth: {
              $round: [
                {
                  $cond: [
                    { $gt: ['$previousSales', 0] },
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: ['$currentSales', '$previousSales'] },
                            '$previousSales'
                          ]
                        },
                        100
                      ]
                    },
                    { $cond: [{ $gt: ['$currentSales', 0] }, 100, 0] }
                  ]
                },
                1
              ]
            }
          }
        }
      ]),

      // 6. Product stats — single pass
      Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$active', 1, 0] } },
            lowStock: {
              $sum: {
                $cond: [
                  { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 5] }] },
                  1,
                  0
                ]
              }
            },
            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
            newThisMonth: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startOfThisMonth] }, 1, 0]
              }
            }
          }
        }
      ]),

      // 7. Customer segments — group by order history per customer
      Order.aggregate([
        {
          $group: {
            _id: '$customer.id',
            orderCount: { $sum: 1 },
            totalSpend: { $sum: '$total' }
          }
        },
        {
          $group: {
            _id: null,
            newCount: {
              $sum: { $cond: [{ $eq: ['$orderCount', 1] }, 1, 0] }
            },
            returningCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$orderCount', 1] },
                      { $lt: ['$totalSpend', 500] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            vipCount: {
              $sum: { $cond: [{ $gte: ['$totalSpend', 500] }, 1, 0] }
            },
            customersWithOrders: { $sum: 1 },
            newRevenue: {
              $sum: { $cond: [{ $eq: ['$orderCount', 1] }, '$totalSpend', 0] }
            },
            returningRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$orderCount', 1] },
                      { $lt: ['$totalSpend', 500] }
                    ]
                  },
                  '$totalSpend',
                  0
                ]
              }
            },
            vipRevenue: {
              $sum: {
                $cond: [{ $gte: ['$totalSpend', 500] }, '$totalSpend', 0]
              }
            }
          }
        }
      ]),

      // 8. Recent 10 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select(
          'orderNumber customer.name customer.email total status paymentStatus createdAt'
        )
        .lean(),

      // 9. New customers current vs previous period
      User.aggregate([
        {
          $match: { createdAt: { $gte: prevPeriodStart }, guestAccount: false }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ['$createdAt', periodStart] },
                'current',
                'previous'
              ]
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // ── Shape results ────────────────────────────────────────────────────────

    // Period stats
    const ordersCurrent = periodOrdersResult.find((r) => r._id === 'current');
    const ordersPrevious = periodOrdersResult.find((r) => r._id === 'previous');
    const revCurrent = ordersCurrent?.revenue ?? 0;
    const revPrevious = ordersPrevious?.revenue ?? 0;
    const ordCurrent = ordersCurrent?.orders ?? 0;
    const ordPrevious = ordersPrevious?.orders ?? 0;
    const pendingOrders = ordersCurrent?.pending ?? 0;

    // Customer period stats
    const custCurrent =
      periodCustomersResult.find((r) => r._id === 'current')?.count ?? 0;
    const custPrevious =
      periodCustomersResult.find((r) => r._id === 'previous')?.count ?? 0;

    // Product stats
    const pStats = productStatsResult[0] ?? {
      total: 0,
      active: 0,
      lowStock: 0,
      outOfStock: 0,
      newThisMonth: 0
    };

    // Avg order value
    const avgCurrent = ordCurrent > 0 ? revCurrent / ordCurrent : 0;
    const avgPrevious = ordPrevious > 0 ? revPrevious / ordPrevious : 0;

    // Monthly chart — fill all 12 months
    const ordersByMonth = new Map(monthlyOrdersResult.map((r) => [r._id, r]));
    const customersByMonth = new Map(
      monthlyCustomersResult.map((r) => [r._id, r])
    );

    const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const o = ordersByMonth.get(m);
      const c = customersByMonth.get(m);
      return {
        month: MONTH_LABELS[i],
        revenue: Math.round((o?.revenue ?? 0) * 100) / 100,
        orders: o?.orders ?? 0,
        customers: c?.customers ?? 0
      };
    });

    // Orders by hour — fill all 24 hours
    const hourMap = new Map(ordersByHourResult.map((r) => [r._id, r.orders]));
    const ordersByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, '0'),
      orders: hourMap.get(i) ?? 0
    }));

    // Top products pie (share of this month's sales)
    const totalCurrentSales =
      topProductsResult.reduce((s, p) => s + p.sales, 0) || 1;
    const topProductsPie = topProductsResult.map((p) => ({
      name: p.name,
      value: Math.round((p.sales / totalCurrentSales) * 100)
    }));

    // Customer segments
    const seg = customerSegmentsResult[0] ?? {
      newCount: 0,
      returningCount: 0,
      vipCount: 0,
      customersWithOrders: 0,
      newRevenue: 0,
      returningRevenue: 0,
      vipRevenue: 0
    };
    const totalWithOrders = seg.customersWithOrders || 1;
    const customerSegments = [
      {
        segment: 'New Customers',
        count: seg.newCount,
        percentage: Math.round((seg.newCount / totalWithOrders) * 100),
        value: Math.round(seg.newRevenue)
      },
      {
        segment: 'Returning Customers',
        count: seg.returningCount,
        percentage: Math.round((seg.returningCount / totalWithOrders) * 100),
        value: Math.round(seg.returningRevenue)
      },
      {
        segment: 'VIP Customers',
        count: seg.vipCount,
        percentage: Math.round((seg.vipCount / totalWithOrders) * 100),
        value: Math.round(seg.vipRevenue)
      }
    ];

    return NextResponse.json({
      stats: {
        revenue: {
          current: Math.round(revCurrent * 100) / 100,
          previous: Math.round(revPrevious * 100) / 100,
          changePercent: pctChange(revCurrent, revPrevious)
        },
        orders: {
          current: ordCurrent,
          previous: ordPrevious,
          changePercent: pctChange(ordCurrent, ordPrevious),
          pending: pendingOrders
        },
        products: {
          total: pStats.total,
          active: pStats.active,
          newThisMonth: pStats.newThisMonth,
          lowStock: pStats.lowStock,
          outOfStock: pStats.outOfStock
        },
        customers: {
          current: custCurrent,
          previous: custPrevious,
          changePercent: pctChange(custCurrent, custPrevious)
        },
        avgOrderValue: {
          current: Math.round(avgCurrent * 100) / 100,
          previous: Math.round(avgPrevious * 100) / 100,
          changePercent: pctChange(avgCurrent, avgPrevious)
        }
      },
      charts: {
        revenueByMonth,
        ordersByHour,
        topProductsPie
      },
      lists: {
        topProducts: topProductsResult,
        recentOrders: recentOrders.map((o: any) => ({
          orderNumber: o.orderNumber,
          customerName: o.customer?.name ?? 'Guest',
          customerEmail: o.customer?.email ?? '',
          total: o.total,
          status: o.status,
          paymentStatus: o.paymentStatus,
          date: o.createdAt
        })),
        customerSegments
      }
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
