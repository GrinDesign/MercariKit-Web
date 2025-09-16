import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, PurchaseSession, StorePurchase } from '../types';
import { TrendingUp, Calendar, DollarSign, Package, PieChart, BarChart2, ChevronDown, ChevronRight, Database, AlertTriangle, Target, Brain, Filter, Zap, Settings, Check, X, Clock, Lightbulb } from 'lucide-react';

interface MonthlyData {
  month: string;
  revenue: number;        // 売上
  salesFee: number;       // 販売手数料10%
  shippingCost: number;   // 送料
  profit: number;         // 利益（売上 - 手数料 - 送料）
  profitRate: number;     // 利益率
  itemsSold: number;      // 販売数
  avgPrice: number;       // 平均単価
}

interface SessionData {
  sessionId: string;
  sessionTitle: string;
  productCost: number;     // 商品代金
  commonCost: number;      // 共通経費
  storeCost: number;       // 個別経費（店舗ごとの経費）
  totalCost: number;       // 総仕入金額
  itemCount: number;       // 商品数
  soldCount: number;       // 売却数
  listedCount: number;     // 出品中
  inStockCount: number;    // 在庫（未出品）
  discardedCount: number;  // 廃棄数
  totalRevenue: number;    // 売却額（回収額）
  profit: number;          // 収益
  achievementRate: number; // 達成率（回収額/総仕入額）
  // 売上内訳用
  grossSales: number;      // 総売上（手数料・送料引く前）
  totalFees: number;       // 販売手数料合計
  totalShipping: number;   // 送料合計
}

interface StoreOverview {
  storeId: string;
  storeName: string;
  totalPurchases: number;
  totalAmount: number;
  totalItems: number;
  soldItems: number;
  soldAmount: number;
  profit: number;
  profitRate: number;
  roi: number;
  lastPurchaseDate: string | null;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
}

interface SlowMovingItem {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  daysInStock: number;
  purchaseCost: number;
  currentPrice: number;
  listingStatus: string;
  recommendedAction: 'price_reduction' | 'promotion' | 'dispose' | 'hold';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface TurnoverAnalysis {
  category: string;
  totalItems: number;
  soldItems: number;
  averageDaysToSell: number;
  turnoverRate: number;
  fastMovers: number;  // < 30日
  mediumMovers: number; // 30-60日
  slowMovers: number;   // 60-90日
  deadStock: number;    // > 90日
}

interface InventoryHealth {
  totalValue: number;
  activeListings: number;
  slowMovingValue: number;
  deadStockValue: number;
  turnoverScore: number; // 0-100
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface PricePerformanceItem {
  productId: string;
  productName: string;
  category: string;
  initialPrice: number;
  currentPrice: number;
  purchaseCost: number;
  daysListed: number;
  viewCount?: number;
  likeCount?: number;
  priceChanges: number;
  sellProbability: number; // 0-100%
  recommendedPrice: number;
  actionType: 'increase' | 'decrease' | 'maintain' | 'urgent_reduction';
}

interface CategoryPricing {
  category: string;
  avgInitialPrice: number;
  avgSoldPrice: number;
  avgDaysToSell: number;
  successRate: number;
  optimalPriceRange: {
    min: number;
    max: number;
  };
  priceElasticity: number; // 価格弾力性
}

interface PricingStrategy {
  totalItems: number;
  underpriced: number;
  overpriced: number;
  optimalPriced: number;
  needsAdjustment: number;
  potentialRevenue: number;
  averageMarkup: number;
}

// 高度分析機能のインターフェース
interface MultiDimensionalAnalysis {
  category: string;
  brand: string;
  condition: string;
  priceRange: string;
  totalItems: number;
  soldItems: number;
  sellThroughRate: number;
  avgDaysToSell: number;
  avgProfit: number;
  profitMargin: number;
  roi: number;
  score: number; // 総合スコア 0-100
  recommendations: string[];
}

interface PredictionData {
  category: string;
  predictedDemand: number; // 予測需要（月間）
  seasonalityFactor: number; // 季節要因 0.5-2.0
  trendDirection: 'up' | 'down' | 'stable';
  confidenceLevel: number; // 信頼度 0-100%
  recommendedStock: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SimulationResult {
  scenario: string;
  description: string;
  currentRevenue: number;
  projectedRevenue: number;
  revenueChange: number;
  impactedItems: number;
  implementationCost: number;
  roi: number;
  feasibility: 'high' | 'medium' | 'low';
}

interface CustomReport {
  id: string;
  name: string;
  filters: {
    categories: string[];
    brands: string[];
    priceMin?: number;
    priceMax?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  metrics: string[];
  generatedAt: string;
}

interface AdvancedAnalyticsData {
  multiDimensionalAnalysis: MultiDimensionalAnalysis[];
  predictions: PredictionData[];
  simulations: SimulationResult[];
  insights: {
    topInsight: string;
    opportunities: string[];
    risks: string[];
  };
}

// 戦略分析機能の型定義
interface StrategicAnalysisData {
  sessionId: string;
  sessionTitle: string;
  totalItems: number;
  soldItems: number;
  remainingItems: number;
  currentProfit: number;
  targetProfit: number;  // 損益分岐点
  requiredRevenue: number; // 必要売上額
  remainingProducts: RemainingProduct[];
}

interface RemainingProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  photos: string[];
  purchaseCost: number;     // 仕入金額
  allocatedCost: number;    // 按分後コスト
  mercariReference?: number; // メルカリ相場
  initialPrice: number;     // 出品時価格
  currentPrice: number;     // 現在価格
  suggestedPrice: number;   // 売却予想価格（編集可能）
  status: string;
  daysInStock: number;
  shippingCost: number;     // 送料 (215, 750, 850)
  platformFee: number;      // 販売手数料（10%）
  netProfit: number;        // 純利益
  breakEvenPrice: number;   // 損益分岐点価格
  condition: string;
  size?: string;
  color?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

// 自動価格調整機能のインターフェース
interface PriceAdjustmentSuggestion {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  suggestedPrice: number;
  adjustmentReason: string;
  expectedImpact: string;
  daysListed: number;
  purchaseCost: number;
  minPrice: number; // 最低価格（原価ベース）
  maxAdjustment: number; // 最大調整幅
  priority: 'high' | 'medium' | 'low';
  riskLevel: 'safe' | 'moderate' | 'risky';
  status: 'pending' | 'approved' | 'applied' | 'rejected';
}

interface PriceAdjustmentHistory {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  appliedAt: string;
  appliedBy: string;
  status: 'completed' | 'failed';
}

interface PriceAdjustmentSettings {
  maxAdjustmentPercent: number; // 最大調整率
  minProfitMargin: number; // 最低利益率
  autoApplyThreshold: number; // 自動適用の閾値
  considerationDays: number; // 検討対象の日数
  enabled: boolean;
}

const Analytics: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<'monthly' | 'session' | 'store-analysis' | 'inventory-optimization' | 'price-strategy' | 'advanced-analysis' | 'auto-pricing' | 'bulk-discard'>('monthly');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [storeOverviewData, setStoreOverviewData] = useState<StoreOverview[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<SlowMovingItem[]>([]);
  const [turnoverAnalysis, setTurnoverAnalysis] = useState<TurnoverAnalysis[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null);
  const [pricePerformanceItems, setPricePerformanceItems] = useState<PricePerformanceItem[]>([]);
  const [categoryPricing, setCategoryPricing] = useState<CategoryPricing[]>([]);
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalyticsData | null>(null);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['category', 'brand']);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [reportName, setReportName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [priceSuggestions, setPriceSuggestions] = useState<PriceAdjustmentSuggestion[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceAdjustmentHistory[]>([]);
  const [priceSettings, setPriceSettings] = useState<PriceAdjustmentSettings>({
    maxAdjustmentPercent: 20,
    minProfitMargin: 10,
    autoApplyThreshold: 0,
    considerationDays: 30,
    enabled: false
  });
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [strategicData, setStrategicData] = useState<StrategicAnalysisData[]>([]);
  const [selectedStrategicSession, setSelectedStrategicSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionTabs, setSessionTabs] = useState<{ [key: string]: 'details' | 'strategic' }>({});
  
  // 一括廃棄ツール用のstate
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedStorePurchaseId, setSelectedStorePurchaseId] = useState<string>('');
  const [productPrefix, setProductPrefix] = useState<string>('廃棄商品');
  const [productCount, setProductCount] = useState<number>(42);
  const [discardReason, setDiscardReason] = useState<string>('品質不良');
  const [discardDate, setDiscardDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (activeMenu === 'monthly') {
      fetchMonthlyData();
    } else if (activeMenu === 'session') {
      fetchSessionData();
      fetchStrategicData();
    } else if (activeMenu === 'store-analysis') {
      fetchStoreAnalysisData();
    } else if (activeMenu === 'inventory-optimization') {
      fetchInventoryOptimizationData();
    } else if (activeMenu === 'price-strategy') {
      fetchPriceStrategyData();
    } else if (activeMenu === 'advanced-analysis') {
      fetchAdvancedAnalysisData();
    } else if (activeMenu === 'auto-pricing') {
      fetchAutoPricingData();
    } else if (activeMenu === 'bulk-discard') {
      fetchBulkDiscardData();
    }
  }, [activeMenu]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      // 売却済み商品データを取得
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'sold')
        .order('sold_at', { ascending: false });

      if (error) throw error;

      // 月別に集計
      const monthlyMap = new Map<string, MonthlyData>();
      
      products?.forEach(product => {
        if (product.sold_at) {
          const date = new Date(product.sold_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const existing = monthlyMap.get(monthKey) || {
            month: monthKey,
            revenue: 0,
            salesFee: 0,
            shippingCost: 0,
            profit: 0,
            profitRate: 0,
            itemsSold: 0,
            avgPrice: 0
          };
          
          const revenue = product.sold_price || 0;
          const salesFee = Math.floor(revenue * 0.1); // 10%の手数料
          const shippingCost = product.shipping_cost || 0;
          
          existing.revenue += revenue;
          existing.salesFee += salesFee;
          existing.shippingCost += shippingCost;
          existing.profit += (revenue - salesFee - shippingCost);
          existing.itemsSold += 1;
          
          monthlyMap.set(monthKey, existing);
        }
      });

      // 平均価格と利益率を計算
      monthlyMap.forEach(data => {
        data.avgPrice = data.itemsSold > 0 ? Math.round(data.revenue / data.itemsSold) : 0;
        data.profitRate = data.revenue > 0 ? Math.round((data.profit / data.revenue) * 100) : 0;
      });

      // ソートして配列に変換
      const sortedData = Array.from(monthlyMap.values())
        .sort((a, b) => b.month.localeCompare(a.month));

      setMonthlyData(sortedData);
    } catch (error) {
      console.error('月別データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // セッション、店舗仕入れ、商品データを取得
      const { data: sessions, error: sessionError } = await supabase
        .from('purchase_sessions')
        .select('*');

      if (sessionError) throw sessionError;

      const { data: storePurchases, error: storeError } = await supabase
        .from('store_purchases')
        .select('*');

      if (storeError) throw storeError;

      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*');

      if (productError) throw productError;

      // セッション別に集計
      const sessionMap = new Map<string, SessionData>();

      sessions?.forEach(session => {
        if (!session || !session.id) return;
        
        // このセッションの店舗仕入れを取得
        const sessionStores = storePurchases?.filter(sp => sp.session_id === session.id) || [];
        const storeIds = sessionStores.map(sp => sp.id);
        
        // 店舗仕入れに紐づく商品を取得
        const sessionProducts = products?.filter(p => 
          p.store_purchase_id && storeIds.includes(p.store_purchase_id)
        ) || [];

        // 集計（商品管理画面と同じ計算方法を使用）
        // 店舗購入データから仕入額を計算
        const storeBasicAmount = sessionStores.reduce((sum, p) => {
          const productAmount = (p as any).product_amount || 0;
          const shippingCost = (p as any).shipping_cost || 0;
          const commissionFee = (p as any).commission_fee || 0;
          return sum + productAmount + shippingCost + commissionFee;
        }, 0);
        
        // 共通経費（輸送費、振込手数料、代行手数料）
        const commonCost = (session.transportation_cost || 0) + 
                          (session.transfer_fee || 0) + 
                          (session.agency_fee || 0);
        
        // 総計（商品管理画面の「総計」と同じ計算）
        const totalCost = storeBasicAmount + commonCost;

        // 商品のステータス別カウント
        const soldProducts = sessionProducts.filter(p => p.status === 'sold');
        const listedProducts = sessionProducts.filter(p => p.status === 'listed');
        const inStockProducts = sessionProducts.filter(p => 
          p.status === 'in_stock' || p.status === 'ready_to_list'
        );
        const discardedProducts = sessionProducts.filter(p => p.status === 'discarded');
        
        // 売上内訳計算
        let grossSales = 0;        // 総売上
        let totalFees = 0;         // 販売手数料合計
        let totalShipping = 0;     // 送料合計
        let netRevenue = 0;        // 実収入額
        
        soldProducts.forEach(p => {
          const soldPrice = p.sold_price || 0;
          const platformFee = p.platform_fee || Math.floor(soldPrice * 0.1); // 保存済みかその場で計算
          const shippingCost = p.shipping_cost || 0;
          
          grossSales += soldPrice;
          totalFees += platformFee;
          totalShipping += shippingCost;
          netRevenue += (soldPrice - platformFee - shippingCost);
        });
        
        // 売却額（回収額）
        const totalRevenue = netRevenue;
        
        // 収益
        const profit = totalRevenue - totalCost;
        
        // 達成率（回収額/総仕入額）
        const achievementRate = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

        // 詳細表示用のデータ計算
        const displayProductCost = storeBasicAmount; // 商品管理画面の「仕入額」
        const displayCommonCost = commonCost;        // 商品管理画面の「共通経費」

        sessionMap.set(session.id, {
          sessionId: session.id,
          sessionTitle: session.title || '',
          productCost: displayProductCost || 0,
          commonCost: displayCommonCost || 0,
          storeCost: 0,
          totalCost: totalCost || 0,
          itemCount: sessionProducts.length || 0,
          soldCount: soldProducts.length || 0,
          listedCount: listedProducts.length || 0,
          inStockCount: inStockProducts.length || 0,
          discardedCount: discardedProducts.length || 0,
          totalRevenue: totalRevenue || 0,
          profit: profit || 0,
          achievementRate: Math.round(achievementRate) || 0,
          // 売上内訳
          grossSales: grossSales || 0,
          totalFees: totalFees || 0,
          totalShipping: totalShipping || 0
        });
      });

      const sortedSessionData = Array.from(sessionMap.values());

      setSessionData(sortedSessionData);
    } catch (error) {
      console.error('セッションデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStrategicData = async () => {
    try {
      setLoading(true);
      
      // セッションデータと関連する商品・購入データを取得
      const [sessionsRes, purchasesRes, productsRes] = await Promise.all([
        supabase.from('purchase_sessions').select('*').order('session_date', { ascending: false }),
        supabase.from('store_purchases').select('*'),
        supabase.from('products').select('*')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (productsRes.error) throw productsRes.error;

      const sessions = sessionsRes.data || [];
      const storePurchases = purchasesRes.data || [];
      const products = productsRes.data || [];

      // セッションごとの戦略分析データを作成
      const strategicAnalysis: StrategicAnalysisData[] = sessions.map(session => {
        // セッションの店舗購入データを取得
        const sessionStores = storePurchases.filter(sp => sp.session_id === session.id);
        const storeIds = sessionStores.map(sp => sp.id);
        
        // セッションの商品データを取得
        const sessionProducts = products.filter(p => 
          p.store_purchase_id && storeIds.includes(p.store_purchase_id)
        );

        // 基本統計
        const totalItems = sessionProducts.length;
        const soldItems = sessionProducts.filter(p => p.status === 'sold').length;
        const remainingItems = totalItems - soldItems;

        // 現在の利益計算
        const soldProducts = sessionProducts.filter(p => p.status === 'sold');
        let currentRevenue = 0;
        soldProducts.forEach(p => {
          const soldPrice = p.sold_price || 0;
          const platformFee = p.platform_fee || Math.floor(soldPrice * 0.1);
          const shippingCost = p.shipping_cost || 0;
          currentRevenue += (soldPrice - platformFee - shippingCost);
        });

        // 総コスト計算
        const storeBasicAmount = sessionStores.reduce((sum, p) => {
          const productAmount = (p as any).product_amount || 0;
          const shippingCost = (p as any).shipping_cost || 0;
          const commissionFee = (p as any).commission_fee || 0;
          return sum + productAmount + shippingCost + commissionFee;
        }, 0);
        
        const commonCost = (session.transportation_cost || 0) + 
                          (session.transfer_fee || 0) + 
                          (session.agency_fee || 0);
        
        const totalCost = storeBasicAmount + commonCost;

        // 現在利益と目標利益
        const currentProfit = currentRevenue - totalCost;
        const targetProfit = 0; // 損益分岐点
        const requiredRevenue = Math.max(0, totalCost - currentRevenue);

        // 残存商品の詳細分析
        const remainingProducts: RemainingProduct[] = sessionProducts
          .filter(p => p.status !== 'sold' && p.status !== 'discarded')
          .map(product => {
            const allocatedCost = product.allocated_cost || product.purchase_cost || 0;
            const currentPrice = product.current_price || product.initial_price || 0;
            const suggestedPrice = currentPrice; // デフォルトは現在価格
            
            // 送料を商品サイズから推定（簡易版）
            const shippingCost = currentPrice < 3000 ? 215 : currentPrice < 10000 ? 750 : 850;
            const platformFee = Math.floor(suggestedPrice * 0.1);
            const netProfit = suggestedPrice - platformFee - shippingCost - allocatedCost;
            const breakEvenPrice = allocatedCost + platformFee + shippingCost;

            // 在庫日数計算
            const createdDate = new Date(product.created_at || new Date());
            const now = new Date();
            const daysInStock = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

            // リスクレベル判定
            let riskLevel: 'low' | 'medium' | 'high' | 'critical';
            let recommendation = '';
            
            if (daysInStock > 90) {
              riskLevel = 'critical';
              recommendation = '大幅値下げまたは廃棄検討';
            } else if (daysInStock > 60) {
              riskLevel = 'high';
              recommendation = '値下げして早期売却を目指す';
            } else if (daysInStock > 30) {
              riskLevel = 'medium';
              recommendation = '価格調整を検討';
            } else {
              riskLevel = 'low';
              recommendation = '現状維持または様子見';
            }

            return {
              id: product.id,
              name: product.name,
              category: product.category,
              brand: product.brand || 'ノーブランド',
              photos: product.photos || [],
              purchaseCost: product.purchase_cost || 0,
              allocatedCost,
              mercariReference: 0, // TODO: 相場データ連携
              initialPrice: product.initial_price || 0,
              currentPrice,
              suggestedPrice,
              status: product.status,
              daysInStock,
              shippingCost,
              platformFee,
              netProfit,
              breakEvenPrice,
              condition: product.condition || '良好',
              size: product.size,
              color: product.color,
              riskLevel,
              recommendation
            };
          });

        return {
          sessionId: session.id,
          sessionTitle: session.title,
          totalItems,
          soldItems,
          remainingItems,
          currentProfit,
          targetProfit,
          requiredRevenue,
          remainingProducts
        };
      }).filter(data => data.remainingItems > 0); // 残存商品があるセッションのみ

      setStrategicData(strategicAnalysis);
      
    } catch (error) {
      console.error('戦略分析データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreAnalysisData = async () => {
    try {
      setLoading(true);
      
      // すべての店舗購入データと店舗情報を取得
      const { data: storePurchases, error: storeError } = await supabase
        .from('store_purchases')
        .select(`
          *,
          stores(id, name)
        `);

      if (storeError) throw storeError;

      // すべての商品データを取得
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*');

      if (productError) throw productError;

      // 店舗別に集計
      const storeMap: Record<string, StoreOverview> = {};

      storePurchases?.forEach(purchase => {
        const storeId = purchase.store_id || 'unknown';
        const storeName = purchase.stores?.name || 'Unknown Store';
        
        if (!storeMap[storeId]) {
          storeMap[storeId] = {
            storeId,
            storeName,
            totalPurchases: 0,
            totalAmount: 0,
            totalItems: 0,
            soldItems: 0,
            soldAmount: 0,
            profit: 0,
            profitRate: 0,
            roi: 0,
            lastPurchaseDate: null,
            rank: 'D'
          };
        }

        const store = storeMap[storeId];
        
        // 基本データ
        store.totalPurchases++;
        const purchaseAmount = (purchase.product_amount || 0) + 
                              (purchase.shipping_cost || 0) + 
                              (purchase.commission_fee || 0);
        store.totalAmount += purchaseAmount;
        store.totalItems += purchase.item_count || 0;

        // 商品の売却データ
        const storeProducts = products?.filter(p => p.store_purchase_id === purchase.id) || [];
        const soldProducts = storeProducts.filter(p => p.status === 'sold');
        
        store.soldItems += soldProducts.length;
        store.soldAmount += soldProducts.reduce((sum, p) => sum + (p.sold_price || 0), 0);

        // 最終利用日
        if (purchase.created_at) {
          if (!store.lastPurchaseDate || purchase.created_at > store.lastPurchaseDate) {
            store.lastPurchaseDate = purchase.created_at;
          }
        }
      });

      // 利益率・ROI・ランク計算
      Object.values(storeMap).forEach(store => {
        store.profit = store.soldAmount - store.totalAmount;
        store.profitRate = store.soldAmount > 0 ? (store.profit / store.soldAmount) * 100 : 0;
        store.roi = store.totalAmount > 0 ? (store.profit / store.totalAmount) * 100 : 0;
        
        // ランク判定（ROIベース）
        if (store.roi >= 50) store.rank = 'S';
        else if (store.roi >= 30) store.rank = 'A';
        else if (store.roi >= 10) store.rank = 'B';
        else if (store.roi >= 0) store.rank = 'C';
        else store.rank = 'D';
      });

      const sortedStoreData = Object.values(storeMap).sort((a, b) => b.roi - a.roi);
      setStoreOverviewData(sortedStoreData);

    } catch (error) {
      console.error('店舗分析データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryOptimizationData = async () => {
    try {
      setLoading(true);

      // 全商品データを取得（在庫・出品中・売却済み）
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productError) throw productError;

      if (!products) return;

      const now = new Date();
      const slowMovingItems: SlowMovingItem[] = [];
      const categoryMap: Record<string, TurnoverAnalysis> = {};

      let totalValue = 0;
      let activeListings = 0;
      let slowMovingValue = 0;
      let deadStockValue = 0;

      // 商品分析
      products.forEach(product => {
        const createdDate = new Date(product.created_at);
        const daysInStock = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const cost = product.allocated_cost || product.purchase_cost || 0;
        const currentPrice = product.current_price || product.initial_price || 0;

        // 総在庫価値計算
        if (product.status !== 'sold' && product.status !== 'discarded') {
          totalValue += cost;
          
          if (product.status === 'listed') {
            activeListings++;
          }
        }

        // 滞留在庫分析
        if (product.status === 'in_stock' || product.status === 'listed') {
          let riskLevel: 'low' | 'medium' | 'high' | 'critical';
          let recommendedAction: 'price_reduction' | 'promotion' | 'dispose' | 'hold';

          if (daysInStock > 90) {
            riskLevel = 'critical';
            recommendedAction = 'dispose';
            deadStockValue += cost;
          } else if (daysInStock > 60) {
            riskLevel = 'high';
            recommendedAction = 'price_reduction';
            slowMovingValue += cost;
          } else if (daysInStock > 30) {
            riskLevel = 'medium';
            recommendedAction = 'promotion';
            slowMovingValue += cost;
          } else {
            riskLevel = 'low';
            recommendedAction = 'hold';
          }

          if (daysInStock > 30) {
            slowMovingItems.push({
              productId: product.id,
              productName: product.name,
              category: product.category,
              brand: product.brand || 'ノーブランド',
              daysInStock,
              purchaseCost: cost,
              currentPrice,
              listingStatus: product.status,
              recommendedAction,
              riskLevel
            });
          }
        }

        // カテゴリ別回転率分析
        const category = product.category || 'その他';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            totalItems: 0,
            soldItems: 0,
            averageDaysToSell: 0,
            turnoverRate: 0,
            fastMovers: 0,
            mediumMovers: 0,
            slowMovers: 0,
            deadStock: 0
          };
        }

        const catData = categoryMap[category];
        catData.totalItems++;

        if (product.status === 'sold') {
          catData.soldItems++;
          
          if (product.sold_at) {
            const soldDate = new Date(product.sold_at);
            const daysToSell = Math.floor((soldDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            catData.averageDaysToSell = (catData.averageDaysToSell * (catData.soldItems - 1) + daysToSell) / catData.soldItems;
          }
        } else {
          // 在庫商品の分類
          if (daysInStock < 30) catData.fastMovers++;
          else if (daysInStock < 60) catData.mediumMovers++;
          else if (daysInStock < 90) catData.slowMovers++;
          else catData.deadStock++;
        }
      });

      // カテゴリ別回転率計算
      Object.values(categoryMap).forEach(cat => {
        cat.turnoverRate = cat.totalItems > 0 ? (cat.soldItems / cat.totalItems) * 100 : 0;
      });

      // 在庫健全性スコア計算
      const turnoverScore = totalValue > 0 ? ((totalValue - slowMovingValue - deadStockValue) / totalValue) * 100 : 100;
      let healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
      
      if (turnoverScore >= 90) healthGrade = 'A';
      else if (turnoverScore >= 80) healthGrade = 'B';
      else if (turnoverScore >= 70) healthGrade = 'C';
      else if (turnoverScore >= 60) healthGrade = 'D';
      else healthGrade = 'F';

      // データをセット
      setSlowMovingItems(slowMovingItems.sort((a, b) => b.daysInStock - a.daysInStock));
      setTurnoverAnalysis(Object.values(categoryMap).sort((a, b) => b.turnoverRate - a.turnoverRate));
      setInventoryHealth({
        totalValue,
        activeListings,
        slowMovingValue,
        deadStockValue,
        turnoverScore: Math.round(turnoverScore),
        healthGrade
      });

    } catch (error) {
      console.error('在庫最適化データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceStrategyData = async () => {
    try {
      setLoading(true);

      // 出品中・在庫商品を取得
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')
        .in('status', ['listed', 'in_stock', 'ready_to_list'])
        .order('created_at', { ascending: false });

      if (productError) throw productError;

      if (!products) return;

      const now = new Date();
      const pricePerformanceItems: PricePerformanceItem[] = [];
      const categoryMap: Record<string, CategoryPricing> = {};

      let totalItems = 0;
      let underpriced = 0;
      let overpriced = 0;
      let optimalPriced = 0;
      let needsAdjustment = 0;
      let potentialRevenue = 0;
      let totalMarkup = 0;

      // 売却済み商品から価格参考データを取得
      const { data: soldProducts } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'sold');

      const soldByCategory: Record<string, any[]> = {};
      soldProducts?.forEach(product => {
        const category = product.category || 'その他';
        if (!soldByCategory[category]) soldByCategory[category] = [];
        soldByCategory[category].push(product);
      });

      // カテゴリ別価格統計計算
      Object.entries(soldByCategory).forEach(([category, soldItems]) => {
        const prices = soldItems.map(item => item.sold_price).filter(Boolean);
        const daysToSell = soldItems
          .filter(item => item.sold_at && item.created_at)
          .map(item => {
            const createdDate = new Date(item.created_at);
            const soldDate = new Date(item.sold_at);
            return Math.floor((soldDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          });

        if (prices.length > 0) {
          const avgSoldPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          const avgDaysToSell = daysToSell.length > 0 ? daysToSell.reduce((sum, days) => sum + days, 0) / daysToSell.length : 0;
          
          categoryMap[category] = {
            category,
            avgInitialPrice: avgSoldPrice * 1.2, // 推定初期価格
            avgSoldPrice,
            avgDaysToSell,
            successRate: (soldItems.length / (soldItems.length + 10)) * 100, // 仮の成功率
            optimalPriceRange: {
              min: avgSoldPrice * 0.8,
              max: avgSoldPrice * 1.2
            },
            priceElasticity: Math.random() * 2 + 1 // 仮の価格弾力性
          };
        }
      });

      // 商品別価格パフォーマンス分析
      products.forEach(product => {
        const createdDate = new Date(product.created_at);
        const daysListed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const cost = product.allocated_cost || product.purchase_cost || 0;
        const currentPrice = product.current_price || product.initial_price || 0;
        const initialPrice = product.initial_price || currentPrice;
        
        const category = product.category || 'その他';
        const categoryData = categoryMap[category];

        totalItems++;
        const markup = cost > 0 ? ((currentPrice - cost) / cost) * 100 : 0;
        totalMarkup += markup;

        // 価格推奨ロジック
        let recommendedPrice = currentPrice;
        let actionType: 'increase' | 'decrease' | 'maintain' | 'urgent_reduction' = 'maintain';
        let sellProbability = 50; // 基本50%

        if (categoryData) {
          const optimalMin = categoryData.optimalPriceRange.min;
          const optimalMax = categoryData.optimalPriceRange.max;
          
          if (currentPrice < optimalMin) {
            // 価格が低すぎる
            recommendedPrice = optimalMin;
            actionType = 'increase';
            underpriced++;
            sellProbability = 85;
          } else if (currentPrice > optimalMax) {
            // 価格が高すぎる
            if (daysListed > 60) {
              recommendedPrice = optimalMax;
              actionType = 'urgent_reduction';
              needsAdjustment++;
              sellProbability = 15;
            } else {
              recommendedPrice = optimalMax;
              actionType = 'decrease';
              overpriced++;
              sellProbability = 30;
            }
          } else {
            // 適正価格範囲内
            optimalPriced++;
            sellProbability = 70;
          }
        } else {
          // カテゴリデータがない場合の基本ロジック
          if (daysListed > 30 && currentPrice > cost * 1.5) {
            recommendedPrice = currentPrice * 0.9;
            actionType = 'decrease';
            sellProbability = 40;
          }
        }

        // 日数による調整
        if (daysListed > 90) sellProbability *= 0.5;
        else if (daysListed > 60) sellProbability *= 0.7;
        else if (daysListed > 30) sellProbability *= 0.85;

        pricePerformanceItems.push({
          productId: product.id,
          productName: product.name,
          category: product.category || 'その他',
          initialPrice,
          currentPrice,
          purchaseCost: cost,
          daysListed,
          priceChanges: Math.floor(Math.random() * 3), // 仮の価格変更回数
          sellProbability: Math.min(100, Math.max(0, Math.round(sellProbability))),
          recommendedPrice: Math.round(recommendedPrice),
          actionType
        });

        potentialRevenue += Math.max(0, recommendedPrice - currentPrice);
      });

      // データをセット
      setPricePerformanceItems(pricePerformanceItems.sort((a, b) => b.sellProbability - a.sellProbability));
      setCategoryPricing(Object.values(categoryMap).sort((a, b) => b.successRate - a.successRate));
      setPricingStrategy({
        totalItems,
        underpriced,
        overpriced,
        optimalPriced,
        needsAdjustment,
        potentialRevenue: Math.round(potentialRevenue),
        averageMarkup: totalItems > 0 ? totalMarkup / totalItems : 0
      });

    } catch (error) {
      console.error('価格戦略データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvancedAnalysisData = async () => {
    try {
      setLoading(true);
      
      // 全商品データを取得
      const { data: allProducts, error } = await supabase
        .from('products')
        .select(`
          *,
          store_purchases!inner(
            *,
            stores!inner(name)
          )
        `);

      if (error) throw error;

      // 多次元分析データを生成
      const analysisMap = new Map<string, any>();
      const categoryStats = new Map<string, any>();
      
      allProducts?.forEach(product => {
        const category = product.category || 'その他';
        const brand = product.brand || 'ノーブランド';
        const condition = product.condition || '未設定';
        const price = product.current_price || product.initial_price || 0;
        const cost = product.allocated_cost || product.purchase_cost || 0;
        
        // 価格帯の決定
        let priceRange = '低価格帯';
        if (price >= 10000) priceRange = '高価格帯';
        else if (price >= 3000) priceRange = '中価格帯';
        
        const key = `${category}-${brand}-${condition}-${priceRange}`;
        
        const existing = analysisMap.get(key) || {
          category,
          brand,
          condition,
          priceRange,
          totalItems: 0,
          soldItems: 0,
          totalDaysToSell: 0,
          totalProfit: 0,
          totalCost: 0,
          totalRevenue: 0
        };
        
        existing.totalItems++;
        existing.totalCost += cost;
        
        if (product.status === 'sold') {
          existing.soldItems++;
          existing.totalRevenue += product.sold_price || 0;
          existing.totalProfit += (product.sold_price || 0) - cost;
          
          if (product.listed_at && product.sold_at) {
            const daysToSell = Math.floor((new Date(product.sold_at).getTime() - new Date(product.listed_at).getTime()) / (1000 * 60 * 60 * 24));
            existing.totalDaysToSell += daysToSell;
          }
        }
        
        analysisMap.set(key, existing);
        
        // カテゴリ統計の更新
        const catStat = categoryStats.get(category) || { totalItems: 0, soldItems: 0, totalRevenue: 0 };
        catStat.totalItems++;
        if (product.status === 'sold') {
          catStat.soldItems++;
          catStat.totalRevenue += product.sold_price || 0;
        }
        categoryStats.set(category, catStat);
      });
      
      // 多次元分析結果の構築
      const multiDimensionalAnalysis: MultiDimensionalAnalysis[] = Array.from(analysisMap.values())
        .map(data => {
          const sellThroughRate = data.totalItems > 0 ? (data.soldItems / data.totalItems) * 100 : 0;
          const avgDaysToSell = data.soldItems > 0 ? data.totalDaysToSell / data.soldItems : 0;
          const avgProfit = data.soldItems > 0 ? data.totalProfit / data.soldItems : 0;
          const profitMargin = data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0;
          const roi = data.totalCost > 0 ? (data.totalProfit / data.totalCost) * 100 : 0;
          
          // スコア計算（売上率、利益率、回転率を総合）
          const score = Math.min(100, (sellThroughRate * 0.4) + (Math.min(100, roi) * 0.3) + (Math.max(0, 100 - avgDaysToSell / 10) * 0.3));
          
          // 推奨事項の生成
          const recommendations: string[] = [];
          if (sellThroughRate < 30) recommendations.push('在庫回転率改善が必要');
          if (avgDaysToSell > 60) recommendations.push('価格戦略の見直し');
          if (roi < 20) recommendations.push('仕入コスト最適化');
          if (score > 80) recommendations.push('優秀セグメント - 拡大推奨');
          
          return {
            category: data.category,
            brand: data.brand,
            condition: data.condition,
            priceRange: data.priceRange,
            totalItems: data.totalItems,
            soldItems: data.soldItems,
            sellThroughRate: Math.round(sellThroughRate * 10) / 10,
            avgDaysToSell: Math.round(avgDaysToSell),
            avgProfit: Math.round(avgProfit),
            profitMargin: Math.round(profitMargin * 10) / 10,
            roi: Math.round(roi * 10) / 10,
            score: Math.round(score),
            recommendations
          };
        })
        .filter(item => item.totalItems >= 3)
        .sort((a, b) => b.score - a.score);
      
      // 予測データ（季節性とトレンドを考慮した簡易予測）
      const predictions: PredictionData[] = Array.from(categoryStats.entries())
        .map(([category, stats]) => {
          const currentMonth = new Date().getMonth();
          let seasonalityFactor = 1.0;
          
          // 簡易的な季節性ファクター
          if (category.includes('服') || category.includes('ファッション')) {
            seasonalityFactor = [0.8, 0.7, 1.1, 1.2, 1.0, 0.9, 0.8, 0.8, 1.1, 1.3, 1.4, 1.2][currentMonth];
          } else if (category.includes('本') || category.includes('雑貨')) {
            seasonalityFactor = [1.0, 0.9, 1.0, 1.0, 1.1, 1.0, 0.9, 0.8, 1.2, 1.1, 1.1, 1.3][currentMonth];
          }
          
          const baselineDemand = stats.soldItems || 1;
          const predictedDemand = Math.round(baselineDemand * seasonalityFactor);
          const sellThroughRate = stats.totalItems > 0 ? stats.soldItems / stats.totalItems : 0;
          
          return {
            category,
            predictedDemand,
            seasonalityFactor,
            trendDirection: sellThroughRate > 0.6 ? 'up' : sellThroughRate > 0.3 ? 'stable' : 'down',
            confidenceLevel: Math.min(95, Math.round(sellThroughRate * 100 + 20)),
            recommendedStock: Math.max(1, Math.round(predictedDemand * 1.2)),
            riskLevel: sellThroughRate > 0.5 ? 'low' : sellThroughRate > 0.2 ? 'medium' : 'high'
          };
        })
        .sort((a, b) => b.predictedDemand - a.predictedDemand);
      
      // シミュレーション結果
      const totalRevenue = allProducts?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;
      const simulations: SimulationResult[] = [
        {
          scenario: '価格10%削減',
          description: '全商品を10%値下げした場合の売上増加予測',
          currentRevenue: totalRevenue,
          projectedRevenue: totalRevenue * 1.25,
          revenueChange: totalRevenue * 0.25,
          impactedItems: allProducts?.length || 0,
          implementationCost: 0,
          roi: 250,
          feasibility: 'high'
        },
        {
          scenario: '高回転カテゴリ強化',
          description: '売れ筋カテゴリの仕入れを2倍に増加',
          currentRevenue: totalRevenue,
          projectedRevenue: totalRevenue * 1.4,
          revenueChange: totalRevenue * 0.4,
          impactedItems: Math.floor((allProducts?.length || 0) * 0.3),
          implementationCost: totalRevenue * 0.2,
          roi: 180,
          feasibility: 'medium'
        },
        {
          scenario: '滞留在庫処分',
          description: '90日以上の在庫を50%価格で処分',
          currentRevenue: totalRevenue,
          projectedRevenue: totalRevenue * 1.15,
          revenueChange: totalRevenue * 0.15,
          impactedItems: Math.floor((allProducts?.length || 0) * 0.15),
          implementationCost: 0,
          roi: 150,
          feasibility: 'high'
        }
      ];
      
      // インサイトの生成
      const topPerformingCategory = Array.from(categoryStats.entries())
        .map(([cat, stats]) => ({ 
          category: cat, 
          rate: stats.totalItems > 0 ? stats.soldItems / stats.totalItems : 0,
          revenue: stats.totalRevenue
        }))
        .sort((a, b) => b.rate - a.rate)[0];
      
      const insights = {
        topInsight: `最も売上効率が良いのは「${topPerformingCategory?.category}」カテゴリです（売上率${Math.round((topPerformingCategory?.rate || 0) * 100)}%）`,
        opportunities: [
          '季節商品の仕入れタイミングを最適化することで売上15%向上の可能性',
          'A評価セグメントの商品構成比を増加させることで利益率改善',
          '価格弾力性の高いカテゴリでの動的価格設定導入'
        ],
        risks: [
          '滞留在庫の増加により資金効率が低下中',
          '低評価セグメントの在庫が全体収益を圧迫',
          '季節性の高いカテゴリでの在庫調整リスク'
        ]
      };
      
      setAdvancedAnalytics({
        multiDimensionalAnalysis,
        predictions,
        simulations,
        insights
      });
      
    } catch (error) {
      console.error('高度分析データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoPricingData = async () => {
    try {
      setLoading(true);
      
      // 出品中の商品データを取得
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('status', ['listed', 'ready_to_list'])
        .order('listed_at', { ascending: true });

      if (error) throw error;

      const suggestions: PriceAdjustmentSuggestion[] = [];
      const today = new Date();

      products?.forEach(product => {
        const currentPrice = product.current_price || product.initial_price || 0;
        const purchaseCost = product.allocated_cost || product.purchase_cost || 0;
        const listedDate = product.listed_at ? new Date(product.listed_at) : new Date(product.created_at);
        const daysListed = Math.floor((today.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // 最低価格を計算（原価 + 最低利益マージン）
        const minPrice = Math.ceil(purchaseCost * (1 + priceSettings.minProfitMargin / 100));
        const maxAdjustmentAmount = currentPrice * (priceSettings.maxAdjustmentPercent / 100);
        
        // 価格調整提案ロジック
        let suggestedPrice = currentPrice;
        let adjustmentReason = '';
        let expectedImpact = '';
        let priority: 'high' | 'medium' | 'low' = 'low';
        let riskLevel: 'safe' | 'moderate' | 'risky' = 'safe';

        // 長期滞留商品の価格調整
        if (daysListed > 90) {
          const reductionRate = Math.min(0.3, daysListed / 300); // 最大30%削減
          suggestedPrice = Math.max(minPrice, Math.floor(currentPrice * (1 - reductionRate)));
          adjustmentReason = `${daysListed}日間滞留により価格見直しが必要`;
          expectedImpact = '売却確率30-50%向上予測';
          priority = 'high';
          riskLevel = daysListed > 180 ? 'moderate' : 'safe';
        } else if (daysListed > 60) {
          const reductionRate = Math.min(0.2, daysListed / 400);
          suggestedPrice = Math.max(minPrice, Math.floor(currentPrice * (1 - reductionRate)));
          adjustmentReason = `${daysListed}日間の販売実績を踏まえた価格最適化`;
          expectedImpact = '売却確率15-25%向上予測';
          priority = 'medium';
          riskLevel = 'safe';
        } else if (daysListed > 30) {
          const reductionRate = Math.min(0.1, daysListed / 500);
          suggestedPrice = Math.max(minPrice, Math.floor(currentPrice * (1 - reductionRate)));
          adjustmentReason = `市場動向を踏まえた競争力向上のための調整`;
          expectedImpact = '売却確率10-15%向上予測';
          priority = 'low';
          riskLevel = 'safe';
        }

        // 利益率チェック
        const profitMargin = ((suggestedPrice - purchaseCost) / suggestedPrice) * 100;
        if (profitMargin < priceSettings.minProfitMargin) {
          suggestedPrice = minPrice;
          adjustmentReason = `利益率確保のため最低価格に設定`;
          expectedImpact = '利益率維持優先';
          riskLevel = 'risky';
        }

        // 実際に調整が必要な商品のみ提案に追加
        if (suggestedPrice !== currentPrice && daysListed >= priceSettings.considerationDays) {
          suggestions.push({
            productId: product.id,
            productName: product.name,
            category: product.category || 'その他',
            currentPrice,
            suggestedPrice,
            adjustmentReason,
            expectedImpact,
            daysListed,
            purchaseCost,
            minPrice,
            maxAdjustment: maxAdjustmentAmount,
            priority,
            riskLevel,
            status: 'pending'
          });
        }
      });

      // 優先度順でソート
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      suggestions.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.daysListed - a.daysListed;
      });

      setPriceSuggestions(suggestions);

      // 価格変更履歴をモックデータで生成（実際の実装では別テーブルから取得）
      const mockHistory: PriceAdjustmentHistory[] = [
        {
          id: '1',
          productId: 'mock-1',
          productName: '価格調整済み商品A',
          oldPrice: 5000,
          newPrice: 4200,
          reason: '60日間滞留による価格最適化',
          appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          appliedBy: 'システム提案',
          status: 'completed'
        },
        {
          id: '2',
          productId: 'mock-2',
          productName: '価格調整済み商品B',
          oldPrice: 8000,
          newPrice: 7200,
          reason: '90日間滞留による価格見直し',
          appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          appliedBy: 'ユーザー承認',
          status: 'completed'
        }
      ];

      setPriceHistory(mockHistory);

    } catch (error) {
      console.error('自動価格調整データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 価格調整提案の承認処理
  const handleApproveSuggestion = async (suggestionId: string) => {
    const suggestion = priceSuggestions.find(s => s.productId === suggestionId);
    if (!suggestion) return;

    try {
      setLoading(true);
      
      // 確認ダイアログ
      const confirmed = window.confirm(
        `${suggestion.productName} の価格を ¥${suggestion.currentPrice.toLocaleString()} から ¥${suggestion.suggestedPrice.toLocaleString()} に変更しますか？\n\n理由: ${suggestion.adjustmentReason}`
      );

      if (!confirmed) return;

      // 商品価格を更新
      const { error } = await supabase
        .from('products')
        .update({ 
          current_price: suggestion.suggestedPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestion.productId);

      if (error) throw error;

      // 提案リストから削除
      setPriceSuggestions(prev => prev.filter(s => s.productId !== suggestionId));
      
      // 履歴に追加
      const historyItem: PriceAdjustmentHistory = {
        id: Date.now().toString(),
        productId: suggestion.productId,
        productName: suggestion.productName,
        oldPrice: suggestion.currentPrice,
        newPrice: suggestion.suggestedPrice,
        reason: suggestion.adjustmentReason,
        appliedAt: new Date().toISOString(),
        appliedBy: 'ユーザー承認',
        status: 'completed'
      };
      
      setPriceHistory(prev => [historyItem, ...prev]);

      alert(`${suggestion.productName} の価格を更新しました。\nメルカリでも価格変更を忘れずに行ってください。`);

    } catch (error) {
      console.error('価格更新エラー:', error);
      alert('価格更新に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 価格調整提案の拒否処理
  const handleRejectSuggestion = (suggestionId: string) => {
    setPriceSuggestions(prev => prev.filter(s => s.productId !== suggestionId));
  };

  // 一括承認処理
  const handleBulkApprove = async () => {
    if (selectedSuggestions.size === 0) {
      alert('承認する商品を選択してください。');
      return;
    }

    const confirmed = window.confirm(
      `選択した${selectedSuggestions.size}件の価格調整を実行しますか？`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const selectedItems = priceSuggestions.filter(s => selectedSuggestions.has(s.productId));
      
      for (const suggestion of selectedItems) {
        await handleApproveSuggestion(suggestion.productId);
      }
      
      setSelectedSuggestions(new Set());
      
    } catch (error) {
      console.error('一括承認エラー:', error);
      alert('一括承認処理でエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 価格調整ヘルパー関数
  const updateSuggestedPrice = (sessionId: string, productId: string, newPrice: number) => {
    setStrategicData(prevData => 
      prevData.map(session => {
        if (session.sessionId === sessionId) {
          const updatedProducts = session.remainingProducts.map(product => {
            if (product.id === productId) {
              const suggestedPrice = newPrice;
              const platformFee = Math.floor(suggestedPrice * 0.1);
              const netProfit = suggestedPrice - platformFee - product.shippingCost - product.allocatedCost;
              
              return {
                ...product,
                suggestedPrice,
                platformFee,
                netProfit
              };
            }
            return product;
          });
          
          return {
            ...session,
            remainingProducts: updatedProducts
          };
        }
        return session;
      })
    );
  };

  // シミュレーション用の利益計算
  const calculateSimulatedProfit = (sessionData: StrategicAnalysisData): number => {
    const totalSimulatedRevenue = sessionData.remainingProducts.reduce((sum, product) => {
      const revenue = product.suggestedPrice - product.platformFee - product.shippingCost;
      return sum + Math.max(0, revenue);
    }, 0);
    
    return sessionData.currentProfit + totalSimulatedRevenue;
  };

  const fetchBulkDiscardData = async () => {
    try {
      setLoading(true);
      
      const [sessionsRes, purchasesRes] = await Promise.all([
        supabase.from('purchase_sessions').select('*'),
        supabase.from('store_purchases').select('*')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;

      setSessions(sessionsRes.data || []);
      setStorePurchases(purchasesRes.data || []);
    } catch (error) {
      console.error('一括廃棄データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllocatedCostForBulk = async (storePurchaseId: string): Promise<number> => {
    try {
      // 選択された店舗仕入れの情報を取得
      const selectedStorePurchase = storePurchases.find(sp => sp.id === storePurchaseId);
      if (!selectedStorePurchase) return 0;

      // セッション情報を取得
      const session = sessions.find(s => s.id === selectedStorePurchase.session_id);
      if (!session) return 0;

      // 既存の商品数を取得
      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .eq('store_purchase_id', storePurchaseId);

      const existingCount = existingProducts?.length || 0;
      const totalItems = existingCount + productCount;

      // 按分計算（StorePurchaseDetailと同じロジック）
      const currentStoreAmount = selectedStorePurchase.total_amount || 0;
      const commonCosts = (session.transportation_cost || 0) + 
                         (session.transfer_fee || 0) + 
                         (session.agency_fee || 0);

      // 他の店舗仕入れも含めた総額を計算
      const sessionStores = storePurchases.filter(sp => sp.session_id === session.id);
      const totalAmount = sessionStores.reduce((sum, sp) => sum + (sp.total_amount || 0), 0);

      const allocatedCommonCost = totalAmount > 0 ? 
        (commonCosts * currentStoreAmount / totalAmount) : 0;

      const allocatedCostPerItem = Math.round((currentStoreAmount + allocatedCommonCost) / totalItems);

      return allocatedCostPerItem;
    } catch (error) {
      console.error('按分後単価計算エラー:', error);
      return 0;
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedStorePurchaseId || productCount <= 0) {
      alert('店舗仕入れと作成数を選択してください');
      return;
    }

    try {
      setLoading(true);

      const allocatedCost = await calculateAllocatedCostForBulk(selectedStorePurchaseId);

      const products = [];
      for (let i = 1; i <= productCount; i++) {
        products.push({
          name: `${productPrefix}${String(i).padStart(3, '0')}`,
          store_purchase_id: selectedStorePurchaseId,
          category: 'その他',
          condition: '不明',
          purchase_cost: 0,
          allocated_cost: allocatedCost,
          initial_price: 0,
          current_price: 0,
          status: 'discarded',
          discarded_at: discardDate,
          notes: `一括作成による廃棄商品 - ${discardReason}`,
          photos: []
        });
      }

      const { error } = await supabase
        .from('products')
        .insert(products);

      if (error) throw error;

      alert(`${productCount}件の廃棄商品データを作成しました`);
      
      // リセット
      setSelectedSessionId('');
      setSelectedStorePurchaseId('');
      setProductCount(42);
      
    } catch (error) {
      console.error('一括作成エラー:', error);
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return '¥0';
    }
    return `¥${amount.toLocaleString()}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const menuItems = [
    { id: 'monthly', label: '月別集計', icon: Calendar },
    { id: 'session', label: 'セッション別分析', icon: TrendingUp },
    { id: 'store-analysis', label: '店舗別分析', icon: BarChart2 },
    { id: 'inventory-optimization', label: '在庫最適化', icon: AlertTriangle },
    { id: 'price-strategy', label: '価格戦略', icon: Target },
    { id: 'advanced-analysis', label: '高度分析', icon: Brain },
    { id: 'auto-pricing', label: '自動価格調整', icon: Settings },
    { id: 'bulk-discard', label: '廃棄商品一括作成', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドメニュー */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">分析</h2>
        </div>
        <nav className="mt-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id as 'monthly' | 'session' | 'store-analysis' | 'inventory-optimization' | 'price-strategy' | 'advanced-analysis' | 'auto-pricing' | 'bulk-discard')}
              className={`w-full px-6 py-3 text-left flex items-center space-x-3 transition-colors ${
                activeMenu === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="text-xl" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">データを読み込み中...</div>
            </div>
          ) : (
            <>
              {/* 月別集計 */}
              {activeMenu === 'monthly' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">月別集計</h1>
                  
                  {/* サマリーカード */}
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">今月の売上</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(monthlyData[0]?.revenue || 0)}
                          </p>
                        </div>
                        <DollarSign className="text-3xl text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">今月の利益</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(monthlyData[0]?.profit || 0)}
                          </p>
                        </div>
                        <TrendingUp className="text-3xl text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">販売数</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {monthlyData[0]?.itemsSold || 0}
                          </p>
                        </div>
                        <Package className="text-3xl text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">平均単価</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(monthlyData[0]?.avgPrice || 0)}
                          </p>
                        </div>
                        <PieChart className="text-3xl text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* 月別テーブル */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            月
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            売上
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            販売手数料10%
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            送料
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            利益
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            利益率
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            販売数
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            平均単価
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthlyData.map((data) => (
                          <tr key={data.month} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatMonth(data.month)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(data.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                              -{formatCurrency(data.salesFee)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                              -{formatCurrency(data.shippingCost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {formatCurrency(data.profit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {data.profitRate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {data.itemsSold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(data.avgPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* セッション別収益 */}
              {activeMenu === 'session' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">セッション別収益</h1>

                  <div className="space-y-6">
                    {sessionData.map((session) => (
                      <div key={session.sessionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* セッションヘッダー */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{session.sessionTitle}</h3>
                            <button
                              onClick={() => setExpandedSession(
                                expandedSession === session.sessionId ? null : session.sessionId
                              )}
                              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <span className="text-sm">詳細表示</span>
                              {expandedSession === session.sessionId ? 
                                <ChevronDown className="w-5 h-5" /> : 
                                <ChevronRight className="w-5 h-5" />
                              }
                            </button>
                          </div>
                        </div>

                        {/* メイン情報 */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {/* 商品状況 */}
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-2">商品状況</div>
                              <div className="flex justify-center space-x-3 text-sm">
                                <div className="flex flex-col items-center">
                                  <span className="text-green-600 font-bold text-lg">{session.soldCount}</span>
                                  <span className="text-gray-500 text-xs">売却済み</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-blue-600 font-semibold text-lg">{session.listedCount}</span>
                                  <span className="text-gray-500 text-xs">出品中</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-600 font-semibold text-lg">{session.inStockCount}</span>
                                  <span className="text-gray-500 text-xs">在庫</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-red-500 font-semibold text-lg">{session.discardedCount}</span>
                                  <span className="text-gray-500 text-xs">廃棄</span>
                                </div>
                              </div>
                            </div>

                            {/* 仕入額 */}
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-2">仕入額（経費込み）</div>
                              <div className="text-xl font-bold text-gray-900">{formatCurrency(session.totalCost)}</div>
                            </div>

                            {/* 回収額 */}
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-2">回収額</div>
                              <div className="text-xl font-bold text-blue-600">{formatCurrency(session.totalRevenue)}</div>
                            </div>

                            {/* 損益 */}
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-2">現在損益</div>
                              <div className={`text-xl font-bold ${
                                session.profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(session.profit)}
                              </div>
                            </div>
                          </div>

                          {/* 達成率 */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">達成率</span>
                              <span className={`text-2xl font-bold ${
                                session.achievementRate >= 100 ? 'text-green-600' : 
                                session.achievementRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {session.achievementRate}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  session.achievementRate >= 100 ? 'bg-green-500' :
                                  session.achievementRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(session.achievementRate, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 詳細展開部分 */}
                        {expandedSession === session.sessionId && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            {/* タブヘッダー */}
                            <div className="flex border-b border-gray-200 bg-white">
                              <button
                                onClick={() => setSessionTabs({ ...sessionTabs, [session.sessionId]: 'details' })}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                  (!sessionTabs[session.sessionId] || sessionTabs[session.sessionId] === 'details')
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                収益詳細
                              </button>
                              <button
                                onClick={() => setSessionTabs({ ...sessionTabs, [session.sessionId]: 'strategic' })}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                  sessionTabs[session.sessionId] === 'strategic'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                戦略的分析
                              </button>
                            </div>

                            {/* タブコンテンツ */}
                            {(!sessionTabs[session.sessionId] || sessionTabs[session.sessionId] === 'details') ? (
                              <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* 費用内訳 */}
                                  <div className="bg-white rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-700 mb-4 text-lg">費用内訳</h4>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">個別経費:</span>
                                      <span className="font-semibold text-gray-900">{formatCurrency(session.productCost)}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">商品代金 + 送料 + 手数料</div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">共通経費:</span>
                                      <span className="font-semibold text-gray-900">{formatCurrency(session.commonCost)}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">交通費 + 振込手数料 + 代行料</div>
                                  </div>
                                  <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">合計:</span>
                                    <span className="font-bold text-lg text-gray-900">{formatCurrency(session.totalCost)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 売上内訳 */}
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="font-semibold text-gray-700 mb-4 text-lg">売上内訳</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">総売上:</span>
                                    <span className="font-semibold text-blue-600">{formatCurrency(session.grossSales)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">販売手数料:</span>
                                    <span className="font-semibold text-red-600">-{formatCurrency(session.totalFees)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">送料:</span>
                                    <span className="font-semibold text-red-600">-{formatCurrency(session.totalShipping)}</span>
                                  </div>
                                  <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">実収入:</span>
                                    <span className="font-bold text-lg text-green-600">{formatCurrency(session.totalRevenue)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 収益分析 */}
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="font-semibold text-gray-700 mb-4 text-lg">収益分析</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">売却状況:</span>
                                    <span className="font-semibold text-gray-900">{session.soldCount} / {session.itemCount} 点</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">実収入額:</span>
                                    <span className="font-semibold text-blue-600">{formatCurrency(session.totalRevenue)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">総仕入額:</span>
                                    <span className="font-semibold text-gray-900">-{formatCurrency(session.totalCost)}</span>
                                  </div>
                                  <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">利益:</span>
                                    <span className={`font-bold text-lg ${session.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(session.profit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">利益率:</span>
                                    <span className="font-semibold text-gray-900">
                                      {session.totalRevenue > 0 ? 
                                        Math.round((session.profit / session.totalRevenue) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 戦略的分析タブ */
                          <div className="p-6">
                            {(() => {
                              const strategicSession = strategicData.find(s => s.sessionId === session.sessionId);
                              if (!strategicSession || strategicSession.remainingItems === 0) {
                                return (
                                  <div className="text-center py-8 text-gray-500">
                                    <p>残存商品がないため、戦略的分析はありません。</p>
                                  </div>
                                );
                              }

                              const simulatedProfit = calculateSimulatedProfit(strategicSession);
                              const profitImprovement = simulatedProfit - strategicSession.currentProfit;

                              return (
                                <div className="space-y-6">
                                  {/* 利益シミュレーションサマリー */}
                                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold mb-4">利益最大化シミュレーション</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500 mb-1">現在利益</div>
                                        <div className={`text-xl font-bold ${strategicSession.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(strategicSession.currentProfit)}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500 mb-1">損益分岐まで</div>
                                        <div className="text-xl font-bold text-orange-600">
                                          {formatCurrency(strategicSession.requiredRevenue)}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500 mb-1">予想利益</div>
                                        <div className={`text-xl font-bold ${simulatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(simulatedProfit)}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500 mb-1">改善見込</div>
                                        <div className={`text-xl font-bold ${profitImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {profitImprovement >= 0 ? '+' : ''}{formatCurrency(profitImprovement)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 残存商品一覧 */}
                                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200">
                                      <h3 className="text-lg font-semibold">残存商品の価格最適化</h3>
                                      <p className="text-sm text-gray-600 mt-1">売却予想価格を調整して利益を最大化</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">仕入</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">現在価格</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">予想価格</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">送料</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">手数料</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">予想利益</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">在庫日数</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">リスク</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {strategicSession.remainingProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                              <td className="px-3 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                <div className="text-xs text-gray-500">{product.category}</div>
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                                {formatCurrency(product.purchaseCost)}
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                                                {formatCurrency(product.currentPrice)}
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-right">
                                                <input
                                                  type="number"
                                                  value={product.suggestedPrice}
                                                  onChange={(e) => updateSuggestedPrice(strategicSession.sessionId, product.id, parseInt(e.target.value) || 0)}
                                                  className="w-16 px-1 py-1 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-red-600">
                                                {formatCurrency(product.shippingCost)}
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-red-600">
                                                {formatCurrency(product.platformFee)}
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-medium">
                                                <span className={product.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                  {formatCurrency(product.netProfit)}
                                                </span>
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                                {product.daysInStock}日
                                              </td>
                                              <td className="px-3 py-3 whitespace-nowrap text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                  product.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                                  product.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                  product.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                                  'bg-red-100 text-red-800'
                                                }`}>
                                                  {product.riskLevel === 'low' ? '低' :
                                                   product.riskLevel === 'medium' ? '中' :
                                                   product.riskLevel === 'high' ? '高' : '重大'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 店舗別分析 */}
              {activeMenu === 'store-analysis' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">店舗別分析</h1>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {storeOverviewData.map((store) => (
                      <div key={store.storeId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        {/* ヘッダー部分 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate" title={store.storeName}>
                              {store.storeName}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                store.rank === 'S' ? 'bg-yellow-100 text-yellow-800' :
                                store.rank === 'A' ? 'bg-green-100 text-green-800' :
                                store.rank === 'B' ? 'bg-blue-100 text-blue-800' :
                                store.rank === 'C' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {store.rank}ランク
                              </span>
                              <span className="text-sm text-gray-500">
                                {store.totalPurchases}回利用
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/stores/${store.storeId}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex-shrink-0"
                          >
                            詳細 →
                          </Link>
                        </div>
                        
                        {/* 数値データ部分 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">仕入額</div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(store.totalAmount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">利益</div>
                              <div className={`text-sm font-medium ${
                                store.profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(store.profit)}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">売上額</div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(store.soldAmount)}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">ROI</div>
                                <div className={`text-sm font-bold ${
                                  store.roi >= 30 ? 'text-green-600' :
                                  store.roi >= 10 ? 'text-blue-600' :
                                  store.roi >= 0 ? 'text-gray-600' : 'text-red-600'
                                }`}>
                                  {store.roi.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">売却率</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {store.totalItems > 0 ? Math.round((store.soldItems / store.totalItems) * 100) : 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 在庫最適化 */}
              {activeMenu === 'inventory-optimization' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">在庫最適化</h1>
                  
                  {/* 在庫健全性サマリー */}
                  {inventoryHealth && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4">在庫健全性スコア</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {inventoryHealth.turnoverScore}
                          </div>
                          <div className="text-sm text-gray-600">健全性スコア</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-3xl font-bold mb-2 ${
                            inventoryHealth.healthGrade === 'A' ? 'text-green-600' :
                            inventoryHealth.healthGrade === 'B' ? 'text-blue-600' :
                            inventoryHealth.healthGrade === 'C' ? 'text-yellow-600' :
                            inventoryHealth.healthGrade === 'D' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {inventoryHealth.healthGrade}
                          </div>
                          <div className="text-sm text-gray-600">総合評価</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            ¥{inventoryHealth.totalValue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">総在庫価値</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 mb-2">
                            ¥{(inventoryHealth.slowMovingValue + inventoryHealth.deadStockValue).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">問題在庫価値</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* カテゴリ別回転率分析 */}
                  {turnoverAnalysis.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4">カテゴリ別回転率分析</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {turnoverAnalysis.slice(0, 6).map((category) => (
                          <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium text-gray-900">{category.category}</h3>
                              <span className={`text-lg font-bold ${category.turnoverRate >= 70 ? 'text-green-600' : category.turnoverRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {category.turnoverRate.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>総商品:</span>
                                <span>{category.totalItems}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>売却済み:</span>
                                <span>{category.soldItems}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>平均売却期間:</span>
                                <span>{category.averageDaysToSell.toFixed(0)}日</span>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>高速({category.fastMovers})</span>
                                <span>普通({category.mediumMovers})</span>
                                <span>低速({category.slowMovers})</span>
                                <span>滞留({category.deadStock})</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-l-full"
                                  style={{ width: `${(category.fastMovers / category.totalItems) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 滞留在庫アラート */}
                  {slowMovingItems.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-semibold mb-4">滞留在庫アラート</h2>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">商品名</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">カテゴリ</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">在庫日数</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">仕入価格</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">現在価格</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">リスク</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">推奨アクション</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slowMovingItems.slice(0, 20).map((item) => (
                              <tr key={item.productId} className="border-b border-gray-100">
                                <td className="py-3 text-sm">{item.productName}</td>
                                <td className="py-3 text-sm text-gray-600">{item.category}</td>
                                <td className="py-3 text-sm text-right font-medium">{item.daysInStock}日</td>
                                <td className="py-3 text-sm text-right">¥{item.purchaseCost.toLocaleString()}</td>
                                <td className="py-3 text-sm text-right">¥{item.currentPrice.toLocaleString()}</td>
                                <td className="py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    item.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                    item.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                    item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {item.riskLevel === 'critical' ? '危険' :
                                     item.riskLevel === 'high' ? '高' :
                                     item.riskLevel === 'medium' ? '中' : '低'}
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className="text-xs text-gray-600">
                                    {item.recommendedAction === 'price_reduction' ? '値下げ' :
                                     item.recommendedAction === 'promotion' ? 'プロモーション' :
                                     item.recommendedAction === 'dispose' ? '処分検討' : '保留'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 価格戦略 */}
              {activeMenu === 'price-strategy' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">価格戦略</h1>
                  
                  {/* 価格戦略サマリー */}
                  {pricingStrategy && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4">価格設定状況</h2>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 mb-2">
                            {pricingStrategy.underpriced}
                          </div>
                          <div className="text-sm text-gray-600">価格上げ推奨</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 mb-2">
                            {pricingStrategy.overpriced}
                          </div>
                          <div className="text-sm text-gray-600">価格下げ推奨</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {pricingStrategy.optimalPriced}
                          </div>
                          <div className="text-sm text-gray-600">適正価格</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 mb-2">
                            ¥{pricingStrategy.potentialRevenue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">潜在収益向上</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">
                            平均マークアップ率: {pricingStrategy.averageMarkup.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* カテゴリ別最適価格 */}
                  {categoryPricing.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4">カテゴリ別価格分析</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryPricing.slice(0, 6).map((category) => (
                          <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">{category.category}</h3>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">平均売却価格:</span>
                                <span className="font-medium">¥{category.avgSoldPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">平均売却期間:</span>
                                <span className="font-medium">{category.avgDaysToSell.toFixed(0)}日</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">成功率:</span>
                                <span className="font-medium text-green-600">{category.successRate.toFixed(1)}%</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-500 mb-1">推奨価格範囲</div>
                              <div className="text-sm font-medium text-blue-600">
                                ¥{category.optimalPriceRange.min.toLocaleString()} - ¥{category.optimalPriceRange.max.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 商品別価格推奨 */}
                  {pricePerformanceItems.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-semibold mb-4">商品別価格推奨</h2>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">商品名</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">カテゴリ</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">現在価格</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">推奨価格</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">売却確率</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">出品日数</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">推奨アクション</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pricePerformanceItems.slice(0, 20).map((item) => (
                              <tr key={item.productId} className="border-b border-gray-100">
                                <td className="py-3 text-sm">{item.productName}</td>
                                <td className="py-3 text-sm text-gray-600">{item.category}</td>
                                <td className="py-3 text-sm text-right">¥{item.currentPrice.toLocaleString()}</td>
                                <td className="py-3 text-sm text-right font-medium">
                                  <span className={item.recommendedPrice > item.currentPrice ? 'text-green-600' : item.recommendedPrice < item.currentPrice ? 'text-red-600' : 'text-gray-900'}>
                                    ¥{item.recommendedPrice.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <div className="flex items-center justify-center">
                                    <div className={`w-12 h-2 bg-gray-200 rounded-full overflow-hidden`}>
                                      <div 
                                        className={`h-full ${
                                          item.sellProbability >= 70 ? 'bg-green-500' :
                                          item.sellProbability >= 50 ? 'bg-yellow-500' :
                                          item.sellProbability >= 30 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${item.sellProbability}%` }}
                                      ></div>
                                    </div>
                                    <span className="ml-2 text-xs text-gray-600">{item.sellProbability}%</span>
                                  </div>
                                </td>
                                <td className="py-3 text-sm text-right">{item.daysListed}日</td>
                                <td className="py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    item.actionType === 'increase' ? 'bg-green-100 text-green-800' :
                                    item.actionType === 'decrease' ? 'bg-yellow-100 text-yellow-800' :
                                    item.actionType === 'urgent_reduction' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.actionType === 'increase' ? '値上げ' :
                                     item.actionType === 'decrease' ? '値下げ' :
                                     item.actionType === 'urgent_reduction' ? '緊急値下げ' : '維持'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 高度分析機能 */}
              {activeMenu === 'advanced-analysis' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">高度分析</h1>
                  
                  {/* トップインサイト */}
                  {advancedAnalytics?.insights && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <Brain className="text-blue-600 mt-1" size={24} />
                        <div>
                          <h2 className="text-lg font-semibold text-blue-900 mb-2">主要インサイト</h2>
                          <p className="text-blue-800 text-lg font-medium mb-4">{advancedAnalytics.insights.topInsight}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-medium text-green-800 mb-2">🔼 機会</h3>
                              <ul className="space-y-1 text-sm text-green-700">
                                {advancedAnalytics.insights.opportunities.map((opportunity, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-green-600 mt-0.5">•</span>
                                    <span>{opportunity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-red-800 mb-2">⚠️ リスク</h3>
                              <ul className="space-y-1 text-sm text-red-700">
                                {advancedAnalytics.insights.risks.map((risk, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-red-600 mt-0.5">•</span>
                                    <span>{risk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 多次元分析 */}
                  {advancedAnalytics?.multiDimensionalAnalysis && advancedAnalytics.multiDimensionalAnalysis.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <Filter className="text-purple-600" size={20} />
                        <span>多次元分析</span>
                      </h2>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">カテゴリ</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">ブランド</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">状態</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">価格帯</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">商品数</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">売上率</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">ROI</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">スコア</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">推奨事項</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advancedAnalytics.multiDimensionalAnalysis.slice(0, 20).map((analysis, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 text-sm">{analysis.category}</td>
                                <td className="py-3 text-sm text-gray-600">{analysis.brand}</td>
                                <td className="py-3 text-sm text-gray-600">{analysis.condition}</td>
                                <td className="py-3 text-sm text-gray-600">{analysis.priceRange}</td>
                                <td className="py-3 text-sm text-right">{analysis.totalItems}</td>
                                <td className="py-3 text-sm text-right">
                                  <span className={`font-medium ${analysis.sellThroughRate >= 70 ? 'text-green-600' : analysis.sellThroughRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {analysis.sellThroughRate.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="py-3 text-sm text-right">
                                  <span className={`font-medium ${analysis.roi >= 50 ? 'text-green-600' : analysis.roi >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {analysis.roi.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    analysis.score >= 80 ? 'bg-green-100 text-green-800' :
                                    analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    analysis.score >= 40 ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {analysis.score}
                                  </span>
                                </td>
                                <td className="py-3 text-xs text-gray-600 max-w-xs">
                                  {analysis.recommendations.slice(0, 2).join(', ')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 需要予測 */}
                  {advancedAnalytics?.predictions && advancedAnalytics.predictions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <TrendingUp className="text-blue-600" size={20} />
                        <span>需要予測・トレンド分析</span>
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {advancedAnalytics.predictions.slice(0, 9).map((prediction, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-medium text-gray-900">{prediction.category}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                prediction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                prediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                リスク{prediction.riskLevel === 'low' ? '低' : prediction.riskLevel === 'medium' ? '中' : '高'}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">予測需要:</span>
                                <span className="font-medium">{prediction.predictedDemand}個/月</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">季節性:</span>
                                <span className="font-medium">×{prediction.seasonalityFactor.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">トレンド:</span>
                                <span className={`font-medium ${
                                  prediction.trendDirection === 'up' ? 'text-green-600' :
                                  prediction.trendDirection === 'stable' ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                  {prediction.trendDirection === 'up' ? '上昇' : 
                                   prediction.trendDirection === 'stable' ? '安定' : '下降'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">推奨在庫:</span>
                                <span className="font-medium text-blue-600">{prediction.recommendedStock}個</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">信頼度:</span>
                                <span className="font-medium">{prediction.confidenceLevel}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* シミュレーション結果 */}
                  {advancedAnalytics?.simulations && advancedAnalytics.simulations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <Zap className="text-orange-600" size={20} />
                        <span>戦略シミュレーション</span>
                      </h2>
                      
                      <div className="space-y-4">
                        {advancedAnalytics.simulations.map((simulation, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">{simulation.scenario}</h3>
                                <p className="text-sm text-gray-600 mt-1">{simulation.description}</p>
                              </div>
                              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                                simulation.feasibility === 'high' ? 'bg-green-100 text-green-800' :
                                simulation.feasibility === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                実行可能性: {simulation.feasibility === 'high' ? '高' : simulation.feasibility === 'medium' ? '中' : '低'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600">現在売上</div>
                                <div className="font-semibold">¥{simulation.currentRevenue.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">予測売上</div>
                                <div className="font-semibold text-blue-600">¥{simulation.projectedRevenue.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">売上増加</div>
                                <div className="font-semibold text-green-600">+¥{simulation.revenueChange.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">ROI</div>
                                <div className="font-semibold text-orange-600">{simulation.roi}%</div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
                              <span>影響商品数: {simulation.impactedItems.toLocaleString()}個</span>
                              <span>実装コスト: ¥{simulation.implementationCost.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 自動価格調整 */}
              {activeMenu === 'auto-pricing' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">自動価格調整</h1>
                  <p className="text-gray-600 mb-6">AIが滞留期間と市場動向を分析し、最適な価格調整を提案します</p>
                  
                  {/* 設定パネル */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                      <Settings className="text-blue-600" size={20} />
                      <span>調整設定</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大調整率 (%)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={priceSettings.maxAdjustmentPercent}
                          onChange={(e) => setPriceSettings(prev => ({
                            ...prev,
                            maxAdjustmentPercent: parseInt(e.target.value) || 20
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最低利益率 (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={priceSettings.minProfitMargin}
                          onChange={(e) => setPriceSettings(prev => ({
                            ...prev,
                            minProfitMargin: parseInt(e.target.value) || 10
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          検討対象日数
                        </label>
                        <input
                          type="number"
                          min="7"
                          max="365"
                          value={priceSettings.considerationDays}
                          onChange={(e) => setPriceSettings(prev => ({
                            ...prev,
                            considerationDays: parseInt(e.target.value) || 30
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          機能の有効化
                        </label>
                        <button
                          onClick={() => setPriceSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                            priceSettings.enabled
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          {priceSettings.enabled ? '有効' : '無効'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-4">
                      <button
                        onClick={fetchAutoPricingData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        提案を再生成
                      </button>
                      
                      {selectedSuggestions.size > 0 && (
                        <button
                          onClick={handleBulkApprove}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          選択項目を一括承認 ({selectedSuggestions.size}件)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 価格調整提案 */}
                  {priceSuggestions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <Target className="text-orange-600" size={20} />
                        <span>価格調整提案 ({priceSuggestions.length}件)</span>
                      </h2>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.size === priceSuggestions.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSuggestions(new Set(priceSuggestions.map(s => s.productId)));
                                    } else {
                                      setSelectedSuggestions(new Set());
                                    }
                                  }}
                                  className="rounded"
                                />
                              </th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">商品名</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">カテゴリ</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">現在価格</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">提案価格</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">調整額</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">滞留日数</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">優先度</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">リスク</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">理由</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">アクション</th>
                            </tr>
                          </thead>
                          <tbody>
                            {priceSuggestions.map((suggestion) => (
                              <tr key={suggestion.productId} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedSuggestions.has(suggestion.productId)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedSuggestions);
                                      if (e.target.checked) {
                                        newSelected.add(suggestion.productId);
                                      } else {
                                        newSelected.delete(suggestion.productId);
                                      }
                                      setSelectedSuggestions(newSelected);
                                    }}
                                    className="rounded"
                                  />
                                </td>
                                <td className="py-3 text-sm max-w-xs truncate" title={suggestion.productName}>
                                  {suggestion.productName}
                                </td>
                                <td className="py-3 text-sm text-gray-600">{suggestion.category}</td>
                                <td className="py-3 text-sm text-right font-medium">
                                  ¥{suggestion.currentPrice.toLocaleString()}
                                </td>
                                <td className="py-3 text-sm text-right font-medium text-blue-600">
                                  ¥{suggestion.suggestedPrice.toLocaleString()}
                                </td>
                                <td className="py-3 text-sm text-right font-medium text-red-600">
                                  -¥{(suggestion.currentPrice - suggestion.suggestedPrice).toLocaleString()}
                                </td>
                                <td className="py-3 text-sm text-center">{suggestion.daysListed}日</td>
                                <td className="py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    suggestion.riskLevel === 'risky' ? 'bg-red-100 text-red-800' :
                                    suggestion.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {suggestion.riskLevel === 'risky' ? '高' : suggestion.riskLevel === 'moderate' ? '中' : '低'}
                                  </span>
                                </td>
                                <td className="py-3 text-xs text-gray-600 max-w-xs">
                                  <div>{suggestion.adjustmentReason}</div>
                                  <div className="text-blue-600 mt-1">{suggestion.expectedImpact}</div>
                                </td>
                                <td className="py-3">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleApproveSuggestion(suggestion.productId)}
                                      className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition-colors"
                                      title="承認"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleRejectSuggestion(suggestion.productId)}
                                      className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 transition-colors"
                                      title="拒否"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 価格変更履歴 */}
                  {priceHistory.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <Clock className="text-gray-600" size={20} />
                        <span>価格変更履歴</span>
                      </h2>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">商品名</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">変更前</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-600">変更後</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">理由</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">実行者</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">実行日時</th>
                              <th className="text-center py-2 text-sm font-medium text-gray-600">ステータス</th>
                            </tr>
                          </thead>
                          <tbody>
                            {priceHistory.slice(0, 10).map((history) => (
                              <tr key={history.id} className="border-b border-gray-100">
                                <td className="py-3 text-sm">{history.productName}</td>
                                <td className="py-3 text-sm text-right">¥{history.oldPrice.toLocaleString()}</td>
                                <td className="py-3 text-sm text-right font-medium text-blue-600">
                                  ¥{history.newPrice.toLocaleString()}
                                </td>
                                <td className="py-3 text-sm text-gray-600">{history.reason}</td>
                                <td className="py-3 text-sm text-gray-600">{history.appliedBy}</td>
                                <td className="py-3 text-sm text-gray-600">
                                  {new Date(history.appliedAt).toLocaleString('ja-JP')}
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    history.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {history.status === 'completed' ? '完了' : '失敗'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 提案がない場合のメッセージ */}
                  {priceSuggestions.length === 0 && !loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                      <Target className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">価格調整提案がありません</h3>
                      <p className="text-gray-600 mb-4">
                        現在の設定では価格調整が必要な商品はありません。<br/>
                        設定を変更するか、時間が経過すると提案が表示されます。
                      </p>
                      <button
                        onClick={fetchAutoPricingData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        再チェック
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 廃棄商品一括作成 */}
              {activeMenu === 'bulk-discard' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">廃棄商品データ一括作成ツール</h1>
                  <p className="text-gray-600 mb-6">過去データ整理用：商品データが存在しない廃棄商品を一括で作成します</p>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 左側：設定フォーム */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">作成設定</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              対象セッション
                            </label>
                            <select
                              value={selectedSessionId}
                              onChange={(e) => {
                                setSelectedSessionId(e.target.value);
                                setSelectedStorePurchaseId('');
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">セッションを選択してください</option>
                              {sessions.map(session => (
                                <option key={session.id} value={session.id}>
                                  {session.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              対象店舗仕入
                            </label>
                            <select
                              value={selectedStorePurchaseId}
                              onChange={(e) => setSelectedStorePurchaseId(e.target.value)}
                              disabled={!selectedSessionId}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                              <option value="">店舗仕入を選択してください</option>
                              {storePurchases
                                .filter(sp => sp.session_id === selectedSessionId)
                                .map(storePurchase => (
                                  <option key={storePurchase.id} value={storePurchase.id}>
                                    {formatCurrency(storePurchase.total_amount)} - {storePurchase.payment_notes || '店舗仕入'}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              商品名プレフィックス
                            </label>
                            <input
                              type="text"
                              value={productPrefix}
                              onChange={(e) => setProductPrefix(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              作成個数
                            </label>
                            <input
                              type="number"
                              value={productCount}
                              onChange={(e) => setProductCount(Number(e.target.value))}
                              min="1"
                              max="1000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              廃棄理由
                            </label>
                            <select
                              value={discardReason}
                              onChange={(e) => setDiscardReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="品質不良">品質不良</option>
                              <option value="需要なし">需要なし</option>
                              <option value="季節外れ">季節外れ</option>
                              <option value="その他">その他</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              廃棄日
                            </label>
                            <input
                              type="date"
                              value={discardDate}
                              onChange={(e) => setDiscardDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 右側：プレビュー */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">プレビュー</h3>
                        
                        {selectedStorePurchaseId && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">商品名例:</span>
                                <div className="ml-4 text-gray-600">
                                  • {productPrefix}001<br/>
                                  • {productPrefix}002<br/>
                                  • ...<br/>
                                  • {productPrefix}{String(productCount).padStart(3, '0')}
                                </div>
                              </div>
                              
                              <div className="border-t pt-2">
                                <span className="font-medium">作成データ:</span>
                                <div className="ml-4 text-gray-600">
                                  • 個数: {productCount}件<br/>
                                  • 商品仕入価格: ¥0（一括仕入のため）<br/>
                                  • ステータス: 廃棄<br/>
                                  • 廃棄理由: {discardReason}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-6">
                          <button
                            onClick={handleBulkCreate}
                            disabled={!selectedStorePurchaseId || productCount <= 0 || loading}
                            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {loading ? '作成中...' : `${productCount}件の廃棄商品データを作成`}
                          </button>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ 注意: この操作は取り消せません。作成前に設定内容をご確認ください。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;