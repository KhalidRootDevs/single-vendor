'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Chart } from '@/components/ui/chart';
import { useState } from 'react';
import { useDashboard, type TopProduct } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

function TrendLabel({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <p className="flex items-center text-xs text-muted-foreground">
      {up ? (
        <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
      ) : (
        <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
      )}
      <span className={up ? 'text-green-500' : 'text-red-500'}>
        {up ? '+' : ''}
        {pct}%
      </span>
      <span className="ml-1">from last period</span>
    </p>
  );
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function TopProductsList({ products }: { products: TopProduct[] }) {
  // Bars are relative to the leader, so the top seller always fills the track
  // and the rest read as a share of it.
  const max = Math.max(...products.map((p) => p.sales), 1);

  return (
    <ol className="space-y-3">
      {products.map((product, index) => {
        const up = product.growth >= 0;

        return (
          <li key={`${product.name}-${index}`} className="flex gap-3">
            <span className="w-4 shrink-0 text-sm tabular-nums text-muted-foreground">
              {index + 1}
            </span>

            {/* min-w-0 lets the name truncate instead of stretching the row */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="truncate text-sm font-medium"
                  title={product.name}
                >
                  {product.name}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {product.sales.toLocaleString()}
                </span>
              </div>

              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(product.sales / max) * 100}%` }}
                />
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {currency.format(product.revenue)}
                </span>
                <span
                  className={`flex shrink-0 items-center tabular-nums ${
                    up ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {up ? (
                    <ArrowUp className="mr-0.5 h-3 w-3" />
                  ) : (
                    <ArrowDown className="mr-0.5 h-3 w-3" />
                  )}
                  {Math.abs(product.growth)}%
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading, error } = useDashboard('30d');

  const s = data?.stats;
  const charts = data?.charts;
  const topProducts = data?.lists?.topProducts;

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your store&apos;s performance and recent activity.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load dashboard data: {error}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* ── Stat cards ─────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        $
                        {s?.revenue.current.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <TrendLabel pct={s?.revenue.changePercent ?? 0} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Orders
                      </CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        +{s?.orders.current.toLocaleString()}
                      </div>
                      <TrendLabel pct={s?.orders.changePercent ?? 0} />
                      {(s?.orders.pending ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s?.orders.pending} pending
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Products
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {s?.products.total.toLocaleString()}
                      </div>
                      <p className="flex items-center text-xs text-muted-foreground">
                        <ArrowUp className="mr-1 h-3 w-3 text-green-500" />+
                        {s?.products.newThisMonth} new this month
                      </p>
                      {(s?.products.lowStock ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-amber-500">
                          {s?.products.lowStock} low stock
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        New Customers
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        +{s?.customers.current.toLocaleString()}
                      </div>
                      <TrendLabel pct={s?.customers.changePercent ?? 0} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* ── Charts ─────────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Monthly revenue for the current year
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <Chart
                        type="bar"
                        data={charts?.revenueByMonth ?? []}
                        options={{
                          xAxis: { dataKey: 'month' },
                          datasets: [
                            {
                              dataKey: 'revenue',
                              label: 'Revenue',
                              backgroundColor: 'hsl(var(--primary))',
                              borderRadius: 4
                            }
                          ]
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>
                    Units sold this month, best first
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* No fixed height — five rows land a touch over 300px and a
                      scrollbar for those few pixels looks worse than the extra
                      height. The grid stretches both cards to match anyway. */}
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (topProducts?.length ?? 0) > 0 ? (
                    <TopProductsList products={topProducts ?? []} />
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No sales data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Detailed performance metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[400px] items-center justify-center rounded-md border">
                  <p className="text-muted-foreground">
                    Advanced analytics content will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  Generate and download custom reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[400px] items-center justify-center rounded-md border">
                  <p className="text-muted-foreground">
                    Reports content will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
