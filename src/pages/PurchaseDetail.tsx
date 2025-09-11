import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Store, Calendar, Package, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PurchaseSession, StorePurchase, Store as StoreType } from '../types/index';
import { format, isValid, parseISO } from 'date-fns';

const PurchaseDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<PurchaseSession | null>(null);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStorePurchaseForm, setShowStorePurchaseForm] = useState(false);
  const [editingStorePurchase, setEditingStorePurchase] = useState<StorePurchase | null>(null);
  const [storePurchaseFormData, setStorePurchaseFormData] = useState({
    store_id: '',
    purchase_date: '',
    product_cost: 0,  // product_cost -> product_amount
    shipping_cost: 0,
    commission_fee: 0,
    item_count: 0,
    payment_notes: '',
    price_input_mode: 'individual' as 'batch' | 'individual'
  });

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
      fetchStorePurchases();
      fetchStores();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchStorePurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('store_purchases')
        .select(`
          *,
          stores (
            id,
            name,
            type
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStorePurchases(data || []);
    } catch (error) {
      console.error('Error fetching store purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleStorePurchaseSubmit = async () => {
    if (!storePurchaseFormData.store_id || !sessionId) return;

    try {
      if (editingStorePurchase) {
        // 編集の場合
        const { error } = await supabase
          .from('store_purchases')
          .update({
            store_id: storePurchaseFormData.store_id,
            purchase_date: storePurchaseFormData.purchase_date,
            product_amount: storePurchaseFormData.product_cost,
            shipping_cost: storePurchaseFormData.shipping_cost,
            commission_fee: storePurchaseFormData.commission_fee,
            item_count: storePurchaseFormData.item_count,
            payment_notes: storePurchaseFormData.payment_notes,
            price_input_mode: storePurchaseFormData.price_input_mode
          })
          .eq('id', editingStorePurchase.id);

        if (error) throw error;
      } else {
        // 新規作成の場合
        const { error } = await supabase
          .from('store_purchases')
          .insert([{
            session_id: sessionId,
            store_id: storePurchaseFormData.store_id,
            purchase_date: storePurchaseFormData.purchase_date || session?.session_date || format(new Date(), 'yyyy-MM-dd'),
            product_amount: storePurchaseFormData.product_cost,
            shipping_cost: storePurchaseFormData.shipping_cost,
            commission_fee: storePurchaseFormData.commission_fee,
            item_count: storePurchaseFormData.item_count,
            payment_notes: storePurchaseFormData.payment_notes,
            price_input_mode: storePurchaseFormData.price_input_mode
          }]);

        if (error) throw error;
      }

      setShowStorePurchaseForm(false);
      setEditingStorePurchase(null);
      setStorePurchaseFormData({
        store_id: '',
        purchase_date: '',
        product_cost: 0,
        shipping_cost: 0,
        commission_fee: 0,
        item_count: 0,
        payment_notes: '',
        price_input_mode: 'individual'
      });
      fetchStorePurchases();
    } catch (error) {
      console.error('Error saving store purchase:', error);
      alert('店舗別仕入れの保存に失敗しました');
    }
  };

  const handleEditStorePurchase = (storePurchase: StorePurchase) => {
    setEditingStorePurchase(storePurchase);
    setStorePurchaseFormData({
      store_id: storePurchase.store_id,
      purchase_date: storePurchase.purchase_date,
      product_cost: (storePurchase as any).product_amount || 0,
      shipping_cost: (storePurchase as any).shipping_cost || 0,
      commission_fee: (storePurchase as any).commission_fee || 0,
      item_count: storePurchase.item_count,
      payment_notes: storePurchase.payment_notes || '',
      price_input_mode: (storePurchase as any).price_input_mode || 'individual'
    });
    setShowStorePurchaseForm(true);
  };

  const handleDeleteStorePurchase = async (id: string) => {
    if (!confirm('この店舗の仕入れ情報を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('store_purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStorePurchases();
    } catch (error) {
      console.error('Error deleting store purchase:', error);
      alert('削除に失敗しました');
    }
  };

  const getTotalAmount = () => {
    return storePurchases.reduce((sum, sp) => {
      const productAmount = (sp as any).product_amount || 0;
      const shippingCost = (sp as any).shipping_cost || 0;
      const commissionFee = (sp as any).commission_fee || 0;
      return sum + productAmount + shippingCost + commissionFee;
    }, 0);
  };

  const getTotalItems = () => {
    return storePurchases.reduce((sum, sp) => sum + (sp.item_count || 0), 0);
  };

  const getCommonCosts = () => {
    if (!session) return 0;
    return (session.transportation_cost || 0) + 
           (session.transfer_fee || 0) + 
           (session.agency_fee || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">セッションが見つかりません</p>
          <Link to="/purchases" className="mt-4 text-primary-600 hover:text-primary-700">
            仕入れ管理に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/purchases" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            仕入れ管理に戻る
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{session.title}</h1>
            <div className="flex items-center text-gray-600 space-x-4">
              <div className="flex items-center">
                <Package size={18} className="mr-2" />
                {getTotalItems()}点
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {session.status === 'active' ? '作業中' : '完了'}
              </span>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">仕入れ金額</div>
                <div className="text-lg font-semibold">¥{getTotalAmount().toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">交通費</div>
                <div className="text-lg font-semibold">¥{(session.transportation_cost || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">振込手数料</div>
                <div className="text-lg font-semibold">¥{(session.transfer_fee || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">代行料</div>
                <div className="text-lg font-semibold">¥{(session.agency_fee || 0).toLocaleString()}</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">合計金額</span>
                <span className="text-2xl font-bold text-blue-600">
                  ¥{(getTotalAmount() + getCommonCosts()).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">店舗別仕入れ</h2>
            <button
              onClick={() => setShowStorePurchaseForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              <Plus size={18} className="mr-2" />
              店舗を追加
            </button>
          </div>
          
          {storePurchases.length === 0 ? (
            <div className="p-12 text-center">
              <Store size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">まだ店舗別仕入れが登録されていません</p>
              <button
                onClick={() => setShowStorePurchaseForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                最初の店舗を追加
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {storePurchases.map((sp) => (
                <Link key={sp.id} to={`/purchases/${sessionId}/stores/${sp.id}`} className="block">
                  <div className="p-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {sp.stores?.name || '店舗名不明'}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-xs text-gray-500">仕入れ金額</span>
                            <p className="text-sm font-medium">¥{(((sp as any).product_amount || 0) + ((sp as any).shipping_cost || 0) + ((sp as any).commission_fee || 0)).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">商品数</span>
                            <p className="text-sm font-medium">{sp.item_count || 0}点</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">単価</span>
                            <p className="text-sm font-medium">
                              {sp.item_count ? `¥${Math.round(((sp as any).product_amount + (sp as any).shipping_cost + (sp as any).commission_fee || 0) / sp.item_count).toLocaleString()}` : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">按分後単価</span>
                            <p className="text-sm font-medium text-blue-600">
                              {sp.item_count && getTotalAmount() > 0 
                                ? `¥${Math.round((((sp as any).product_amount + (sp as any).shipping_cost + (sp as any).commission_fee || 0) + (getCommonCosts() * ((sp as any).product_amount + (sp as any).shipping_cost + (sp as any).commission_fee || 0) / getTotalAmount())) / sp.item_count).toLocaleString()}`
                                : '-'}
                            </p>
                          </div>
                        </div>
                        {sp.payment_notes && (
                          <p className="mt-2 text-sm text-gray-600">{sp.payment_notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditStorePurchase(sp);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteStorePurchase(sp.id);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {showStorePurchaseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingStorePurchase ? '店舗仕入れ編集' : '店舗別仕入れを追加'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    店舗 *
                  </label>
                  <select
                    value={storePurchaseFormData.store_id}
                    onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, store_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">選択してください</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    仕入日
                  </label>
                  <input
                    type="date"
                    value={storePurchaseFormData.purchase_date}
                    onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品代金（税込）
                    </label>
                    <input
                      type="number"
                      value={storePurchaseFormData.product_cost || ''}
                      onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, product_cost: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      送料
                    </label>
                    <input
                      type="number"
                      value={storePurchaseFormData.shipping_cost || ''}
                      onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, shipping_cost: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      手数料
                    </label>
                    <input
                      type="number"
                      value={storePurchaseFormData.commission_fee || ''}
                      onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, commission_fee: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    合計金額
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    ¥{(storePurchaseFormData.product_cost + storePurchaseFormData.shipping_cost + storePurchaseFormData.commission_fee).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品数
                  </label>
                  <input
                    type="number"
                    value={storePurchaseFormData.item_count || ''}
                    onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, item_count: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支払いメモ（任意）
                  </label>
                  <textarea
                    value={storePurchaseFormData.payment_notes}
                    onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, payment_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="支払い方法など"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品価格入力方法
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price_input_mode"
                        value="individual"
                        checked={storePurchaseFormData.price_input_mode === 'individual'}
                        onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, price_input_mode: e.target.value as 'batch' | 'individual' })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">個別入力</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price_input_mode"
                        value="batch"
                        checked={storePurchaseFormData.price_input_mode === 'batch'}
                        onChange={(e) => setStorePurchaseFormData({ ...storePurchaseFormData, price_input_mode: e.target.value as 'batch' | 'individual' })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">一括入力</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {storePurchaseFormData.price_input_mode === 'batch' 
                      ? '商品登録時に総額を商品数で均等配分します' 
                      : '商品ごとに個別に仕入価格を入力します'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowStorePurchaseForm(false);
                    setEditingStorePurchase(null);
                    setStorePurchaseFormData({
                      store_id: '',
                      purchase_date: '',
                      product_cost: 0,
                      shipping_cost: 0,
                      commission_fee: 0,
                      item_count: 0,
                      payment_notes: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleStorePurchaseSubmit}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingStorePurchase ? '更新' : '追加'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseDetail;