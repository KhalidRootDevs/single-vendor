'use client';

import type * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  type PieLabelRenderProps
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'bar' | 'pie' | 'line';
  data: any[];
  options?: any;
}

export function Chart({
  type,
  data,
  options,
  className,
  ...props
}: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <RechartsBarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={options?.xAxis?.dataKey || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {options?.datasets?.map((dataset: any, index: number) => (
              <Bar
                key={index}
                dataKey={dataset.dataKey || dataset.label}
                fill={
                  dataset.backgroundColor || `hsl(var(--chart-${index + 1}))`
                }
                radius={dataset.borderRadius || 0}
              />
            ))}
          </RechartsBarChart>
        );
      case 'pie':
        return (
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={options?.dataKey || 'value'}
              label={
                options?.label !== false
                  ? (props: PieLabelRenderProps) =>
                      `${String(props.name ?? '')}: ${(
                        (props as unknown as { percent: number }).percent * 100
                      ).toFixed(0)}%`
                  : undefined
              }
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    options?.datasets?.[0]?.backgroundColor?.[index] ||
                    `hsl(var(--chart-${(index % 5) + 1}))`
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            {options?.legend !== false && <Legend />}
          </RechartsPieChart>
        );
      case 'line':
        return (
          <RechartsLineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={options?.xAxis?.dataKey || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {options?.datasets?.map((dataset: any, index: number) => (
              <Line
                key={index}
                type="monotone"
                dataKey={dataset.dataKey || dataset.label}
                stroke={dataset.borderColor || `hsl(var(--chart-${index + 1}))`}
                activeDot={{ r: 8 }}
              />
            ))}
          </RechartsLineChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('h-[300px] w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export const ChartContainer = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const ChartTooltip = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const ChartTooltipContent = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const ChartLegend = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const ChartLegendContent = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const ChartStyle = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLStyleElement>) => {
  return <style {...props}>{children}</style>;
};
