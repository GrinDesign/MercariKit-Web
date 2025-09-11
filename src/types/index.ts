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
  total_amount: number;
  item_count: number;
  payment_notes?: string;
  price_input_mode?: 'batch' | 'individual';
}

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
  status: 'in_stock' | 'ready_to_list' | 'listed' | 'sold' | 'on_hold' | 'discarded';
  shipping_method?: string;
  shipping_cost?: number;
  platform_fee?: number;
  net_profit?: number;
  listed_at?: string;
  sold_at?: string;
  discarded_at?: string;
}