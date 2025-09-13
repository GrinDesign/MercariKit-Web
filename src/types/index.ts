export interface PurchaseSession {
  id: string;
  session_date: string;
  title: string;
  transportation_cost: number;
  transfer_fee: number;
  agency_fee: number;
  status: 'active' | 'completed';
}

export interface Store {
  id: string;
  name: string;
  type: 'online' | 'recycle' | 'wholesale' | 'other';
  prefecture?: string;
  notes?: string;
}

export interface StorePurchase {
  id: string;
  session_id: string;
  store_id: string;
  purchase_date: string;
  product_cost: number;
  shipping_cost: number;
  commission_fee: number;
  item_count: number;
  payment_notes?: string;
  price_input_mode?: 'batch' | 'individual';
}

// 送料タイプの型定義
export type ShippingType = 'YUYU_215' | 'RAKURAKU_750' | 'RAKURAKU_850';

// 送料タイプの詳細情報
export const SHIPPING_TYPES = {
  YUYU_215: { 
    label: 'ゆうゆうメルカリ便', 
    description: 'ネコポス相当（薄い・小さいもの）', 
    cost: 215 
  },
  RAKURAKU_750: { 
    label: 'らくらくメルカリ便', 
    description: '宅急便コンパクト（コンパクトサイズ）', 
    cost: 750 
  },
  RAKURAKU_850: { 
    label: 'らくらくメルカリ便', 
    description: '宅急便60サイズ（通常サイズ）', 
    cost: 850 
  }
} as const;

// 送料タイプから送料を取得する関数
export const getShippingCost = (shippingType: ShippingType): number => {
  return SHIPPING_TYPES[shippingType].cost;
};

// 送料から送料タイプを取得する関数
export const getShippingTypeFromCost = (cost: number): ShippingType | null => {
  switch (cost) {
    case 215: return 'YUYU_215';
    case 750: return 'RAKURAKU_750';
    case 850: return 'RAKURAKU_850';
    default: return null;
  }
};

export interface Product {
  id: string;
  store_purchase_id?: string;
  name: string;
  mercari_title?: string;
  brand?: string;
  category: string;
  size?: string;
  color?: string;
  condition: string;
  gender?: string;
  purchase_cost: number;
  allocated_cost?: number;
  initial_price: number;
  current_price: number;
  sold_price?: number;
  reference_price?: number;
  photos: string[];
  measurements?: object;
  description?: string;
  template_description?: string;
  notes?: string;
  production_country?: string;
  decade?: string;
  asset_type: 'asset' | 'quick_turn';
  status: 'in_stock' | 'ready_to_list' | 'listed' | 'sold' | 'on_hold' | 'discarded';
  shipping_method?: string;
  shipping_cost?: number;
  planned_shipping_type?: ShippingType;
  planned_shipping_cost?: number;
  actual_shipping_type?: ShippingType;
  actual_shipping_cost?: number;
  platform_fee?: number;
  net_profit?: number;
  listed_at?: string;
  sold_at?: string;
  discarded_at?: string;
}