'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/ui/container';
import { Chart } from '@/components/ui/chart';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Download
} from 'lucide-react';
import { useState } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-3 w-44" />
      </CardContent>
    </Card>
  );
}

function TrendBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      <Icon
        className={`mr-1 h-3 w-3 ${up ? 'text-green-500' : 'text-red-500'}`}
      />
      <span className={up ? 'text-green-500' : 'text-red-500'}>
        {up ? '+' : ''}
        {pct}%
      </span>
      <span className="ml-1">from last period</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, error } = useDashboard(timeRange);
  const s = data?.stats;
  const charts = data?.charts;
  const lists = data?.lists;

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive insights into your store&apos;s performance and
              customer behavior.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load analytics: {error}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* ── Overview ──────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <StatSkeleton key={i} />
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
                      <TrendBadge pct={s?.revenue.changePercent ?? 0} />
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
                        {s?.orders.current.toLocaleString()}
                      </div>
                      <TrendBadge pct={s?.orders.changePercent ?? 0} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Avg Order Value
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${s?.avgOrderValue.current.toFixed(2)}
                      </div>
                      <TrendBadge pct={s?.avgOrderValue.changePercent ?? 0} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        New Customers
                      </CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {s?.customers.current.toLocaleString()}
                      </div>
                      <TrendBadge pct={s?.customers.changePercent ?? 0} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>
                    Monthly revenue — current year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <Chart
                      type="line"
                      data={charts?.revenueByMonth ?? []}
                      options={{
                        xAxis: { dataKey: 'month' },
                        datasets: [
                          {
                            dataKey: 'revenue',
                            label: 'Revenue',
                            borderColor: 'hsl(var(--primary))'
                          }
                        ]
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Orders by Hour</CardTitle>
                  <CardDescription>
                    Order distribution — last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <Chart
                      type="bar"
                      data={charts?.ordersByHour ?? []}
                      options={{
                        xAxis: { dataKey: 'hour' },
                        datasets: [
                          {
                            dataKey: 'orders',
                            label: 'Orders',
                            backgroundColor: 'hsl(var(--primary))',
                            borderRadius: 4
                          }
                        ]
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Sales ─────────────────────────────────────────────────── */}
          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>
                    Revenue and orders — current year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <Chart
                      type="line"
                      data={charts?.revenueByMonth ?? []}
                      options={{
                        xAxis: { dataKey: 'month' },
                        datasets: [
                          {
                            dataKey: 'revenue',
                            label: 'Revenue',
                            borderColor: 'hsl(var(--primary))'
                          },
                          {
                            dataKey: 'orders',
                            label: 'Orders',
                            borderColor: 'hsl(var(--chart-2))'
                          }
                        ]
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>
                    Best performing products this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : (lists?.topProducts?.length ?? 0) > 0 ? (
                    <div className="space-y-4">
                      {lists?.topProducts.map((product, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.sales} sales • $
                              {product.revenue.toLocaleString()}
                            </div>
                          </div>
                          <Badge
                            variant={
                              product.growth >= 0 ? 'default' : 'destructive'
                            }
                          >
                            {product.growth >= 0 ? '+' : ''}
                            {product.growth.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                      No sales data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Traffic (requires external analytics — static stubs) ─── */}
          <TabsContent value="traffic" className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Traffic and visitor data requires an external analytics
              integration (e.g. Google Analytics 4 or Plausible). Connect your
              analytics provider to see real traffic stats.
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>
                    Where your visitors are coming from
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    Connect analytics provider
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>
                    Daily conversion rates and visitor patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    Connect analytics provider
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Customers ─────────────────────────────────────────────── */}
          <TabsContent value="customers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                  <CardDescription>
                    Customer distribution by engagement level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (lists?.customerSegments?.length ?? 0) > 0 ? (
                    <Chart
                      type="pie"
                      data={(lists?.customerSegments ?? []).map((item) => ({
                        name: item.segment,
                        value: item.percentage
                      }))}
                      options={{
                        dataKey: 'value',
                        datasets: [
                          {
                            backgroundColor: [
                              'hsl(var(--primary))',
                              'hsl(var(--chart-2))',
                              'hsl(var(--chart-3))',
                              'hsl(var(--chart-4))'
                            ]
                          }
                        ]
                      }}
                    />
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No customer data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Growth</CardTitle>
                  <CardDescription>
                    New customers per month — current year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <Chart
                      type="bar"
                      data={charts?.revenueByMonth ?? []}
                      options={{
                        xAxis: { dataKey: 'month' },
                        datasets: [
                          {
                            dataKey: 'customers',
                            label: 'New Customers',
                            backgroundColor: 'hsl(var(--primary))',
                            borderRadius: 4
                          }
                        ]
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Customer Value Analysis</CardTitle>
                <CardDescription>
                  Revenue contribution by customer segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <div className="space-y-1 text-right">
                          <Skeleton className="ml-auto h-4 w-20" />
                          <Skeleton className="ml-auto h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (lists?.customerSegments?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    {lists?.customerSegments.map((segment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{segment.segment}</div>
                          <div className="text-sm text-muted-foreground">
                            {segment.count.toLocaleString()} customers •{' '}
                            {segment.percentage}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${segment.value.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            $
                            {segment.count > 0
                              ? Math.round(
                                  segment.value / segment.count
                                ).toLocaleString()
                              : 0}{' '}
                            avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
                    No customer data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
