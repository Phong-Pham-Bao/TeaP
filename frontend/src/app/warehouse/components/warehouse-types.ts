export interface RequisitionOrder {
  id: string;
  orderNumber: string;
  branchName: string;
  branchId: string;
  requestedAt: string;
  urgency: 'HIGH' | 'NORMAL';
  status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
  items: { name: string; qty: number; unit: string }[];
  note?: string;
}

export interface SupplierReceipt {
  id: string;
  receiptNumber: string;
  supplierName: string;
  receivedDate: string;
  materialName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
}

export interface ExpiryBatchItem {
  id: string;
  materialName: string;
  category: string;
  batchNumber: string;
  currentStock: number;
  unit: string;
  storageType: 'KHO_LANH' | 'KHO_DONG' | 'KHO_KHO';
  expiryDate: string;
  daysRemaining: number;
  status: 'CRITICAL' | 'WARNING' | 'GOOD';
}

export interface StocktakeRecord {
  id: string;
  materialName: string;
  systemStock: number;
  actualStock: number;
  variance: number;
  unit: string;
  varianceReason: string;
  auditorName: string;
  auditDate: string;
}
