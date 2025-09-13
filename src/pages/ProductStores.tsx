import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Package, Eye, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PurchaseSession, StorePurchase, Store as StoreType } from '../types/index';

interface StoreProductStats {
  storeId: string;
  storeName: string;
  totalProducts: number;
  inStock: number;
  readyToList: number;
  listed: number;
  sold: number;
  onHold: number;
  discarded: number;
  purchaseAmount: number;
  shippingCost: number;
  commissionFee: number;
  totalCost: number;
}

const ProductStores: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<PurchaseSession | null>(null);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [storeStats, setStoreStats] = useState<StoreProductStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    if (!sessionId) return;

    try {
      // セッション情報を取得
      const { data: sessionData, error: sessionError } = await supabase
        .from('purchase_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // セッション内の店舗購入情報を取得
      const { data: storePurchaseData, error: storePurchaseError } = await supabase
        .from('store_purchases')
        .select('*')
        .eq('session_id', sessionId);

      if (storePurchaseError) throw storePurchaseError;

      // 店舗マスタ情報を取得
      const storeIds = storePurchaseData?.map(sp => sp.store_id).filter(Boolean) || [];
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .in('id', storeIds);

      if (storeError) throw storeError;

      setSession(sessionData);
      setStorePurchases(storePurchaseData || []);
      setStores(storeData || []);

      // 各店舗の商品統計を取得（店舗データを渡す）
      await fetchStoreProductStats(storePurchaseData || [], storeData || []);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProductStats = async (storePurchaseList: StorePurchase[], storeList: StoreType[]) => {
    const stats: StoreProductStats[] = [];

    for (const storePurchase of storePurchaseList) {
      try {
        // 店舗の商品一覧とステータス別集計
        const { data: products, error } = await supabase
          .from('products')
          .select('id, status')
          .eq('store_purchase_id', storePurchase.id);

        if (error) throw error;

        // storeListから店舗名を取得
        const store = storeList.find(s => s.id === storePurchase.store_id);
        const storeName = store?.name || `店舗ID: ${storePurchase.store_id}`;

        console.log('Store mapping:', { 
          storePurchaseId: storePurchase.store_id, 
          storeName, 
          availableStores: storeList.map(s => ({ id: s.id, name: s.name })) 
        });

        const productStats: StoreProductStats = {
          storeId: storePurchase.store_id,
          storeName,
          totalProducts: products?.length || 0,
          inStock: 0,
          readyToList: 0,
          listed: 0,
          sold: 0,
          onHold: 0,
          discarded: 0,
          purchaseAmount: (storePurchase as any).product_amount || storePurchase.total_amount || 0,
          shippingCost: (storePurchase as any).shipping_cost || 0,
          commissionFee: (storePurchase as any).commission_fee || 0,
          totalCost: 0
        };

        // ステータス別集計
        products?.forEach(product => {
          switch (product.status) {
            case 'in_stock':
              productStats.inStock++;
              break;
            case 'ready_to_list':
              productStats.readyToList++;
              break;
            case 'listed':
              productStats.listed++;
              break;
            case 'sold':
              productStats.sold++;
              break;
            case 'on_hold':
              productStats.onHold++;
              break;
            case 'discarded':
              productStats.discarded++;
              break;
          }
        });

        productStats.totalCost = productStats.purchaseAmount + productStats.shippingCost + productStats.commissionFee;
        stats.push(productStats);
      } catch (error) {
        console.error(`Error fetching stats for store ${storePurchase.store_id}:`, error);
      }
    }

    setStoreStats(stats);
  };

  const getStatusColor = (count: number, total: number) => {
    if (total === 0) return 'text-gray-400';
    const ratio = count / total;
    if (ratio > 0.7) return 'text-green-600 font-semibold';
    if (ratio > 0.3) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  const totalStats = storeStats.reduce(
    (acc, stat) => ({
      totalProducts: acc.totalProducts + stat.totalProducts,
      totalCost: acc.totalCost + stat.totalCost,
      inStock: acc.inStock + stat.inStock,
      readyToList: acc.readyToList + stat.readyToList,
      listed: acc.listed + stat.listed,
      sold: acc.sold + stat.sold,
      onHold: acc.onHold + stat.onHold,
      discarded: acc.discarded + stat.discarded
    }),
    {
      totalProducts: 0,
      totalCost: 0,
      inStock: 0,
      readyToList: 0,
      listed: 0,
      sold: 0,
      onHold: 0,
      discarded: 0
    }
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          セッションが見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* パンくずナビ */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Link to="/products" className="hover:text-gray-700">商品管理</Link>
        <ChevronRight size={16} />
        <span className="text-gray-900 font-medium">{session.title}</span>
      </div>

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600 mt-1">店舗別商品管理</p>
          </div>
        </div>
      </div>

      {/* 全体統計 */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">セッション全体サマリー</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div>
            <div className="text-xs text-gray-600">総商品数</div>
            <div className="text-xl font-bold text-gray-900">{totalStats.totalProducts}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">在庫</div>
            <div className={`text-lg font-semibold ${getStatusColor(totalStats.inStock, totalStats.totalProducts)}`}>
              {totalStats.inStock}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">出品準備</div>
            <div className={`text-lg font-semibold ${getStatusColor(totalStats.readyToList, totalStats.totalProducts)}`}>
              {totalStats.readyToList}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">出品中</div>
            <div className={`text-lg font-semibold ${getStatusColor(totalStats.listed, totalStats.totalProducts)}`}>
              {totalStats.listed}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">売却済み</div>
            <div className={`text-lg font-semibold ${getStatusColor(totalStats.sold, totalStats.totalProducts)}`}>
              {totalStats.sold}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">保留</div>
            <div className={`text-lg font-semibold ${getStatusColor(totalStats.onHold, totalStats.totalProducts)}`}>
              {totalStats.onHold}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">廃棄</div>
            <div className={`text-lg font-semibold ${getStatusColor(totalStats.discarded, totalStats.totalProducts)}`}>
              {totalStats.discarded}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">総コスト</div>
            <div className="text-lg font-bold text-blue-600">¥{totalStats.totalCost.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 店舗一覧 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">店舗別詳細</h2>
        </div>
        
        {storeStats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            店舗データがありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {storeStats.map((stat) => (
              <div key={stat.storeId} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Store className="text-gray-500" size={20} />
                      <h3 className="text-lg font-semibold text-gray-900">{stat.storeName}</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3 mb-4">
                      <div>
                        <div className="text-xs text-gray-500">商品数</div>
                        <div className="text-lg font-semibold">{stat.totalProducts}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">在庫</div>
                        <div className={`text-sm font-medium ${getStatusColor(stat.inStock, stat.totalProducts)}`}>
                          {stat.inStock}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">出品準備</div>
                        <div className={`text-sm font-medium ${getStatusColor(stat.readyToList, stat.totalProducts)}`}>
                          {stat.readyToList}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">出品中</div>
                        <div className={`text-sm font-medium ${getStatusColor(stat.listed, stat.totalProducts)}`}>
                          {stat.listed}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">売却済み</div>
                        <div className={`text-sm font-medium ${getStatusColor(stat.sold, stat.totalProducts)}`}>
                          {stat.sold}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">保留</div>
                        <div className={`text-sm font-medium ${getStatusColor(stat.onHold, stat.totalProducts)}`}>
                          {stat.onHold}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">廃棄</div>
                        <div className={`text-sm font-medium ${getStatusColor(stat.discarded, stat.totalProducts)}`}>
                          {stat.discarded}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">仕入額</div>
                        <div className="text-sm font-medium">¥{stat.purchaseAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">総コスト</div>
                        <div className="text-sm font-semibold text-blue-600">¥{stat.totalCost.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Link
                      to={`/products/session/${sessionId}/store/${stat.storeId}`}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Package size={18} />
                      <span>商品一覧</span>
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStores;