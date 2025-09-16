import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Package, Edit, Trash2, Store, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PurchaseSession, StorePurchase, Product } from '../types/index';
import { format } from 'date-fns';
import SessionCard from '../components/common/SessionCard';
import MetricGrid from '../components/common/MetricGrid';
import StatusFilter from '../components/common/StatusFilter';
import ProgressBar from '../components/common/ProgressBar';

interface SessionStats {
  purchaseCount: number;
  totalItems: number;
  totalAmount: number;
  registeredItems: number;
  unregisteredItems: number;
  itemsWithPhotos: number;
  itemsWithoutPhotos: number;
}

interface StoreDetail {
  purchaseId: string;
  storeId: string;
  storeName: string;
  itemCount: number;
  registeredCount: number;
  totalAmount: number;
  hasUnregistered: boolean;
}

const PurchasesNew: React.FC = () => {
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<PurchaseSession | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionStoreDetails, setSessionStoreDetails] = useState<{ [key: string]: StoreDetail[] }>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');

  const [sessionFormData, setSessionFormData] = useState({
    title: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    transportation_cost: 0,
    transfer_fee: 0,
    agency_fee: 0,
    status: 'active' as PurchaseSession['status']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, purchasesRes, productsRes] = await Promise.all([
        supabase.from('purchase_sessions').select('*').order('session_date', { ascending: false }),
        supabase.from('store_purchases').select('*'),
        supabase.from('products').select('*')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (productsRes.error) throw productsRes.error;

      const validSessions = (sessionsRes.data || []).filter(session => session && session.id);

      console.log('Fetched sessions:', validSessions);
      console.log('Fetched store purchases:', purchasesRes.data);
      console.log('Fetched products:', productsRes.data);

      setSessions(validSessions);
      setStorePurchases(purchasesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionStats = (sessionId: string): SessionStats => {
    const sessionPurchases = storePurchases.filter(p => p.session_id === sessionId);
    const sessionProducts = products.filter(p =>
      sessionPurchases.some(sp => sp.id === p.store_purchase_id)
    );

    const registeredItems = sessionProducts.length;
    const totalItems = sessionPurchases.reduce((sum, p) => sum + (p.item_count || 0), 0);
    const itemsWithPhotos = sessionProducts.filter(p => p.photos && p.photos.length > 0).length;

    return {
      purchaseCount: sessionPurchases.length,
      totalItems: totalItems,
      totalAmount: sessionPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0),
      registeredItems: registeredItems,
      unregisteredItems: totalItems - registeredItems,
      itemsWithPhotos: itemsWithPhotos,
      itemsWithoutPhotos: registeredItems - itemsWithPhotos
    };
  };

  const getSessionStoreDetails = async (sessionId: string): Promise<StoreDetail[]> => {
    try {
      const sessionPurchases = storePurchases.filter(p => p.session_id === sessionId);

      const details: StoreDetail[] = [];

      for (const purchase of sessionPurchases) {
        const storeProducts = products.filter(p => p.store_purchase_id === purchase.id);

        // 店舗情報を取得
        const { data: storeData, error } = await supabase
          .from('stores')
          .select('name')
          .eq('id', purchase.store_id)
          .single();

        console.log(`Store data for ${purchase.store_id}:`, storeData, 'Error:', error);

        // 合計金額を計算
        const totalAmount = (purchase.product_amount || 0) + (purchase.shipping_cost || 0) + (purchase.commission_fee || 0);

        details.push({
          purchaseId: purchase.id,
          storeId: purchase.store_id,
          storeName: storeData?.name || '不明な店舗',
          itemCount: purchase.item_count || 0,
          registeredCount: storeProducts.length,
          totalAmount: totalAmount,
          hasUnregistered: (purchase.item_count || 0) > storeProducts.length
        });
      }

      console.log(`Session ${sessionId} store details:`, details);
      return details;
    } catch (error) {
      console.error('Error getting store details:', error);
      return [];
    }
  };

  const toggleSessionExpansion = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);

    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // 展開時に店舗詳細を取得
      if (!sessionStoreDetails[sessionId]) {
        const details = await getSessionStoreDetails(sessionId);
        setSessionStoreDetails(prev => ({
          ...prev,
          [sessionId]: details
        }));
      }
    }

    setExpandedSessions(newExpanded);
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSession) {
        const { error } = await supabase
          .from('purchase_sessions')
          .update(sessionFormData)
          .eq('id', editingSession.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('purchase_sessions')
          .insert([sessionFormData]);

        if (error) throw error;
      }

      setShowSessionForm(false);
      setEditingSession(null);
      setSessionFormData({
        title: '',
        session_date: format(new Date(), 'yyyy-MM-dd'),
        transportation_cost: 0,
        transfer_fee: 0,
        agency_fee: 0,
        status: 'active'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving session:', error);
      alert(`セッション保存エラー: ${error.message || '不明なエラーが発生しました'}`);
    }
  };

  const handleEditSession = (session: PurchaseSession) => {
    setEditingSession(session);
    setSessionFormData({
      title: session.title,
      session_date: session.session_date,
      transportation_cost: session.transportation_cost || 0,
      transfer_fee: session.transfer_fee || 0,
      agency_fee: session.agency_fee || 0,
      status: session.status
    });
    setShowSessionForm(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('このセッションを削除してもよろしいですか？')) return;

    try {
      const { error } = await supabase
        .from('purchase_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      alert(`削除エラー: ${error.message || '不明なエラーが発生しました'}`);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true;
    return session.status === statusFilter;
  });

  const getRegistrationProgress = (stats: SessionStats) => {
    if (stats.totalItems === 0) return 0;
    return Math.round((stats.registeredItems / stats.totalItems) * 100);
  };

  const getDataQualityScore = (stats: SessionStats) => {
    if (stats.registeredItems === 0) return 0;
    return Math.round((stats.itemsWithPhotos / stats.registeredItems) * 100);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仕入管理</h1>
          <p className="text-gray-600 mt-2">セッション単位で仕入れと商品登録を管理</p>
        </div>
        <button
          onClick={() => setShowSessionForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>新規セッション</span>
        </button>
      </div>

      {/* セッション作成/編集フォーム */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSession ? 'セッション編集' : '新規セッション作成'}
            </h2>
            <form onSubmit={handleSessionSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  セッション名
                </label>
                <input
                  type="text"
                  value={sessionFormData.title}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  セッション日
                </label>
                <input
                  type="date"
                  value={sessionFormData.session_date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, session_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交通費
                  </label>
                  <input
                    type="number"
                    value={sessionFormData.transportation_cost || ''}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, transportation_cost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    振込手数料
                  </label>
                  <input
                    type="number"
                    value={sessionFormData.transfer_fee || ''}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, transfer_fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    代行料
                  </label>
                  <input
                    type="number"
                    value={sessionFormData.agency_fee || ''}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, agency_fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={sessionFormData.status}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, status: e.target.value as 'active' | 'completed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">進行中</option>
                  <option value="completed">完了</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionForm(false);
                    setEditingSession(null);
                    setSessionFormData({
                      title: '',
                      session_date: format(new Date(), 'yyyy-MM-dd'),
                      transportation_cost: 0,
                      transfer_fee: 0,
                      agency_fee: 0,
                      status: 'active'
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSession ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ステータスフィルター */}
      <StatusFilter
        filters={[
          { value: 'all', label: 'すべて', count: sessions.length },
          { value: 'active', label: '進行中', count: sessions.filter(s => s.status === 'active').length },
          { value: 'completed', label: '完了', count: sessions.filter(s => s.status === 'completed').length }
        ]}
        activeFilter={statusFilter}
        onChange={(filter) => setStatusFilter(filter as any)}
        className="mb-6"
      />

      <div className="bg-white rounded-xl shadow-sm">
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
              const stats = getSessionStats(session.id);
              const totalCost = (session.transportation_cost || 0) + (session.transfer_fee || 0) + (session.agency_fee || 0);
              const registrationProgress = getRegistrationProgress(stats);
              const dataQuality = getDataQualityScore(stats);

              return (
                <SessionCard
                  key={session.id}
                  title={session.title}
                  status={session.status}
                  date={session.session_date ? format(new Date(session.session_date), 'yyyy/MM/dd') : undefined}
                  expandable={true}
                  isExpanded={expandedSessions.has(session.id)}
                  onExpand={() => toggleSessionExpansion(session.id)}
                  metricsArea={
                    <div className="space-y-4">
                      {/* セッション基本情報 */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-4">
                          <span>📅 {session.session_date ? format(new Date(session.session_date), 'MM/dd') : '-'}</span>
                          <span>🏪 {stats.purchaseCount}店舗</span>
                          <span>📦 {stats.totalItems}点</span>
                        </div>
                      </div>

                      {/* 登録進捗バー */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">登録進捗</span>
                          <span className="text-xs text-gray-500">
                            {registrationProgress}% ({stats.registeredItems}/{stats.totalItems}点)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              registrationProgress === 100 ? 'bg-green-500' :
                              registrationProgress >= 70 ? 'bg-blue-500' :
                              registrationProgress >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${registrationProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* アクション誘導情報 */}
                      {stats.unregisteredItems > 0 && (
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-orange-600 font-medium">
                            ⚠️ 未登録: {stats.unregisteredItems}点
                          </span>
                          <span className="text-gray-500">
                            📸 写真: {stats.itemsWithPhotos}点
                          </span>
                        </div>
                      )}
                      {stats.unregisteredItems === 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          ✅ すべて登録済み
                        </div>
                      )}

                    </div>
                  }
                  expandedContent={
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Store size={20} className="text-blue-600" />
                        <span>店舗別内訳</span>
                      </h4>

                      {/* 店舗登録ボタン */}
                      <div className="mb-4">
                        <Link
                          to={`/purchases/${session.id}/stores/new`}
                          className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus size={20} />
                          <span>店舗登録</span>
                        </Link>
                      </div>

                      {sessionStoreDetails[session.id] ? (
                        sessionStoreDetails[session.id].length > 0 ? (
                          <div className="grid gap-4">
                            {sessionStoreDetails[session.id].map((store) => {
                              const registrationRate = store.itemCount > 0 ? Math.round((store.registeredCount / store.itemCount) * 100) : 0;
                              return (
                                <div key={store.storeId} className="bg-gray-50 rounded-lg p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                                      <Store size={16} className="text-gray-600" />
                                      <span>{store.storeName}</span>
                                    </h5>
                                    <div className="flex items-center space-x-2">
                                      <Link
                                        to={`/purchases/${session.id}/stores/${store.purchaseId}/edit`}
                                        className="p-1.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white"
                                        title="編集"
                                      >
                                        <Edit size={16} />
                                      </Link>
                                      <Link
                                        to={`/purchases/${session.id}/stores/${store.storeId}`}
                                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                      >
                                        <span>店舗詳細</span>
                                        <ChevronRight size={14} />
                                      </Link>
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <div className="text-sm text-gray-600 mb-2">
                                      購入 <span className="font-semibold text-blue-600">{store.itemCount}点</span>
                                      {' / '}登録済み <span className="font-semibold text-green-600">{store.registeredCount}点</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="text-center">
                                      <div className="text-gray-500">仕入額</div>
                                      <div className="font-semibold text-gray-900">¥{store.totalAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-gray-500">登録率</div>
                                      <div className={`font-semibold ${registrationRate === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {registrationRate}%
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-gray-500">状態</div>
                                      <div className={`font-semibold ${!store.hasUnregistered ? 'text-green-600' : 'text-orange-600'}`}>
                                        {!store.hasUnregistered ? '完了' : '要登録'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            このセッションには店舗データがありません
                          </div>
                        )
                      ) : (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  }
                  actions={
                    <>
                      <button
                        onClick={() => handleEditSession(session)}
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesNew;