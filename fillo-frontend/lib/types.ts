interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  available: boolean;
  image?: string;
  farmerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAYMENT_PROCESSING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

interface Payment {
  id: string;
  orderId: string;
  userId: string;
  type: 'PAYSTACK' | 'FLUTTERWAVE' | 'STACKS_CRYPTO';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: number;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export type { Product, Order, Payment };
