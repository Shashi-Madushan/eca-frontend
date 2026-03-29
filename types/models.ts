export type UserType = 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  phone: string;
  address: string;
  createdAt?: string;
}

export interface CustomerType {
  id: string; // The test script uses "CUST..." string IDs
  customerId: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  customerType: 'REGULAR' | 'PREMIUM';
  loyaltyPoints: number;
  totalPurchases: number;
}

export interface ProductVariantDto {
  variantId?: string;
  name?: string;
  price?: number;
  stockQuantity?: number;
  sku?: string;
}

export interface ProductDto {
  productId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stockQuantity: number;
  barcode?: string;
  supplier?: string;
  images?: string[];
  variants?: ProductVariantDto[];
  isActive: boolean;
  costPrice?: number;
  sku?: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "MOBILE_PAYMENT"
  | "BANK_TRANSFER"
  | "GIFT_CARD";

export interface OrderItemDto {
  orderItemId?: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
}

export interface OrderDto {
  orderId?: number;
  orderDate: string;
  customerId: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  receiptUrl?: string;
  invoiceUrl?: string;
  orderItems: OrderItemDto[];
}

export interface CreateOrderPayload {
  orderDate: string;
  customerId: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  orderItems: OrderItemDto[];
}

/**
 * Validation constraints matching the API specification
 */
export const ProductValidation = {
  productId: {
    min: 6,
    max: 12,
    pattern: /^[A-Z0-9]{6,12}$/,
    message: "Product ID must be 6-12 alphanumeric characters (A-Z, 0-9)"
  },
  name: {
    max: 100,
    message: "Product name must be max 100 characters"
  },
  description: {
    max: 500,
    message: "Description must be max 500 characters"
  },
  price: {
    min: 0,
    message: "Price must be greater than 0"
  },
  category: {
    max: 50,
    message: "Category must be max 50 characters"
  },
  barcode: {
    min: 8,
    max: 13,
    pattern: /^\d{8,13}$/,
    message: "Barcode must be 8-13 digits"
  },
  supplier: {
    max: 100,
    message: "Supplier must be max 100 characters"
  },
  sku: {
    min: 8,
    max: 20,
    pattern: /^[A-Z0-9-]{8,20}$/,
    message: "SKU must be 8-20 alphanumeric characters with hyphens"
  },
  costPrice: {
    min: 0,
    message: "Cost price must be >= 0"
  }
} as const;
