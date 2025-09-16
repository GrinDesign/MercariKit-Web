import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store as StoreIcon, Calendar, Package, DollarSign, Truck, Receipt, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Store, StorePurchase } from '../types/index';
import { format } from 'date-fns';

const StorePurchaseEdit: React.FC = () => {
  const { sessionId, purchaseId } = useParams();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    store_id: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    item_count: 0,
    product_amount: 0,
    shipping_cost: 0,
    commission_fee: 0,
    price_input_mode: 'individual' as 'batch' | 'individual',
    payment_notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [sessionId, purchaseId]);

  const fetchData = async () => {
    try {
      // セッション情報を取得
      const { data: sessionData, error: sessionError } = await supabase
        .from('purchase_sessions')
        .select('title')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSessionTitle(sessionData?.title || '');

      // 店舗一覧を取得
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (storesError) throw storesError;
      setStores(storesData || []);

      // 既存の仕入れデータを取得
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('store_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (purchaseError) throw purchaseError;

      if (purchaseData) {
        setFormData({
          store_id: purchaseData.store_id || '',
          purchase_date: purchaseData.purchase_date || format(new Date(), 'yyyy-MM-dd'),
          item_count: purchaseData.item_count || 0,
          product_amount: purchaseData.product_amount || 0,
          shipping_cost: purchaseData.shipping_cost || 0,
          commission_fee: purchaseData.commission_fee || 0,
          price_input_mode: purchaseData.price_input_mode || 'individual',
          payment_notes: purchaseData.payment_notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // store_purchasesテーブルを更新
      const { error } = await supabase
        .from('store_purchases')
        .update({
          store_id: formData.store_id,
          purchase_date: formData.purchase_date,
          item_count: formData.item_count,
          product_amount: formData.product_amount,
          shipping_cost: formData.shipping_cost,
          commission_fee: formData.commission_fee,
          price_input_mode: formData.price_input_mode,
          payment_notes: formData.payment_notes
        })
        .eq('id', purchaseId);

      if (error) throw error;

      // 成功したら仕入管理ページに戻る
      navigate('/purchases');
    } catch (error: any) {
      console.error('Error updating purchase:', error);
      alert(`更新エラー: ${error.message || '不明なエラーが発生しました'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この仕入れデータを削除してもよろしいですか？\n関連する商品データがある場合は削除できません。')) {
      return;
    }

    setIsDeleting(true);
    try {
      // まず関連する商品があるか確認
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('store_purchase_id', purchaseId)
        .limit(1);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        alert('この仕入れデータには登録済みの商品があるため削除できません。\n先に商品を削除してください。');
        return;
      }

      // 仕入れデータを削除
      const { error } = await supabase
        .from('store_purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      // 成功したら仕入管理ページに戻る
      navigate('/purchases');
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      alert(`削除エラー: ${error.message || '不明なエラーが発生しました'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalAmount = formData.product_amount + formData.shipping_cost + formData.commission_fee;

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/purchases')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>仕入管理に戻る</span>
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">店舗別仕入れ編集</h1>
            <p className="text-gray-600 mt-2">セッション: {sessionTitle}</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={20} />
            <span>{isDeleting ? '削除中...' : '削除'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          {/* 店舗選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <StoreIcon size={16} className="inline mr-1" />
              仕入れ店舗 *
            </label>
            <select
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">店舗を選択してください</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                  {store.type && ` (${store.type === 'online' ? 'オンライン' :
                    store.type === 'recycle' ? 'リサイクル' :
                    store.type === 'wholesale' ? '卸問屋' : 'その他'})`}
                </option>
              ))}
            </select>
          </div>

          {/* 仕入日 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              仕入日 *
            </label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 商品数 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package size={16} className="inline mr-1" />
              商品数 *
            </label>
            <input
              type="number"
              min="0"
              value={formData.item_count || ''}
              onChange={(e) => setFormData({ ...formData, item_count: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              placeholder="0"
              required
            />
          </div>

          {/* 金額入力エリア */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 商品代金 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                商品代金（税込）
              </label>
              <input
                type="number"
                min="0"
                value={formData.product_amount || ''}
                onChange={(e) => setFormData({ ...formData, product_amount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>

            {/* 送料 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck size={16} className="inline mr-1" />
                送料
              </label>
              <input
                type="number"
                min="0"
                value={formData.shipping_cost || ''}
                onChange={(e) => setFormData({ ...formData, shipping_cost: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>

            {/* 仕入手数料 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Receipt size={16} className="inline mr-1" />
                仕入手数料
              </label>
              <input
                type="number"
                min="0"
                value={formData.commission_fee || ''}
                onChange={(e) => setFormData({ ...formData, commission_fee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>
          </div>

          {/* 価格入力モード */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              価格入力方式 *
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, price_input_mode: 'individual' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.price_input_mode === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                個別入力
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, price_input_mode: 'batch' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.price_input_mode === 'batch'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                一括入力
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {formData.price_input_mode === 'individual'
                ? '商品を1点ずつ個別に価格を入力します'
                : 'すべての商品に同じ価格を一括で設定します'}
            </p>
          </div>

          {/* 支払いメモ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              value={formData.payment_notes}
              onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="例：現金払い、振込予定、送料込み など"
            />
          </div>

          {/* 合計金額表示 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">合計仕入額</span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorePurchaseEdit;