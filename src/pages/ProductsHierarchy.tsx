import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Package, ChevronRight, Filter, ChevronDown, ChevronUp, Store, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PurchaseSession, StorePurchase } from '../types/index';
import { format } from 'date-fns';

interface SessionStats {
  totalProducts: number;
  inStock: number;
  readyToList: number;
  listed: number;
  sold: number;
  onHold: number;
  discarded: number;
}

interface StoreAnalysis {
  storeId: string;
  storeName: string;
  purchaseAmount: number; // 仕入金額（経費込）
  itemCount: number; // 仕入点数
  discardedItems: number; // 破棄点数
  listedItems: number; // 出品点数
  soldItems: number; // 売却済
  soldAmount: number; // 売却高
  salesExpenses: number; // 売却経費（販売手数料・送料）
  profit: number; // 利益
  profitRate: number; // 利益率
  roi: number; // ROI
}

const ProductsHierarchy: React.FC = () => {
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [storeAnalysis, setStoreAnalysis] = useState<Record<string, StoreAnalysis[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, purchasesRes] = await Promise.all([
        supabase.from('purchase_sessions').select('*'),
        supabase.from('store_purchases').select(`
          *,
          stores(id, name)
        `)
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;

      const validSessions = (sessionsRes.data || []).filter(session => session && session.id);
      setSessions(validSessions);
      setStorePurchases(purchasesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionProductStats = async (sessionId: string): Promise<SessionStats> => {
    try {
      // セッションに関連する商品のステータス別集計を取得
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id, status,
          store_purchases!inner(
            id,
            purchase_sessions!inner(
              id
            )
          )
        `)
        .eq('store_purchases.purchase_sessions.id', sessionId);

      if (error) throw error;

      const stats: SessionStats = {
        totalProducts: products?.length || 0,
        inStock: 0,
        readyToList: 0,
        listed: 0,
        sold: 0,
        onHold: 0,
        discarded: 0
      };

      products?.forEach(product => {
        switch (product.status) {
          case 'in_stock':
            stats.inStock++;
            break;
          case 'ready_to_list':
            stats.readyToList++;
            break;
          case 'listed':
            stats.listed++;
            break;
          case 'sold':
            stats.sold++;
            break;
          case 'on_hold':
            stats.onHold++;
            break;
          case 'discarded':
            stats.discarded++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting session product stats:', error);
      return {
        totalProducts: 0,
        inStock: 0,
        readyToList: 0,
        listed: 0,
        sold: 0,
        onHold: 0,
        discarded: 0
      };
    }
  };

  const getSessionBasicStats = (sessionId: string) => {
    const purchases = storePurchases.filter(p => p.session_id === sessionId);
    const totalAmount = purchases.reduce((sum, p) => {
      // 既存のロジックを使用（按分計算）
      const productAmount = (p as any).product_amount || 0;
      const shippingCost = (p as any).shipping_cost || 0;
      const commissionFee = (p as any).commission_fee || 0;
      return sum + productAmount + shippingCost + commissionFee;
    }, 0);
    const totalItems = purchases.reduce((sum, p) => sum + (p.item_count || 0), 0);
    return { 
      purchaseCount: purchases.length, 
      totalAmount: totalAmount || 0, 
      totalItems,
      purchases 
    };
  };

  const getSessionStoreAnalysis = async (sessionId: string): Promise<StoreAnalysis[]> => {
    try {
      // セッション内の店舗購入データを取得
      const purchases = storePurchases.filter(p => p.session_id === sessionId);
      const storeAnalysisMap: Record<string, StoreAnalysis> = {};
      
      // セッション情報を取得して共通経費を計算
      const session = sessions.find(s => s.id === sessionId);
      const commonExpenses = session ? 
        (session.transportation_cost || 0) + (session.transfer_fee || 0) + (session.agency_fee || 0) : 0;
      
      // 全体の店舗購入額を計算（共通経費按分のため）
      let totalStorePurchaseAmount = 0;

      for (const purchase of purchases) {
        // 各店舗購入に関連する商品データを取得
        const { data: products, error } = await supabase
          .from('products')
          .select('id, status, allocated_cost, purchase_cost, current_price, sold_price, platform_fee, shipping_cost')
          .eq('store_purchase_id', purchase.id);

        if (error) {
          console.error('Error fetching products for store analysis:', error);
          continue;
        }

        const storeId = purchase.store_id || 'unknown';
        const storeName = purchase.stores?.name || 'Unknown Store';
        
        if (!storeAnalysisMap[storeId]) {
          storeAnalysisMap[storeId] = {
            storeId,
            storeName,
            purchaseAmount: 0,
            itemCount: 0,
            discardedItems: 0,
            listedItems: 0,
            soldItems: 0,
            soldAmount: 0,
            salesExpenses: 0,
            profit: 0,
            profitRate: 0,
            roi: 0,
          };
        }

        const store = storeAnalysisMap[storeId];
        
        // セッションと同じ計算方法を使用
        const productAmount = (purchase as any).product_amount || purchase.product_cost || 0;  // 商品代金
        const shippingCost = purchase.shipping_cost || 0;  // 店舗送料
        const commissionFee = purchase.commission_fee || 0;  // 店舗手数料
        const storePurchaseAmount = productAmount + shippingCost + commissionFee;
        
        
        store.purchaseAmount += storePurchaseAmount;
        store.itemCount += purchase.item_count || 0;
        
        // 全体購入額に加算（共通経費按分用）
        totalStorePurchaseAmount += storePurchaseAmount;

        // 商品ステータス別集計
        if (products) {
          const soldProducts = products.filter(p => p.status === 'sold');
          const discardedProducts = products.filter(p => p.status === 'discarded');
          const listedProducts = products.filter(p => p.status === 'listed');
          
          store.soldItems += soldProducts.length;
          store.discardedItems += discardedProducts.length;
          store.listedItems += listedProducts.length;
          
          // 売却高計算
          store.soldAmount += soldProducts.reduce((sum, p) => sum + (p.sold_price || 0), 0);
          
          // 売却経費計算（販売手数料10% + 送料）
          store.salesExpenses += soldProducts.reduce((sum, p) => {
            const platformFee = p.platform_fee || Math.floor((p.sold_price || 0) * 0.1);
            const shippingCost = p.shipping_cost || 0;
            return sum + platformFee + shippingCost;
          }, 0);
        }
      }

      // 共通経費の按分と最終計算
      Object.values(storeAnalysisMap).forEach(store => {
        // 共通経費を店舗購入額の比率で按分
        const commonExpenseShare = totalStorePurchaseAmount > 0 ? 
          (store.purchaseAmount / totalStorePurchaseAmount) * commonExpenses : 0;
        
        // 最終的な仕入金額（経費込）= 店舗仕入額 + 共通経費按分
        store.purchaseAmount += commonExpenseShare;
        
        // 利益 = 売却高 - 売却経費 - 仕入金額（経費込）
        store.profit = store.soldAmount - store.salesExpenses - store.purchaseAmount;
        
        if (store.soldAmount > 0) {
          // 利益率 = 利益 / 売却高 * 100
          store.profitRate = (store.profit / store.soldAmount) * 100;
        }
        
        if (store.purchaseAmount > 0) {
          // ROI = 利益 / 仕入金額（経費込） * 100
          store.roi = (store.profit / store.purchaseAmount) * 100;
        }
      });

      return Object.values(storeAnalysisMap);
    } catch (error) {
      console.error('Error getting session store analysis:', error);
      return [];
    }
  };

  const toggleSessionExpansion = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // 展開時に店舗分析を取得
      if (!storeAnalysis[sessionId]) {
        const analysis = await getSessionStoreAnalysis(sessionId);
        setStoreAnalysis(prev => ({
          ...prev,
          [sessionId]: analysis
        }));
      }
    }
    
    setExpandedSessions(newExpanded);
  };

  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true;
    return session.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">進行中</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">完了</span>;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
          <p className="text-gray-600 mt-2">セッション別に商品を管理</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/products/all"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
          >
            <Package size={20} />
            <span>全商品表示</span>
          </Link>
          <Link
            to="/purchases"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>新規セッション</span>
          </Link>
        </div>
      </div>

      {/* ステータスフィルター */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {[
            { value: 'all', label: 'すべて', count: sessions.length },
            { value: 'active', label: '進行中', count: sessions.filter(s => s.status === 'active').length },
            { value: 'completed', label: '完了', count: sessions.filter(s => s.status === 'completed').length }
          ].map(status => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value as any)}
              className={`px-4 py-3 whitespace-nowrap font-medium text-sm transition-colors ${
                statusFilter === status.value
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.label}
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                {status.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            該当するセッションがありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSessions.map((session) => {
              const basicStats = getSessionBasicStats(session.id);
              const totalCost = (session.transportation_cost || 0) + (session.transfer_fee || 0) + (session.agency_fee || 0);
              
              return (
                <div key={session.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="text-gray-500" size={20} />
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">商品数</div>
                          <div className="text-lg font-semibold">{basicStats.totalItems}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">仕入額</div>
                          <div className="text-lg font-semibold">¥{(basicStats.totalAmount || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">共通経費</div>
                          <div className="text-lg font-semibold">¥{(totalCost || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">総計</div>
                          <div className="text-lg font-semibold text-blue-600">
                            ¥{((basicStats.totalAmount || 0) + (totalCost || 0)).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">店舗数</div>
                          <div className="text-lg font-semibold text-gray-600">{basicStats.purchaseCount}</div>
                        </div>
                      </div>

                      {/* セッション日付表示 */}
                      {session.session_date && (
                        <div className="text-sm text-gray-500 mb-2">
                          セッション日: {format(new Date(session.session_date), 'yyyy年MM月dd日')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleSessionExpansion(session.id)}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Store size={18} />
                        <span>店舗別分析</span>
                        {expandedSessions.has(session.id) ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                      <Link
                        to={`/products/session/${session.id}`}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Package size={18} />
                        <span>商品管理</span>
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>

                  {/* 店舗別分析の展開部分 */}
                  {expandedSessions.has(session.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <TrendingUp size={20} className="text-green-600" />
                        <span>店舗別パフォーマンス分析</span>
                      </h4>
                      
                      {storeAnalysis[session.id] ? (
                        storeAnalysis[session.id].length > 0 ? (
                          <div className="grid gap-4">
                            {storeAnalysis[session.id].map((store) => (
                              <div key={store.storeId} className="bg-gray-50 rounded-lg p-4">
                                <div className="mb-3">
                                  <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                                    <Store size={16} className="text-gray-600" />
                                    <span>{store.storeName}</span>
                                  </h5>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                  <div>
                                    <div className="text-gray-500">仕入点数</div>
                                    <div className="font-semibold">{store.itemCount}点</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">破棄点数</div>
                                    <div className="font-semibold text-red-600">{store.discardedItems}点</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">出品点数</div>
                                    <div className="font-semibold text-blue-600">{store.listedItems}点</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">売却済</div>
                                    <div className="font-semibold text-green-600">{store.soldItems}点</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">仕入金額（経費込）</div>
                                    <div className="font-semibold">¥{store.purchaseAmount.toLocaleString()}</div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mt-3">
                                  <div>
                                    <div className="text-gray-500">売却高</div>
                                    <div className="font-semibold text-green-600">¥{store.soldAmount.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">売却経費</div>
                                    <div className="font-semibold text-orange-600">¥{store.salesExpenses.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">利益</div>
                                    <div className={`font-semibold ${store.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ¥{store.profit.toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">利益率</div>
                                    <div className={`font-semibold ${store.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {store.profitRate.toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">ROI</div>
                                    <div className={`font-semibold ${store.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {store.roi.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            このセッションには店舗データがありません
                          </div>
                        )
                      ) : (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                          <div className="text-gray-500 mt-2">分析データを読み込み中...</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsHierarchy;