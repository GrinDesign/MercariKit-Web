import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Package, ChevronRight, ChevronDown, ChevronUp, Store, ShoppingBag } from 'lucide-react';
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

interface StoreProductSummary {
  storeId: string;
  storeName: string;
  totalItems: number;
  inStock: number;
  readyToList: number;
  listed: number;
  sold: number;
  onHold: number;
  discarded: number;
}

const ProductsHierarchy: React.FC = () => {
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionStats, setSessionStats] = useState<Record<string, SessionStats>>({});
  const [storeProductSummaries, setStoreProductSummaries] = useState<Record<string, StoreProductSummary[]>>({});

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

  const getSessionBasicInfo = (sessionId: string) => {
    const purchases = storePurchases.filter(p => p.session_id === sessionId);
    const totalItems = purchases.reduce((sum, p) => sum + (p.item_count || 0), 0);
    return { 
      storeCount: purchases.length, 
      totalItems,
      purchases 
    };
  };

  const getSessionStoreProductSummaries = async (sessionId: string): Promise<StoreProductSummary[]> => {
    try {
      const purchases = storePurchases.filter(p => p.session_id === sessionId);
      const storeSummaryMap: Record<string, StoreProductSummary> = {};

      for (const purchase of purchases) {
        const { data: products, error } = await supabase
          .from('products')
          .select('id, status')
          .eq('store_purchase_id', purchase.id);

        if (error) {
          console.error('Error fetching products for store summary:', error);
          continue;
        }

        const storeId = purchase.store_id || 'unknown';
        const storeName = (purchase as any).stores?.name || 'Unknown Store';
        
        if (!storeSummaryMap[storeId]) {
          storeSummaryMap[storeId] = {
            storeId,
            storeName,
            totalItems: 0,
            inStock: 0,
            readyToList: 0,
            listed: 0,
            sold: 0,
            onHold: 0,
            discarded: 0,
          };
        }

        const store = storeSummaryMap[storeId];
        store.totalItems += purchase.item_count || 0;

        if (products) {
          products.forEach(product => {
            switch (product.status) {
              case 'in_stock':
                store.inStock++;
                break;
              case 'ready_to_list':
                store.readyToList++;
                break;
              case 'listed':
                store.listed++;
                break;
              case 'sold':
                store.sold++;
                break;
              case 'on_hold':
                store.onHold++;
                break;
              case 'discarded':
                store.discarded++;
                break;
            }
          });
        }
      }

      return Object.values(storeSummaryMap);
    } catch (error) {
      console.error('Error getting session store summaries:', error);
      return [];
    }
  };

  const toggleSessionExpansion = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // 展開時に店舗別商品サマリーを取得
      if (!storeProductSummaries[sessionId]) {
        const summaries = await getSessionStoreProductSummaries(sessionId);
        setStoreProductSummaries(prev => ({
          ...prev,
          [sessionId]: summaries
        }));
      }
      // セッション統計も取得
      if (!sessionStats[sessionId]) {
        const stats = await getSessionProductStats(sessionId);
        setSessionStats(prev => ({
          ...prev,
          [sessionId]: stats
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
        <div>
          <Link
            to="/products/all"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Package size={20} />
            <span>全商品表示</span>
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
              const basicInfo = getSessionBasicInfo(session.id);
              const stats = sessionStats[session.id];
              
              return (
                <div key={session.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Calendar className="text-gray-500" size={20} />
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      {/* セッション基本情報 */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">合計商品数</div>
                          <div className="text-lg font-semibold text-blue-600">{basicInfo.totalItems}点</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">店舗数</div>
                          <div className="text-lg font-semibold text-gray-600">{basicInfo.storeCount}店舗</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">セッション日</div>
                          <div className="text-sm font-medium text-gray-700">
                            {session.session_date ? format(new Date(session.session_date), 'yyyy/MM/dd') : '-'}
                          </div>
                        </div>
                      </div>

                      {/* 商品ステータス別サマリー（セッション統計がある場合のみ表示） */}
                      {stats && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">商品進捗状況</div>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                            <div className="text-center">
                              <div className="text-gray-500">在庫</div>
                              <div className="font-semibold text-gray-700">{stats.inStock}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">出品準備</div>
                              <div className="font-semibold text-orange-600">{stats.readyToList}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">出品中</div>
                              <div className="font-semibold text-blue-600">{stats.listed}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">売却済</div>
                              <div className="font-semibold text-green-600">{stats.sold}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">保留</div>
                              <div className="font-semibold text-yellow-600">{stats.onHold}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">破棄</div>
                              <div className="font-semibold text-red-600">{stats.discarded}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center ml-4">
                      <button
                        onClick={() => toggleSessionExpansion(session.id)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Store size={18} />
                        <span>店舗別内訳</span>
                        {expandedSessions.has(session.id) ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 店舗別商品内訳の展開部分 */}
                  {expandedSessions.has(session.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Store size={20} className="text-blue-600" />
                        <span>店舗別商品内訳</span>
                      </h4>
                      
                      {storeProductSummaries[session.id] ? (
                        storeProductSummaries[session.id].length > 0 ? (
                          <div className="grid gap-4">
                            {storeProductSummaries[session.id].map((store) => (
                              <div key={store.storeId} className="bg-gray-50 rounded-lg p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                                    <Store size={16} className="text-gray-600" />
                                    <span>{store.storeName}</span>
                                  </h5>
                                  <Link
                                    to={`/products/session/${session.id}/store/${store.storeId}`}
                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                  >
                                    <span>商品一覧</span>
                                    <ChevronRight size={14} />
                                  </Link>
                                </div>
                                
                                <div className="mb-3">
                                  <div className="text-sm text-gray-600 mb-2">
                                    合計 <span className="font-semibold text-blue-600">{store.totalItems}点</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                                  <div className="text-center">
                                    <div className="text-gray-500">在庫</div>
                                    <div className="font-semibold text-gray-700">{store.inStock}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-500">出品準備</div>
                                    <div className="font-semibold text-orange-600">{store.readyToList}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-500">出品中</div>
                                    <div className="font-semibold text-blue-600">{store.listed}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-500">売却済</div>
                                    <div className="font-semibold text-green-600">{store.sold}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-500">保留</div>
                                    <div className="font-semibold text-yellow-600">{store.onHold}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-500">破棄</div>
                                    <div className="font-semibold text-red-600">{store.discarded}</div>
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
                          <div className="text-gray-500 mt-2">商品データを読み込み中...</div>
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