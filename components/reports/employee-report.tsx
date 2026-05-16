'use client'

import { useEmployeeReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { Badge } from '@ui/components/badge'
import { useReportPeriod } from './use-report-period'
import { ReportPeriodFilter } from './report-period-filter'
import {
  Users,
  UserCheck,
  DollarSign,
  ShoppingBag,
} from 'lucide-react'

export function EmployeeReport() {
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useEmployeeReport(params)
  const { format: formatCurrency } = useCurrency()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Report</h1>
          <p className="text-sm text-muted-foreground">
            Employee activity and performance overview
          </p>
        </div>
      </div>

      <ReportPeriodFilter
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

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
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.activeEmployees} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.activeEmployees}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalSales)}
                </div>
                <p className="text-xs text-muted-foreground">By all employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalPurchases)}
                </div>
                <p className="text-xs text-muted-foreground">By all employees</p>
              </CardContent>
            </Card>
          </div>

          {/* Employee Table */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employees found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium text-right">Sales (#)</th>
                        <th className="pb-2 font-medium text-right">Sales Amount</th>
                        <th className="pb-2 font-medium text-right">Profit</th>
                        <th className="pb-2 font-medium text-right">Purchases (#)</th>
                        <th className="pb-2 font-medium text-right">Purchase Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employees.map((emp) => (
                        <tr key={emp.userId} className="border-b last:border-0">
                          <td className="py-2">
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{emp.email}</p>
                            </div>
                          </td>
                          <td className="py-2 capitalize">{emp.role}</td>
                          <td className="py-2">
                            <Badge
                              variant={emp.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {emp.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-right">{emp.sales.count}</td>
                          <td className="py-2 text-right">
                            {formatCurrency(emp.sales.totalAmount)}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={
                                emp.sales.profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {formatCurrency(emp.sales.profit)}
                            </span>
                          </td>
                          <td className="py-2 text-right">{emp.purchases.count}</td>
                          <td className="py-2 text-right">
                            {formatCurrency(emp.purchases.totalAmount)}
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
