'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import {
  CornerUpLeft,
  Search,
  Package,
  Wallet,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';

import { Button } from '@/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Textarea } from '@/ui/components/textarea';
import { Checkbox } from '@/ui/components/checkbox';
import { CardTable } from '@/ui/components/custom/card-table';
import { Badge } from '@/ui/components/badge';
import { Separator } from '@/ui/components/separator';

import {
  useSale,
  useSalesReturns,
  useCreateSalesReturn,
  useCustomerPendingDues,
  useAccounts,
  useSalesReturnsSummary,
} from '@/services/api';
import { useAuthStore } from '@/services/stores';
import type {
  Sale,
  SaleItem,
  SalesReturn,
  SalesReturnReason,
} from '@/types';

// =====================
// Schema Definitions
// =====================

const saleSearchSchema = z.object({
  saleId: z.string().min(1, 'Please enter a sale ID or invoice number'),
});

const returnItemSchema = z.object({
  selected: z.boolean(),
  quantity: z.number().min(0),
  refundAmount: z.number().min(0),
});

type SaleSearchData = z.infer<typeof saleSearchSchema>;

// =====================
// Types
// =====================

interface ReturnableItem extends SaleItem {
  inventoryId: string;
  maxReturnableQty: number;
  returnQty: number;
  refundAmount: number;
  selected: boolean;
  salePrice: number; // calculated: unitPrice - discount
}

interface DueAllocation {
  dueId: string;
  saleId: string;
  invoiceNumber: string;
  dueAmount: number;
  allocatedAmount: number;
  selected: boolean;
}

const RETURN_REASONS: { value: SalesReturnReason; label: string }[] = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'customer_changed_mind', label: 'Customer Changed Mind' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
];

// =====================
// Helper Functions
// =====================

const formatCurrency = (amount: number) => `৳${(amount || 0).toFixed(2)}`;

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// =====================
// Main Component
// =====================

export default function SalesReturnsPage() {
  // State
  const [searchId, setSearchId] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
  const [reason, setReason] = useState<SalesReturnReason>('customer_changed_mind');
  const [notes, setNotes] = useState('');
  const [dueAllocations, setDueAllocations] = useState<DueAllocation[]>([]);
  const [accountRefundAmount, setAccountRefundAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Auth & Features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // API Hooks
  const { data: saleData, isLoading: isLoadingSale, refetch: refetchSale } = useSale(selectedSaleId || '');
  const { data: returnsData, isLoading: isLoadingReturns } = useSalesReturns({ limit: 50 });
  const { data: accountsData } = useAccounts({ status: 'active', limit: 100 });
  const { data: summaryData, isLoading: isSummaryLoading } = useSalesReturnsSummary();
  
  // Derived Data - extract early for use in other hooks
  const sale = (saleData as any)?.data as (Sale & { payments?: any[] }) | undefined;
  const returns = (returnsData as any)?.data?.items || [];
  const accounts = ((accountsData as any)?.items || []) as any[];
  const summary = (summaryData as any)?.data;
  
  const { data: pendingDuesData } = useCustomerPendingDues(
    sale?.customerId?._id || '',
    selectedSaleId || ''
  );
  const pendingDues = useMemo(() => (pendingDuesData as any)?.data?.dues || [], [pendingDuesData]);
  
  const createReturnMutation = useCreateSalesReturn();

  // Form
  const searchForm = useForm<SaleSearchData>({
    resolver: zodResolver(saleSearchSchema),
    defaultValues: { saleId: '' },
  });

  // Initialize returnable items from sale - using useMemo to avoid effect lint warnings
  const initialReturnableItems = useMemo((): ReturnableItem[] => {
    if (!sale?.items) return [];
    return sale.items.map((item: any) => ({
      ...item,
      inventoryId: item.inventoryId || item._id,
      maxReturnableQty: item.quantity - (item.returnedQuantity || 0),
      returnQty: 0,
      refundAmount: 0,
      selected: false,
      salePrice: item.unitPrice - (item.discount || 0),
    }));
  }, [sale]);

  // Initialize due allocations from pending dues - using useMemo
  const initialDueAllocations = useMemo((): DueAllocation[] => {
    if (pendingDues.length === 0) return [];
    return pendingDues.map((due: any) => {
      // Extract saleId - it might be populated as an object or just a string
      const extractedSaleId = typeof due.saleId === 'object' && due.saleId?._id 
        ? due.saleId._id 
        : due.saleId;
      
      // Extract invoice number from populated saleId or use the direct field
      const extractedInvoiceNumber = typeof due.saleId === 'object' && due.saleId?.invoiceNumber
        ? due.saleId.invoiceNumber
        : due.invoiceNumber;
      
      return {
        dueId: due.id || due._id,
        saleId: extractedSaleId,
        invoiceNumber: extractedInvoiceNumber,
        dueAmount: due.currentAmount,
        allocatedAmount: 0,
        selected: false,
      };
    });
  }, [pendingDues]);

  // Sync state with initial values when they change
  useEffect(() => {
    setReturnableItems(initialReturnableItems);
  }, [initialReturnableItems]);

  useEffect(() => {
    setDueAllocations(initialDueAllocations);
  }, [initialDueAllocations]);

  // Calculate totals
  const totalReturnQty = useMemo(() => 
    returnableItems.filter(i => i.selected).reduce((sum, i) => sum + i.returnQty, 0),
    [returnableItems]
  );

  const totalRefundAmount = useMemo(() => 
    returnableItems.filter(i => i.selected).reduce((sum, i) => sum + i.refundAmount, 0),
    [returnableItems]
  );

  // Sale due amount that can be adjusted
  const saleDueAmount = sale?.dueAmount || 0;

  // Amount that can adjust the current sale due
  const adjustSaleDueAmount = useMemo(() => {
    return Math.min(totalRefundAmount, saleDueAmount);
  }, [totalRefundAmount, saleDueAmount]);

  // Total allocated to other dues
  const totalOtherDuesAllocated = useMemo(() => 
    dueAllocations.filter(d => d.selected).reduce((sum, d) => sum + d.allocatedAmount, 0),
    [dueAllocations]
  );

  // Remaining amount after due adjustments (for account refund)
  const remainingForRefund = useMemo(() => {
    const afterSaleDue = totalRefundAmount - adjustSaleDueAmount;
    return Math.max(0, afterSaleDue - totalOtherDuesAllocated);
  }, [totalRefundAmount, adjustSaleDueAmount, totalOtherDuesAllocated]);

  // Handlers
  const handleSearch = (data: SaleSearchData) => {
    setSelectedSaleId(data.saleId.trim());
  };

  const handleClearSearch = () => {
    setSelectedSaleId(null);
    setReturnableItems([]);
    setDueAllocations([]);
    setAccountRefundAmount(0);
    setNotes('');
    searchForm.reset();
  };

  const handleItemSelect = (index: number, selected: boolean) => {
    setReturnableItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected };
      if (!selected) {
        updated[index].returnQty = 0;
        updated[index].refundAmount = 0;
      }
      return updated;
    });
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setReturnableItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const validQty = Math.max(0, Math.min(qty, item.maxReturnableQty));
      updated[index] = {
        ...item,
        returnQty: validQty,
        refundAmount: validQty * (item.salePrice || item.unitPrice),
        selected: validQty > 0,
      };
      return updated;
    });
  };

  const handleRefundAmountChange = (index: number, amount: number) => {
    setReturnableItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const maxRefund = item.returnQty * (item.salePrice || item.unitPrice);
      updated[index] = {
        ...item,
        refundAmount: Math.max(0, Math.min(amount, maxRefund)),
      };
      return updated;
    });
  };

  const handleDueAllocationToggle = (index: number, selected: boolean) => {
    setDueAllocations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected, allocatedAmount: selected ? updated[index].dueAmount : 0 };
      return updated;
    });
  };

  const handleDueAllocationAmountChange = (index: number, amount: number) => {
    setDueAllocations(prev => {
      const updated = [...prev];
      const due = updated[index];
      updated[index] = {
        ...due,
        allocatedAmount: Math.max(0, Math.min(amount, due.dueAmount)),
      };
      return updated;
    });
  };

  const handleSubmitReturn = async () => {
    if (!selectedSaleId || !sale) {
      toast.error('Please select a sale first');
      return;
    }

    const selectedItems = returnableItems.filter(i => i.selected && i.returnQty > 0);
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    // Build return items
    const items = selectedItems.map(item => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      inventoryId: item.inventoryId,
      productName: item.productName,
      quantity: item.returnQty,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      discount: item.discount,
      refundAmount: item.refundAmount,
    }));

    // Build refund allocation (only if accounts enabled)
    let refundAllocation: any = undefined;
    if (isAccountsEnabled && totalRefundAmount > 0) {
      refundAllocation = {};
      
      // Adjust current sale due
      if (adjustSaleDueAmount > 0 && saleDueAmount > 0) {
        refundAllocation.adjustSaleDue = Math.min(adjustSaleDueAmount, saleDueAmount);
      }

      // Adjust other dues
      const selectedDues = dueAllocations.filter(d => d.selected && d.allocatedAmount > 0);
      if (selectedDues.length > 0) {
        refundAllocation.adjustOtherDues = selectedDues.map(d => ({
          dueId: d.dueId,
          saleId: d.saleId,
          amount: d.allocatedAmount,
        }));
      }

      // Account refund
      if (accountRefundAmount > 0 && selectedAccountId) {
        refundAllocation.accountRefund = {
          accountId: selectedAccountId,
          amount: accountRefundAmount,
          paymentMethod: 'cash',
        };
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        saleId: selectedSaleId,
        items,
        reason,
        notes: notes || undefined,
        refundAllocation,
      });

      // Reset form
      handleClearSearch();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Table columns for existing returns
  const returnsColumns: ColumnDef<SalesReturn>[] = useMemo(() => [
    {
      accessorKey: 'returnNumber',
      header: 'Return #',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.returnNumber}</span>
      ),
    },
    {
      accessorKey: 'saleId',
      header: 'Original Sale',
      cell: ({ row }) => {
        const saleId = row.original.saleId;
        let invoiceNumber: string;
        if (typeof saleId === 'object' && saleId?.invoiceNumber) {
          invoiceNumber = saleId.invoiceNumber;
        } else if (row.original.invoiceNumber) {
          invoiceNumber = row.original.invoiceNumber;
        } else {
          invoiceNumber = String(saleId);
        }
        return (
          <span className="font-mono text-sm">{invoiceNumber}</span>
        );
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.items?.length || 0} item(s)</span>
      ),
    },
    {
      accessorKey: 'totalRefundAmount',
      header: 'Refund Amount',
      cell: ({ row }) => (
        <span className="font-medium text-orange-600">
          {formatCurrency(row.original.totalRefundAmount || 0)}
        </span>
      ),
    },
    // Show allocation breakdown when accounts is enabled
    ...(isAccountsEnabled ? [{
      accessorKey: 'refundAllocation' as const,
      header: 'Allocation',
      cell: ({ row }: { row: { original: SalesReturn } }) => {
        const ret = row.original;
        const cashRefund = ret.refundedAmount || 0;
        const dueAdjusted = (ret.totalRefundAmount || 0) - cashRefund;
        
        if (cashRefund > 0 && dueAdjusted > 0) {
          return (
            <div className="text-xs space-y-0.5">
              <div className="text-red-600">Cash: {formatCurrency(cashRefund)}</div>
              <div className="text-blue-600">Due Adj: {formatCurrency(dueAdjusted)}</div>
            </div>
          );
        } else if (cashRefund > 0) {
          return <span className="text-xs text-red-600">Cash Refund</span>;
        } else if (dueAdjusted > 0) {
          return <span className="text-xs text-blue-600">Due Adjusted</span>;
        }
        return <span className="text-xs text-muted-foreground">-</span>;
      },
    }] : []),
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.original.reason?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ], [isAccountsEnabled]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sales Returns</h1>
        <p className="text-muted-foreground">
          Process customer returns and manage refunds
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className={`grid gap-4 ${isAccountsEnabled ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        {/* Today's Returns */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {isSummaryLoading ? '...' : formatCurrency(summary?.today?.totalRefunds ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isSummaryLoading ? '...' : `${summary?.today?.returnsCount ?? 0} return(s)`}
            </p>
          </CardContent>
        </Card>

        {/* This Month's Returns */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {isSummaryLoading ? '...' : formatCurrency(summary?.thisMonth?.totalRefunds ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isSummaryLoading ? '...' : `${summary?.thisMonth?.returnsCount ?? 0} return(s)`}
            </p>
          </CardContent>
        </Card>

        {/* Total Cash Refunded - Only when accounts enabled */}
        {isAccountsEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cash Refunded (All Time)</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {isSummaryLoading ? '...' : formatCurrency(summary?.allTime?.totalCashRefunded ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                From {isSummaryLoading ? '...' : `${summary?.allTime?.returnsCount ?? 0}`} return(s)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Total Due Adjusted - Only when accounts enabled */}
        {isAccountsEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Due Adjusted (All Time)</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {isSummaryLoading ? '...' : formatCurrency(summary?.allTime?.totalDueAdjusted ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Applied to outstanding dues
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Sale Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Sale
          </CardTitle>
          <CardDescription>
            Enter a sale ID or invoice number to process a return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={searchForm.handleSubmit(handleSearch)} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter sale ID or invoice number..."
                {...searchForm.register('saleId')}
              />
            </div>
            <Button type="submit" disabled={isLoadingSale}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {selectedSaleId && (
              <Button type="button" variant="outline" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Sale Details & Return Form */}
      {sale && (
        <>
          {/* Sale Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Sale: {sale.invoiceNumber}
              </CardTitle>
              <CardDescription>
                {sale.customerId?.name ? `Customer: ${sale.customerId.name}` : 'Walk-in Customer'}
                {' • '}
                Total: {formatCurrency(sale.totalAmount)}
                {' • '}
                Paid: {formatCurrency(sale.paidAmount)}
                {sale.dueAmount > 0 && (
                  <span className="text-destructive"> • Due: {formatCurrency(sale.dueAmount)}</span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Items Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Select Items to Return
              </CardTitle>
              <CardDescription>
                Choose which items the customer is returning and specify quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returnableItems.map((item, index) => (
                  <div
                    key={item.inventoryId}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      item.selected ? 'border-primary bg-primary/5' : 'border-border'
                    } ${item.maxReturnableQty === 0 ? 'opacity-50' : ''}`}
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={(checked) => handleItemSelect(index, !!checked)}
                      disabled={item.maxReturnableQty === 0}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Unit Price: {formatCurrency(item.unitPrice)}
                        {' • '}
                        Max Returnable: {item.maxReturnableQty}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleItemQtyChange(index, item.returnQty - 1)}
                        disabled={item.returnQty <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={item.returnQty}
                        onChange={(e) => handleItemQtyChange(index, parseInt(e.target.value) || 0)}
                        min={0}
                        max={item.maxReturnableQty}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleItemQtyChange(index, item.returnQty + 1)}
                        disabled={item.returnQty >= item.maxReturnableQty}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-32">
                      <Label className="text-xs text-muted-foreground">Refund</Label>
                      <Input
                        type="number"
                        value={item.refundAmount}
                        onChange={(e) => handleRefundAmountChange(index, parseFloat(e.target.value) || 0)}
                        disabled={item.returnQty === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {totalReturnQty > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Total Return:</span>
                    <span>{totalReturnQty} items • {formatCurrency(totalRefundAmount)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Return Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CornerUpLeft className="h-5 w-5 text-primary" />
                Return Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reason for Return</Label>
                  <Select value={reason} onValueChange={(v) => setReason(v as SalesReturnReason)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes about the return..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Refund Allocation (only if accounts enabled) */}
          {isAccountsEnabled && totalRefundAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Refund Allocation
                </CardTitle>
                <CardDescription>
                  Total Refund: {formatCurrency(totalRefundAmount)} - Choose how to allocate the refund
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Adjust Current Sale Due */}
                {saleDueAmount > 0 && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Adjust Current Sale Due</div>
                        <div className="text-sm text-muted-foreground">
                          Current due on this sale: {formatCurrency(saleDueAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-green-600">
                          -{formatCurrency(adjustSaleDueAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Auto-applied
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adjust Other Customer Dues */}
                {pendingDues.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Adjust Other Customer Dues</Label>
                    <div className="space-y-2">
                      {dueAllocations.map((due, index) => (
                        <div
                          key={due.dueId}
                          className={`flex items-center gap-4 p-3 border rounded-lg ${
                            due.selected ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <Checkbox
                            checked={due.selected}
                            onCheckedChange={(checked) => handleDueAllocationToggle(index, !!checked)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">Invoice: {due.invoiceNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              Due: {formatCurrency(due.dueAmount)}
                            </div>
                          </div>
                          <Input
                            type="number"
                            className="w-32"
                            value={due.allocatedAmount}
                            onChange={(e) => handleDueAllocationAmountChange(index, parseFloat(e.target.value) || 0)}
                            disabled={!due.selected}
                            max={due.dueAmount}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Refund */}
                {remainingForRefund > 0 && (
                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                    <div className="font-medium mb-2">Cash/Account Refund</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Remaining amount to refund: {formatCurrency(remainingForRefund)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Account</Label>
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account..." />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account: any) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.name} (৳{(account.balance || 0).toFixed(2)})
                              </SelectItem>
                            ))}
                            {accounts.length === 0 && (
                              <SelectItem value="" disabled>
                                No accounts available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Refund Amount</Label>
                        <Input
                          type="number"
                          value={accountRefundAmount}
                          onChange={(e) => setAccountRefundAmount(Math.min(parseFloat(e.target.value) || 0, remainingForRefund))}
                          max={remainingForRefund}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Refund:</span>
                    <span>{formatCurrency(totalRefundAmount)}</span>
                  </div>
                  {adjustSaleDueAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Adjust Sale Due:</span>
                      <span>-{formatCurrency(adjustSaleDueAmount)}</span>
                    </div>
                  )}
                  {totalOtherDuesAllocated > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Adjust Other Dues:</span>
                      <span>-{formatCurrency(totalOtherDuesAllocated)}</span>
                    </div>
                  )}
                  {accountRefundAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Account Refund:</span>
                      <span>{formatCurrency(accountRefundAmount)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleClearSearch}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReturn}
              disabled={totalReturnQty === 0 || createReturnMutation.isPending}
            >
              <CornerUpLeft className="h-4 w-4 mr-2" />
              {createReturnMutation.isPending ? 'Processing...' : 'Process Return'}
            </Button>
          </div>
        </>
      )}

      {/* Returns History Table */}
      <CardTable
        title="Recent Returns"
        description="View and manage processed sales returns"
        columns={returnsColumns}
        data={returns}
        emptyMessage="No sales returns found"
        isLoading={isLoadingReturns}
      />
    </div>
  );
}
