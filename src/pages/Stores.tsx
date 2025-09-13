import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store as StoreIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Store } from '../types/index';

const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'online' as Store['type'],
    prefecture: '',
    notes: ''
  });
  
  const [selectedRegion, setSelectedRegion] = useState('');

  // 地方別都道府県データ
  const regionPrefectures = {
    '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
    '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
    '関西': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
    '中国・四国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'],
    '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
  };

  useEffect(() => {
    fetchStores();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(formData)
          .eq('id', editingStore.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      setShowForm(false);
      setEditingStore(null);
      setFormData({ name: '', type: 'online', prefecture: '', notes: '' });
      setSelectedRegion('');
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  // 都道府県から地方を逆引きする関数
  const getRegionByPrefecture = (prefecture: string) => {
    for (const [region, prefectures] of Object.entries(regionPrefectures)) {
      if (prefectures.includes(prefecture)) {
        return region;
      }
    }
    return '';
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      type: store.type,
      prefecture: store.prefecture || '',
      notes: store.notes || ''
    });
    // 既存の都道府県から地方を設定
    setSelectedRegion(store.prefecture ? getRegionByPrefecture(store.prefecture) : '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この店舗を削除しますか？')) return;
    
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      online: 'オンライン',
      recycle: 'リサイクル',
      wholesale: '卸問屋',
      other: 'その他'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">店舗マスタ</h1>
          <p className="text-gray-600 mt-2">全 {stores.length} 店舗</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingStore(null);
            setFormData({ name: '', type: 'online', prefecture: '', notes: '' });
            setSelectedRegion('');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>新規登録</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingStore ? '店舗編集' : '店舗登録'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイプ *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Store['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="online">オンライン</option>
                  <option value="recycle">リサイクル</option>
                  <option value="wholesale">卸問屋</option>
                  <option value="other">その他</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">地方</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setFormData({ ...formData, prefecture: '' }); // 都道府県をリセット
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">地方を選択</option>
                      {Object.keys(regionPrefectures).map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">都道府県</label>
                    <select
                      value={formData.prefecture}
                      onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={!selectedRegion}
                    >
                      <option value="">都道府県を選択</option>
                      {selectedRegion && regionPrefectures[selectedRegion as keyof typeof regionPrefectures]?.map((prefecture) => (
                        <option key={prefecture} value={prefecture}>{prefecture}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStore ? '更新' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : stores.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            店舗が登録されていません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {stores.map((store) => (
              <div key={store.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <StoreIcon size={20} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{store.name}</h3>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(store)}
                      className="p-1 text-gray-600 hover:text-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="p-1 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {getTypeLabel(store.type)}
                    </span>
                    {store.prefecture && (
                      <span className="text-xs text-gray-600">{store.prefecture}</span>
                    )}
                  </div>
                  {store.notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">{store.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;