export interface Payment {
  _id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  notes?: string;
  accountId?: { name: string };
  createdBy?: { firstName: string; lastName: string };
}
