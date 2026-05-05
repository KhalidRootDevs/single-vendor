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
import { useDashboard } from '@/hooks/use-dashboard';
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading, error } = useDashboard('30d');

  const s = data?.stats;
  const charts = data?.charts;

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
                    Best selling products this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (charts?.topProductsPie?.length ?? 0) > 0 ? (
                      <Chart
                        type="pie"
                        data={charts?.topProductsPie ?? []}
                        options={{
                          dataKey: 'value',
                          datasets: [
                            {
                              backgroundColor: [
                                'hsl(var(--primary))',
                                'hsl(var(--primary) / 0.8)',
                                'hsl(var(--primary) / 0.6)',
                                'hsl(var(--primary) / 0.4)',
                                'hsl(var(--primary) / 0.2)'
                              ]
                            }
                          ]
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No sales data yet
                      </div>
                    )}
                  </div>
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
