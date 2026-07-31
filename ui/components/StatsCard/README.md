# StatsCard Component

A comprehensive, theme-aware statistics card component with support for icons, trends, and mini charts.

## Features

✅ **Theme Support** - Uses CSS variables, works with light/dark themes  
✅ **Icons** - Built-in support for Lucide icons  
✅ **Trend Indicators** - Show up/down/neutral trends with percentages  
✅ **Mini Charts** - Optional sparkline-style charts  
✅ **Variants** - Pre-styled color variants (primary, success, warning, etc.)  
✅ **Responsive** - Configurable grid columns for different breakpoints  
✅ **Loading States** - Built-in skeleton loading  
✅ **TypeScript** - Full type safety

## Basic Usage

```tsx
import StatsCard from "@/ui/components/StatsCard";
import { Users, DollarSign } from "lucide-react";

<StatsCard
  data={[
    {
      label: "Total Users",
      value: 1234,
      icon: Users,
      variant: "primary",
    },
    {
      label: "Revenue",
      value: 45678,
      icon: DollarSign,
      variant: "success",
      prefix: "$",
    },
  ]}
/>;
```

## Advanced Usage

### With Trends

```tsx
<StatsCard
  data={[
    {
      label: "Monthly Revenue",
      value: 54320,
      icon: DollarSign,
      variant: "success",
      prefix: "$",
      trend: {
        value: "+12.5%",
        direction: "up",
        label: "from last month",
      },
    },
  ]}
/>
```

### With Mini Charts

```tsx
<StatsCard
  data={[
    {
      label: "User Growth",
      value: 1234,
      icon: Users,
      variant: "primary",
      trend: {
        value: "+24%",
        direction: "up",
      },
      chart: {
        data: [45, 52, 48, 63, 58, 72, 69],
        color: "bg-primary/60",
      },
    },
  ]}
/>
```

### Complete Example

```tsx
import StatsCard from "@/ui/components/StatsCard";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

export default function Dashboard() {
  return (
    <StatsCard
      data={[
        {
          label: "Total Users",
          value: 2847,
          icon: Users,
          variant: "primary",
          description: "Registered accounts",
          trend: {
            value: "+12%",
            direction: "up",
            label: "from last month",
          },
          chart: {
            data: [45, 52, 48, 63, 58, 72, 69],
          },
        },
        {
          label: "Total Orders",
          value: 1567,
          icon: ShoppingCart,
          variant: "success",
          description: "Completed orders",
          trend: {
            value: "+8.2%",
            direction: "up",
            label: "vs last week",
          },
        },
        {
          label: "Revenue",
          value: 45678,
          icon: DollarSign,
          variant: "info",
          prefix: "$",
          description: "Total earnings",
          trend: {
            value: "-3.1%",
            direction: "down",
            label: "from last month",
          },
        },
        {
          label: "Conversion Rate",
          value: 3.24,
          icon: TrendingUp,
          variant: "default",
          suffix: "%",
          description: "Average rate",
          trend: {
            value: "0%",
            direction: "neutral",
            label: "no change",
          },
        },
      ]}
      isLoading={false}
    />
  );
}
```

## Props

### StatsCardProps

| Prop        | Type         | Default  | Description               |
| ----------- | ------------ | -------- | ------------------------- |
| `data`      | `StatData[]` | required | Array of stat objects     |
| `isLoading` | `boolean`    | `false`  | Show loading skeletons    |
| `columns`   | `object`     | auto     | Grid column configuration |

### StatData

| Prop          | Type               | Default     | Description            |
| ------------- | ------------------ | ----------- | ---------------------- |
| `label`       | `string`           | required    | Stat label/title       |
| `value`       | `number \| string` | required    | Main value to display  |
| `icon`        | `LucideIcon`       | -           | Icon component         |
| `variant`     | `StatVariant`      | `"default"` | Color variant          |
| `description` | `string`           | -           | Additional description |
| `prefix`      | `string`           | -           | Prefix (e.g., "$")     |
| `suffix`      | `string`           | -           | Suffix (e.g., "%")     |
| `trend`       | `object`           | -           | Trend indicator        |
| `chart`       | `object`           | -           | Mini chart data        |

### Variants

- `default` - Muted gray
- `primary` - Primary blue
- `success` - Green
- `warning` - Amber/orange
- `destructive` - Red
- `info` - Purple

### Trend Object

```tsx
{
  value: string | number;    // e.g., "+12%" or 150
  direction?: "up" | "down" | "neutral";
  label?: string;            // e.g., "from last month"
  higherIsBetter?: boolean;  // default true; false on cost metrics so a rise reads red
}
```

### Chart Object

```tsx
{
  data: number[];           // Array of values for mini chart
  color?: string;           // Optional Tailwind color class
}
```

## Responsive Columns

```tsx
<StatsCard
  data={stats}
  columns={{
    default: 1, // 1 column on mobile
    sm: 2, // 2 columns on small screens
    md: 2, // 2 columns on medium screens
    lg: 4, // 4 columns on large screens
    xl: 4, // 4 columns on xl screens
  }}
/>
```

## Theme Support

The component automatically adapts to your theme using CSS variables:

- `--primary`, `--primary-foreground`
- `--chart-1`, `--chart-2`, `--chart-4`
- `--destructive`
- `--muted`, `--muted-foreground`
- `--card`, `--foreground`

All colors respect light/dark mode automatically!

## Examples in Your App

### Brands Page

```tsx
<StatsCard
  data={[
    {
      label: "Total Brands",
      value: stats?.total || 0,
      icon: Tags,
      variant: "primary",
      trend: { value: "+12%", direction: "up", label: "from last month" },
      description: "All registered brands",
    },
    {
      label: "Active Brands",
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      trend: { value: "+8%", direction: "up", label: "from last month" },
    },
  ]}
  isLoading={isLoading}
/>
```

### Sales Dashboard

```tsx
<StatsCard
  data={[
    {
      label: "Today's Sales",
      value: 12480,
      icon: DollarSign,
      variant: "success",
      prefix: "$",
      trend: { value: "+18%", direction: "up" },
      chart: { data: [120, 150, 180, 140, 200, 220, 248] },
    },
  ]}
/>
```

## Migration from Old API

**Old API (hardcoded colors):**

```tsx
<StatsCard
  data={[
    {
      label: "Total Brands",
      value: 48,
      labelColor: "#3B82F6",
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
  ]}
/>
```

**New API (theme-aware):**

```tsx
<StatsCard
  data={[
    {
      label: "Total Brands",
      value: 48,
      icon: Tags,
      variant: "primary",
      trend: { value: "+12%", direction: "up" },
    },
  ]}
/>
```

## TypeScript Support

```tsx
import {
  StatData,
  StatVariant,
  TrendDirection,
} from "@/ui/components/StatsCard";

const myStats: StatData[] = [
  {
    label: "Users",
    value: 1234,
    variant: "primary" as StatVariant,
    trend: {
      value: "+10%",
      direction: "up" as TrendDirection,
    },
  },
];
```
