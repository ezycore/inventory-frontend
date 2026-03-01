'use client'

import { useStockValuation } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import {
  Database,
  Package,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

export function ValuationReport() {
  const { data, isLoading } = useStockValuation()
  const { format: formatCurrency } = useCurrency()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Product Value</h1>
          <p className="text-sm text-muted-foreground">
            Current stock valuation by product and category
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalCostValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on cost price
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Active inventory items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.totalQuantity.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Items in stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Cost Price</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.averageCostPrice)}
                </div>
                <p className="text-xs text-muted-foreground">Per inventory item</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Valuation */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryValuation.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 font-medium text-right">Products</th>
                        <th className="pb-2 font-medium text-right">Quantity</th>
                        <th className="pb-2 font-medium text-right">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.categoryValuation.map((cat, i) => (
                        <tr key={cat.categoryId || i} className="border-b last:border-0">
                          <td className="py-2">{cat.categoryName}</td>
                          <td className="py-2 text-right">{cat.productCount}</td>
                          <td className="py-2 text-right">{cat.totalQuantity.toLocaleString()}</td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(cat.totalValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Value Products */}
          <Card>
            <CardHeader>
              <CardTitle>Highest Value Products</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topValueProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium">SKU</th>
                        <th className="pb-2 font-medium text-right">Quantity</th>
                        <th className="pb-2 font-medium text-right">Cost Price</th>
                        <th className="pb-2 font-medium text-right">Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topValueProducts.map((p, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">
                            {p.productName}
                            {p.variantName && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({p.variantName})
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-muted-foreground">{p.sku || '—'}</td>
                          <td className="py-2 text-right">{p.quantity.toLocaleString()}</td>
                          <td className="py-2 text-right">{formatCurrency(p.costPrice)}</td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(p.stockValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No data available
          </CardContent>
        </Card>
      )}
    </div>
  )
}
