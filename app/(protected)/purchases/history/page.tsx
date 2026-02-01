'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card'
import { Input } from '@/ui/components/input'
import { Label } from '@/ui/components/label'
import { Badge } from '@/ui/components/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/ui/components/alert-dialog'
import { Separator } from '@/ui/components/separator'
import { 
  Eye, 
  Plus, 
  PackageCheck, 
  FileText, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Search,
  RefreshCw,
  Ban,
} from 'lucide-react'
import { 
  usePurchaseOrders, 
  usePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
} from '@/services/api'
import { toast } from 'sonner'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types'
import { Skeleton } from '@/ui/components/skeleton'

const statusConfig: Record<PurchaseOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: <FileText className="h-4 w-4" /> },
  ordered: { label: 'Ordered', variant: 'default', icon: <Truck className="h-4 w-4" /> },
  partial: { label: 'Partial', variant: 'outline', icon: <PackageCheck className="h-4 w-4" /> },
  received: { label: 'Received', variant: 'default', icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
}

export default function PurchaseHistoryPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  const { data: ordersData, isLoading, refetch } = usePurchaseOrders({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
  })

  const { data: orderDetailData, isLoading: isLoadingDetail } = usePurchaseOrder(
    selectedOrderId || ''
  )

  const updateStatusMutation = useUpdatePurchaseOrderStatus()
  const receiveMutation = useReceivePurchaseOrder()
  const cancelMutation = useCancelPurchaseOrder()

  const orders: PurchaseOrder[] = ordersData?.data?.items || []
  const orderDetail: PurchaseOrder | null = orderDetailData?.data || null

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId)
    setDetailSheetOpen(true)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: PurchaseOrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus })
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleReceiveAll = async (orderId: string) => {
    if (!orderDetail) return
   console.log(orderDetail)
    const receiveData = {
      items: orderDetail.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        receivedQuantity: item.quantity - (item.receivedQuantity || 0),
      })),
    }

    try {
      await receiveMutation.mutateAsync({ id: orderId, data: receiveData })
      toast.success('Items received successfully')
      setDetailSheetOpen(false)
    } catch (error) {
      console.error('Failed to receive items:', error)
    }
  }

  const handleCancel = async (orderId: string) => {
    try {
      await cancelMutation.mutateAsync(orderId)
      toast.success('Order cancelled')
      setDetailSheetOpen(false)
    } catch (error) {
      console.error('Failed to cancel order:', error)
    }
  }

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`
  const formatDate = (date: string | Date) => format(new Date(date), 'dd MMM yyyy')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">
            View and manage your purchase orders
          </p>
        </div>
        <Button onClick={() => router.push('/purchases/orders/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="partial">Partially Received</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-64">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Order number, invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {orders.length} purchase order(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No purchase orders found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'all' 
                  ? 'Try changing the filter or create a new order'
                  : 'Get started by creating your first purchase order'}
              </p>
              <Button onClick={() => router.push('/purchases/orders/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const config = statusConfig[order.status]
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {typeof order.supplierId === 'object' 
                          ? (order.supplierId as any).name 
                          : order.supplierId}
                      </TableCell>
                      <TableCell>
                        {order.invoiceNumber || '-'}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="flex gap-1 w-fit">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.grandTotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isLoadingDetail ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>Order {orderDetail?.orderNumber}</>
              )}
            </SheetTitle>
            <SheetDescription>
              Purchase order details and actions
            </SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : orderDetail ? (
            <div className="space-y-6 mt-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge 
                      variant={statusConfig[orderDetail.status].variant}
                      className="flex gap-1 w-fit"
                    >
                      {statusConfig[orderDetail.status].icon}
                      {statusConfig[orderDetail.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">
                    {typeof orderDetail.supplierId === 'object'
                      ? (orderDetail.supplierId as any).name
                      : orderDetail.supplierId}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Invoice #</Label>
                  <p className="font-medium">{orderDetail.invoiceNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Invoice Date</Label>
                  <p className="font-medium">
                    {orderDetail.invoiceDate 
                      ? formatDate(orderDetail.invoiceDate) 
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{formatDate(orderDetail.createdAt)}</p>
                </div>
                {orderDetail.receivedAt && (
                  <div>
                    <Label className="text-muted-foreground">Received</Label>
                    <p className="font-medium">{formatDate(orderDetail.receivedAt)}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetail.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            {item.variantName && (
                              <div className="text-sm text-muted-foreground">
                                {item.variantName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={
                              (item.receivedQuantity || 0) >= item.quantity 
                                ? 'default' 
                                : (item.receivedQuantity || 0) > 0 
                                  ? 'outline' 
                                  : 'secondary'
                            }
                          >
                            {item.receivedQuantity || 0}/{item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(orderDetail.subtotal)}</span>
                </div>
                {orderDetail.discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount ({orderDetail.discountType === 'percentage' 
                        ? `${orderDetail.discountValue}%` 
                        : 'Fixed'})
                    </span>
                    <span>
                      -{formatCurrency(
                        orderDetail.discountType === 'percentage'
                          ? orderDetail.subtotal * orderDetail.discountValue / 100
                          : orderDetail.discountValue
                      )}
                    </span>
                  </div>
                )}
                {orderDetail.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(orderDetail.taxTotal)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(orderDetail.grandTotal)}</span>
                </div>
              </div>

              {orderDetail.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1">{orderDetail.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Actions</h4>
                
                {orderDetail.status === 'draft' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleStatusUpdate(orderDetail._id, 'ordered')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark as Ordered
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Ban className="h-4 w-4 mr-2" />
                          Cancel Order
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The order will be marked as cancelled.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancel(orderDetail._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancel Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {(orderDetail.status === 'ordered' || orderDetail.status === 'partial') && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleReceiveAll(orderDetail._id)}
                      disabled={receiveMutation.isPending}
                    >
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Receive All
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Ban className="h-4 w-4 mr-2" />
                          Cancel Order
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Any received items will remain in stock.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancel(orderDetail._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancel Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {orderDetail.status === 'received' && (
                  <p className="text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                    This order has been fully received.
                  </p>
                )}

                {orderDetail.status === 'cancelled' && (
                  <p className="text-muted-foreground">
                    <XCircle className="h-4 w-4 inline mr-1 text-destructive" />
                    This order has been cancelled.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
