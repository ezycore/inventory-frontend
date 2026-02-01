'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { StatCard } from './stat-card'
import { useDashboardStats, useProducts } from '@/services/api'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  Layers, 
  Tag, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Eye,
  ArrowRight,
  Boxes,
  ShoppingCart,
  DollarSign
} from 'lucide-react'

export function Dashboard() {
  const router = useRouter()
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentProducts, isLoading: productsLoading } = useProducts({ limit: 5 })

  const stats = dashboardStats?.data

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your inventory management system. Here&apos;s an overview of your stock.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats?.products.total || 0}
          subtitle={`${stats?.products.active || 0} active`}
          icon="Package"
          loading={statsLoading}
          valueColor="primary"
        />
        
        <StatCard
          title="Product Variants"
          value={stats?.variants.total || 0}
          subtitle={`${stats?.variants.active || 0} active variants`}
          icon="Layers"
          loading={statsLoading}
        />
        
        <StatCard
          title="Categories"
          value={stats?.categories.total || 0}
          subtitle={`${stats?.categories.active || 0} active`}
          icon="Tag"
          loading={statsLoading}
        />
        
        <StatCard
          title="Brands"
          value={stats?.brands.total || 0}
          subtitle={`${stats?.brands.active || 0} active`}
          icon="Building2"
          loading={statsLoading}
        />
      </div>

      {/* Stock Overview Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Stock Value"
          value={`$${(stats?.stock?.totalValue || 0).toLocaleString()}`}
          subtitle={`${stats?.stock?.totalItems || 0} total items`}
          icon="DollarSign"
          loading={statsLoading}
          valueColor="success"
        />
        
        <StatCard
          title="Low Stock Alerts"
          value={stats?.variants?.lowStock || 0}
          subtitle="Items below threshold"
          icon="AlertTriangle"
          loading={statsLoading}
          valueColor={stats?.variants?.lowStock && stats.variants.lowStock > 0 ? 'warning' : 'default'}
        />
        
        <StatCard
          title="Out of Stock"
          value={stats?.variants?.outOfStock || 0}
          subtitle="Items need restocking"
          icon="Package"
          loading={statsLoading}
          valueColor={stats?.variants?.outOfStock && stats.variants.outOfStock > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>
                Latest products added to your inventory
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/products')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (recentProducts?.data?.items || []).length > 0 ? (
              <div className="space-y-3">
                {(recentProducts?.data?.items || []).slice(0, 5).map((product: any) => (
                  <div key={product._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category?.name || 'No category'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No products yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => router.push('/products')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                Variants that need attention
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/variants?filter=low-stock')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => router.push('/products')}
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Add Product</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => router.push('/categories')}
            >
              <Tag className="h-6 w-6 mb-2" />
              <span>Manage Categories</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => router.push('/brands')}
            >
              <Building2 className="h-6 w-6 mb-2" />
              <span>Manage Brands</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => router.push('/variants')}
            >
              <Layers className="h-6 w-6 mb-2" />
              <span>View Variants</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}