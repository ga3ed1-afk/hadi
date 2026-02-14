
export interface Product {
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  cost?: number;
  deliveryFee?: number;
  category: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  discount?: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  // حقول البيع بالجملة
  isWholesale?: boolean;
  minOrderQuantity?: number;
  wholesalePrice?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'e-dinar' | 'bank_card' | 'cash';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  itemsCount: number;
  paymentMethod: PaymentMethod;
}

// Added KonnectSettings interface to resolve missing export errors in App and CartDrawer
export interface KonnectSettings {
  apiKey: string;
  wallets: any[];
  activeWalletId: string;
  mode: 'sandbox' | 'live';
  enabledMethods: {
    bankCard: boolean;
    edinar: boolean;
  };
}