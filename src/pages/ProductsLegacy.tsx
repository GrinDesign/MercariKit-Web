import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, X, Gem, Zap, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, PurchaseSession, Store } from '../types/index';

const Products: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [sessionSortOrder, setSessionSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mercari_title: '',
    brand: '',
    category: '',
    size: '',
    color: '',
    condition: '',
    gender: '',
    purchase_cost: '',
    initial_price: '',
    current_price: '',
    sold_price: '',
    reference_price: '',
    measurements: '',
    description: '',
    template_description: '',
    notes: '',
    status: '',
    shipping_method: '',
    shipping_cost: '',
    custom_shipping_type: '',
    production_country: '',
    decade: '90s',
    asset_type: 'quick_turn'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [productsRes, sessionsRes, storesRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            store_purchases(
              id,
              session_id,
              store_id,
              purchase_sessions(id, title),
              stores(id, name)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('purchase_sessions').select('*').order('session_date', { ascending: false }),
        supabase.from('stores').select('*').order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (storesRes.error) throw storesRes.error;

      setProducts(productsRes.data || []);
      setSessions(sessionsRes.data || []);
      setStores(storesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  // カテゴリー、状態、性別のマッピング
  const categoryMapping = {
    'tops': 'トップス',
    'outerwear': 'アウター', 
    'bottoms': 'パンツ',
    'dresses': 'ワンピース',
    'shoes': 'シューズ',
    'bags': 'バッグ',
    'accessories': 'アクセサリー',
    'other': 'その他'
  };

  const conditionMapping = {
    'new': '新品',
    'used_like_new': '未使用に近い',
    'used_good': '目立った傷や汚れなし',
    'used_fair': 'やや傷や汚れあり',
    'used_poor': '傷や汚れあり',
    'used_damaged': '全体的に状態が悪い'
  };

  const genderMapping = {
    'men': 'メンズ',
    'women': 'レディース',
    'unisex': 'ユニセックス'
  };

  const reverseCategoryMapping = Object.fromEntries(
    Object.entries(categoryMapping).map(([key, value]) => [value, key])
  );

  const reverseConditionMapping = Object.fromEntries(
    Object.entries(conditionMapping).map(([key, value]) => [value, key])
  );

  const reverseGenderMapping = Object.fromEntries(
    Object.entries(genderMapping).map(([key, value]) => [value, key])
  );

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditFormData({
      name: product.name || '',
      mercari_title: product.mercari_title || '',
      brand: product.brand || '',
      category: categoryMapping[product.category as keyof typeof categoryMapping] || product.category || '',
      size: product.size || '',
      color: product.color || '',
      condition: conditionMapping[product.condition as keyof typeof conditionMapping] || product.condition || '',
      gender: genderMapping[product.gender as keyof typeof genderMapping] || product.gender || '',
      purchase_cost: product.purchase_cost ? product.purchase_cost.toString() : '',
      initial_price: product.initial_price ? product.initial_price.toString() : '',
      current_price: product.current_price ? product.current_price.toString() : '',
      sold_price: product.sold_price ? product.sold_price.toString() : '',
      reference_price: product.reference_price ? product.reference_price.toString() : '',
      measurements: product.measurements ? JSON.stringify(product.measurements) : '',
      description: product.description || '',
      template_description: product.template_description || '',
      notes: product.notes || '',
      status: product.status || 'in_stock',
      shipping_method: product.shipping_method || '',
      shipping_cost: product.shipping_cost ? product.shipping_cost.toString() : '',
      custom_shipping_type: '',
      production_country: product.production_country || '',
      decade: product.decade || '90s',
      asset_type: product.asset_type || 'quick_turn'
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const updateData: any = {
        name: editFormData.name,
        mercari_title: editFormData.mercari_title || null,
        brand: editFormData.brand || null,
        category: reverseCategoryMapping[editFormData.category] || editFormData.category,
        size: editFormData.size || null,
        color: editFormData.color || null,
        condition: reverseConditionMapping[editFormData.condition] || editFormData.condition,
        gender: reverseGenderMapping[editFormData.gender] || editFormData.gender || null,
        purchase_cost: editFormData.purchase_cost ? parseFloat(editFormData.purchase_cost) : 0,
        initial_price: editFormData.initial_price ? parseFloat(editFormData.initial_price) : 0,
        current_price: editFormData.current_price ? parseFloat(editFormData.current_price) : 0,
        sold_price: editFormData.sold_price ? parseFloat(editFormData.sold_price) : null,
        reference_price: editFormData.reference_price ? parseFloat(editFormData.reference_price) : null,
        measurements: editFormData.measurements ? JSON.parse(editFormData.measurements) : null,
        description: editFormData.description || null,
        template_description: editFormData.template_description || null,
        notes: editFormData.notes || null,
        status: editFormData.status,
        shipping_method: editFormData.shipping_method === 'その他' ? editFormData.custom_shipping_type : editFormData.shipping_method || null,
        shipping_cost: editFormData.shipping_cost ? parseFloat(editFormData.shipping_cost) : null,
        production_country: editFormData.production_country || null,
        decade: editFormData.decade || '90s',
        asset_type: editFormData.asset_type || 'quick_turn'
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      await fetchAllData();
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const basicColors = [
    'ホワイト', 'ブラック', 'グレー', 
    'レッド', 'ブルー', 'グリーン', 
    'イエロー', 'ピンク', 'パープル', 
    'ブラウン', 'オレンジ', 'ベージュ', 
    'ゴールド', 'シルバー', 'その他'
  ];

  // 生産国の選択肢
  const countries = [
    'USA', 'Mexico', 'Japan', 'Korea', 'China', 
    'Bangladesh', 'Vietnam', 'Thailand', 'India', '不明', 'Other'
  ];

  // セッションを並び替える関数
  const sortedSessions = [...sessions].sort((a, b) => {
    const aDate = new Date(a.session_date || a.created_at).getTime();
    const bDate = new Date(b.session_date || b.created_at).getTime();
    return sessionSortOrder === 'desc' ? bDate - aDate : aDate - bDate;
  });

  // セッションの並び順を切り替える関数
  const toggleSessionSortOrder = () => {
    setSessionSortOrder(sessionSortOrder === 'desc' ? 'asc' : 'desc');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.mercari_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesAssetType = assetTypeFilter === 'all' || product.asset_type === assetTypeFilter;
    
    // セッションフィルター
    const matchesSession = sessionFilter === 'all' || 
      (product.store_purchases?.purchase_sessions?.id === sessionFilter);
    
    // 店舗フィルター  
    const matchesStore = storeFilter === 'all' || 
      (product.store_purchases?.stores?.id === storeFilter);
    
    return matchesSearch && matchesStatus && matchesAssetType && matchesSession && matchesStore;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'created_at_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'created_at_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'listed_at_asc':
        return new Date(a.listed_date || 0).getTime() - new Date(b.listed_date || 0).getTime();
      case 'listed_at_desc':
        return new Date(b.listed_date || 0).getTime() - new Date(a.listed_date || 0).getTime();
      case 'price_asc':
        return (a.current_price || 0) - (b.current_price || 0);
      case 'price_desc':
        return (b.current_price || 0) - (a.current_price || 0);
      default:
        return 0;
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'in_stock': { label: '在庫', className: 'bg-gray-100 text-gray-700' },
      'ready_to_list': { label: '出品準備完了', className: 'bg-blue-100 text-blue-700' },
      'listed': { label: '出品中', className: 'bg-green-100 text-green-700' },
      'sold': { label: '売却済み', className: 'bg-purple-100 text-purple-700' },
      'on_hold': { label: '保留', className: 'bg-yellow-100 text-yellow-700' },
      'discarded': { label: '破棄', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['in_stock'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getAssetTypeIcon = (assetType: string) => {
    if (assetType === 'asset') {
      return <Gem size={16} className="text-blue-600" title="資産型商品" />;
    } else {
      return <Zap size={16} className="text-orange-600" title="回転型商品" />;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
          <p className="text-gray-600 mt-2">全 {products.length} 件の商品</p>
        </div>
        <Link
          to="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>新規登録</span>
        </Link>
      </div>

      {/* フィルターセクション */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            {/* 上段：検索バー */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="商品名・ブランド・メルカリタイトルで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* 下段：フィルター群 */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* セッションフィルター */}
              <div className="flex items-center space-x-2">
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべてのセッション</option>
                  {sortedSessions.map(session => (
                    <option key={session.id} value={session.id}>{session.title}</option>
                  ))}
                </select>
                <button
                  onClick={toggleSessionSortOrder}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1"
                  title={`セッション日を${sessionSortOrder === 'desc' ? '古い順' : '新しい順'}に並び替え`}
                >
                  <span className="text-sm">{sessionSortOrder === 'desc' ? '新→古' : '古→新'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sessionSortOrder === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                    )}
                  </svg>
                </button>
              </div>

              {/* 店舗フィルター */}
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべての店舗</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>

              {/* 商品タイプフィルター */}
              <select
                value={assetTypeFilter}
                onChange={(e) => setAssetTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべてのタイプ</option>
                <option value="asset">資産型商品</option>
                <option value="quick_turn">回転型商品</option>
              </select>

              {/* 並び替え */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at_desc">登録日（新しい順）</option>
                <option value="created_at_asc">登録日（古い順）</option>
                <option value="listed_at_desc">出品日（新しい順）</option>
                <option value="listed_at_asc">出品日（古い順）</option>
                <option value="price_desc">価格（高い順）</option>
                <option value="price_asc">価格（安い順）</option>
              </select>
            </div>
          </div>
        </div>

        {/* ステータスタブ */}
        <div className="flex overflow-x-auto border-b border-gray-200">
          {[
            { value: 'all', label: 'すべて', count: products.length },
            { value: 'in_stock', label: '在庫', count: products.filter(p => p.status === 'in_stock').length },
            { value: 'ready_to_list', label: '出品準備', count: products.filter(p => p.status === 'ready_to_list').length },
            { value: 'listed', label: '出品中', count: products.filter(p => p.status === 'listed').length },
            { value: 'sold', label: '売却済み', count: products.filter(p => p.status === 'sold').length },
            { value: 'on_hold', label: '保留', count: products.filter(p => p.status === 'on_hold').length },
            { value: 'discarded', label: '廃棄', count: products.filter(p => p.status === 'discarded').length }
          ].map(status => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
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
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            商品が見つかりません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    写真
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    セッション
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    店舗
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ブランド
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サイズ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    現在の価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    発送情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {product.photos && product.photos.length > 0 ? (
                          <img
                            src={product.photos[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getAssetTypeIcon(product.asset_type)}
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {(product as any).store_purchases?.purchase_sessions?.title || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {(product as any).store_purchases?.stores?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.brand || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.size || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{product.current_price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.shipping_method ? (
                          <div>
                            <div>{product.shipping_method}</div>
                            {product.shipping_cost && (
                              <div className="text-xs text-gray-400">¥{product.shipping_cost.toLocaleString()}</div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-gray-600 hover:text-blue-600 p-1 rounded"
                          title="商品詳細を見る"
                          onClick={() => {
                            // 現在のパスを保存
                            sessionStorage.setItem('previousProductListPath', location.pathname);
                          }}
                        >
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">商品編集</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 基本情報 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">基本情報</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">商品名 *</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">メルカリタイトル</label>
                      <input
                        type="text"
                        value={editFormData.mercari_title}
                        onChange={(e) => setEditFormData({ ...editFormData, mercari_title: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">ブランド</label>
                      <input
                        type="text"
                        value={editFormData.brand}
                        onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">カテゴリー *</label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">選択してください</option>
                        <option value="トップス">トップス</option>
                        <option value="パンツ">パンツ</option>
                        <option value="スカート">スカート</option>
                        <option value="ワンピース">ワンピース</option>
                        <option value="アウター">アウター</option>
                        <option value="シューズ">シューズ</option>
                        <option value="バッグ">バッグ</option>
                        <option value="アクセサリー">アクセサリー</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">サイズ</label>
                      <input
                        type="text"
                        value={editFormData.size}
                        onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">色</label>
                      <select
                        value={editFormData.color}
                        onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        {basicColors.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">状態 *</label>
                      <select
                        value={editFormData.condition}
                        onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">選択してください</option>
                        <option value="新品">新品</option>
                        <option value="未使用に近い">未使用に近い</option>
                        <option value="目立った傷や汚れなし">目立った傷や汚れなし</option>
                        <option value="やや傷や汚れあり">やや傷や汚れあり</option>
                        <option value="傷や汚れあり">傷や汚れあり</option>
                        <option value="全体的に状態が悪い">全体的に状態が悪い</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">性別</label>
                      <select
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        <option value="メンズ">メンズ</option>
                        <option value="レディース">レディース</option>
                        <option value="ユニセックス">ユニセックス</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">ステータス</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="in_stock">在庫</option>
                        <option value="ready_to_list">出品準備完了</option>
                        <option value="listed">出品中</option>
                        <option value="sold">売却済み</option>
                        <option value="on_hold">保留</option>
                        <option value="discarded">破棄</option>
                      </select>
                    </div>
                  </div>

                  {/* 価格・配送情報 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">価格・配送情報</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">仕入価格</label>
                      <input
                        type="number"
                        value={editFormData.purchase_cost}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right bg-gray-100 cursor-not-allowed"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">※ 一括購入の場合は変更できません</p>
                    </div>


                    <div>
                      <label className="block text-sm font-medium mb-1">初期価格</label>
                      <input
                        type="number"
                        value={editFormData.initial_price}
                        onChange={(e) => setEditFormData({ ...editFormData, initial_price: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">現在価格</label>
                      <input
                        type="number"
                        value={editFormData.current_price}
                        onChange={(e) => setEditFormData({ ...editFormData, current_price: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">売却価格</label>
                      <input
                        type="number"
                        value={editFormData.sold_price}
                        onChange={(e) => setEditFormData({ ...editFormData, sold_price: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">参考価格</label>
                      <input
                        type="number"
                        value={editFormData.reference_price}
                        onChange={(e) => setEditFormData({ ...editFormData, reference_price: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">配送方法</label>
                      <select
                        value={editFormData.shipping_method}
                        onChange={(e) => {
                          const method = e.target.value;
                          let defaultCost = editFormData.shipping_cost;

                          if (method === 'ゆうゆうメルカリ便') {
                            defaultCost = '215';
                          } else if (method === 'らくらくメルカリ便') {
                            defaultCost = '750';
                          } else if (method === 'その他') {
                            defaultCost = '0';
                          }

                          setEditFormData({
                            ...editFormData,
                            shipping_method: method,
                            shipping_cost: defaultCost,
                            custom_shipping_type: method === 'その他' ? editFormData.custom_shipping_type : ''
                          });
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        <option value="ゆうゆうメルカリ便">ゆうゆうメルカリ便</option>
                        <option value="らくらくメルカリ便">らくらくメルカリ便</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>

                    {/* その他選択時の追加フィールド */}
                    {editFormData.shipping_method === 'その他' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">発送タイプ</label>
                        <input
                          type="text"
                          value={editFormData.custom_shipping_type}
                          onChange={(e) => setEditFormData({ ...editFormData, custom_shipping_type: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例：普通郵便、レターパック等"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">配送料</label>
                      <input
                        type="number"
                        value={editFormData.shipping_cost}
                        onChange={(e) => setEditFormData({ ...editFormData, shipping_cost: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">生産国</label>
                      <select
                        value={editFormData.production_country}
                        onChange={(e) => setEditFormData({ ...editFormData, production_country: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">生産国を選択してください</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">年代</label>
                      <select
                        value={editFormData.decade}
                        onChange={(e) => setEditFormData({ ...editFormData, decade: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="50s">50s</option>
                        <option value="60s">60s</option>
                        <option value="70s">70s</option>
                        <option value="80s">80s</option>
                        <option value="90s">90s</option>
                        <option value="00s">00s</option>
                        <option value="10s">10s</option>
                        <option value="20s">20s</option>
                        <option value="50s～60s">50s～60s</option>
                        <option value="60s～70s">60s～70s</option>
                        <option value="70s～80s">70s～80s</option>
                        <option value="80s～90s">80s～90s</option>
                        <option value="90s～00s">90s～00s</option>
                        <option value="不明">不明</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">商品タイプ</label>
                      <select
                        value={editFormData.asset_type}
                        onChange={(e) => setEditFormData({ ...editFormData, asset_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="quick_turn">回転型商品 (Quick Turn)</option>
                        <option value="asset">資産型商品 (Asset)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        回転型：早期売却重視 / 資産型：長期保有OK
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">採寸情報</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* カテゴリーに応じた採寸項目を表示 */}
                        {(() => {
                          const measurementFields = {
                            'トップス': [
                              { key: 'shoulder', label: '肩幅' },
                              { key: 'chest', label: '身幅' },
                              { key: 'length', label: '着丈' },
                              { key: 'sleeve', label: '袖丈' }
                            ],
                            'アウター': [
                              { key: 'shoulder', label: '肩幅' },
                              { key: 'chest', label: '身幅' },
                              { key: 'length', label: '着丈' },
                              { key: 'sleeve', label: '袖丈' }
                            ],
                            'パンツ': [
                              { key: 'waist', label: 'ウエスト' },
                              { key: 'hip', label: 'ヒップ' },
                              { key: 'inseam', label: '股下' },
                              { key: 'rise', label: '股上' },
                              { key: 'thigh', label: 'もも周り' },
                              { key: 'hem', label: '裾幅' }
                            ],
                            'ワンピース': [
                              { key: 'shoulder', label: '肩幅' },
                              { key: 'chest', label: '身幅' },
                              { key: 'length', label: '着丈' },
                              { key: 'sleeve', label: '袖丈' },
                              { key: 'waist', label: 'ウエスト' }
                            ],
                            'シューズ': [
                              { key: 'length', label: '全長' },
                              { key: 'width', label: '横幅' },
                              { key: 'height', label: 'ヒール高' }
                            ],
                            'バッグ': [
                              { key: 'width', label: '横幅' },
                              { key: 'height', label: '高さ' },
                              { key: 'depth', label: 'マチ' }
                            ],
                            'アクセサリー': [
                              { key: 'width', label: '横幅' },
                              { key: 'height', label: '高さ' }
                            ],
                            'その他': [
                              { key: 'width', label: '横幅' },
                              { key: 'height', label: '高さ' },
                              { key: 'depth', label: '奥行き' }
                            ]
                          };
                          
                          const currentMeasurements = editFormData.measurements ? 
                            (typeof editFormData.measurements === 'string' ? 
                              JSON.parse(editFormData.measurements || '{}') : editFormData.measurements) : {};
                          
                          const fields = measurementFields[editFormData.category] || measurementFields['その他'];
                          
                          return fields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {field.label} (cm)
                              </label>
                              <input
                                type="number"
                                value={currentMeasurements[field.key] || ''}
                                onChange={(e) => {
                                  const newMeasurements = { ...currentMeasurements };
                                  if (e.target.value) {
                                    newMeasurements[field.key] = parseFloat(e.target.value);
                                  } else {
                                    delete newMeasurements[field.key];
                                  }
                                  setEditFormData({ 
                                    ...editFormData, 
                                    measurements: JSON.stringify(newMeasurements)
                                  });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 説明・メモ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">説明・メモ</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">商品説明</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium mb-1">備考</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* ボタン */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    更新
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;