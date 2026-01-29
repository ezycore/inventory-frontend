import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface SalesOrderItem {
  id: string; // local ID for tracking
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage discount
  total: number;
  // Display fields
  productName: string;
  variantName?: string | null;
}

interface SalesOrderStore {
  // Order details
  customerId: string | null;
  customerName: string | null;
  customerDiscount: number; // Default discount from customer
  locationId: string | null;
  locationName: string | null;
  
  // Items
  items: SalesOrderItem[];
  
  // Order-level discount
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  
  // Notes
  notes: string;
  invoiceNumber: string;
  
  // Computed values (calculated on the fly)
  getSubtotal: () => number;
  getGrandTotal: () => number;
  
  // Actions
  setCustomer: (customerId: string | null, customerName: string | null, discount?: number) => void;
  setLocation: (locationId: string | null, locationName: string | null) => void;
  addItem: (item: Omit<SalesOrderItem, 'id' | 'total'>) => void;
  updateItem: (id: string, data: Partial<Omit<SalesOrderItem, 'id'>>) => void;
  removeItem: (id: string) => void;
  setOrderDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  setNotes: (notes: string) => void;
  setInvoiceNumber: (invoiceNumber: string) => void;
  clearAll: () => void;
  
  // Apply customer discount to all items
  applyCustomerDiscountToAll: () => void;
}

// Helper to calculate item total
const calculateItemTotal = (quantity: number, unitPrice: number, discount: number): number => {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discount) / 100;
  return Math.round((subtotal - discountAmount) * 100) / 100;
};

export const useSalesOrderStore = create<SalesOrderStore>()(
  persist(
    (set, get) => ({
      customerId: null,
      customerName: null,
      customerDiscount: 0,
      locationId: null,
      locationName: null,
      items: [],
      discountType: 'percentage',
      discountValue: 0,
      notes: '',
      invoiceNumber: '',

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.total, 0);
      },

      getGrandTotal: () => {
        const { discountType, discountValue } = get();
        const subtotal = get().getSubtotal();
        
        let orderDiscount = 0;
        if (discountType === 'percentage') {
          orderDiscount = (subtotal * discountValue) / 100;
        } else {
          orderDiscount = discountValue;
        }
        
        return Math.round((subtotal - orderDiscount) * 100) / 100;
      },

      setCustomer: (customerId, customerName, discount = 0) =>
        set({ 
          customerId, 
          customerName, 
          customerDiscount: discount 
        }),

      setLocation: (locationId, locationName) =>
        set({ locationId, locationName }),

      addItem: (item) =>
        set((state) => {
          const total = calculateItemTotal(item.quantity, item.unitPrice, item.discount);
          
          // Check if item with same product and variant already exists
          const existingIndex = state.items.findIndex(
            (existing) =>
              existing.productId === item.productId &&
              (existing.variantId || null) === (item.variantId || null)
          );

          if (existingIndex !== -1) {
            // Replace the existing item
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = { 
              ...item, 
              id: state.items[existingIndex].id,
              total 
            };
            return { items: updatedItems };
          }

          // Add new item
          return { 
            items: [...state.items, { ...item, id: uuidv4(), total }] 
          };
        }),

      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            
            const updatedItem = { ...item, ...data };
            // Recalculate total
            updatedItem.total = calculateItemTotal(
              updatedItem.quantity,
              updatedItem.unitPrice,
              updatedItem.discount
            );
            
            return updatedItem;
          }),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      setOrderDiscount: (type, value) =>
        set({ discountType: type, discountValue: value }),

      setNotes: (notes) => set({ notes }),
      
      setInvoiceNumber: (invoiceNumber) => set({ invoiceNumber }),

      applyCustomerDiscountToAll: () =>
        set((state) => ({
          items: state.items.map((item) => {
            const updatedItem = { ...item, discount: state.customerDiscount };
            updatedItem.total = calculateItemTotal(
              updatedItem.quantity,
              updatedItem.unitPrice,
              updatedItem.discount
            );
            return updatedItem;
          }),
        })),

      clearAll: () =>
        set({
          customerId: null,
          customerName: null,
          customerDiscount: 0,
          locationId: null,
          locationName: null,
          items: [],
          discountType: 'percentage',
          discountValue: 0,
          notes: '',
          invoiceNumber: '',
        }),
    }),
    {
      name: 'sales-order-storage', // localStorage key
    }
  )
);
