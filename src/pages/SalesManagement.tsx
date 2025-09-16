import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Pause, Ban, Edit, Check, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types/index';

const SalesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('listed');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalType, setModalType] = useState<'edit' | 'sale' | 'hold' | 'discard' | 'edit_sold' | 'edit_hold' | 'edit_discard' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    current_price: 0,
    mercari_title: '',
    listed_at: '',
    sold_price: 0,
    sold_at: new Date().toISOString().split('T')[0],
    shipping_method: '',
    shipping_cost: 0,
    custom_shipping_type: '',
    hold_reason: '',
    held_at: new Date().toISOString().split('T')[0],
    discard_reason: '',
    discarded_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('status', ['ready_to_list', 'listed', 'sold', 'on_hold', 'discarded'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.mercari_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (type: typeof modalType, product: Product) => {
    setSelectedProduct(product);
    setModalType(type);
    let initialFormData = {
      current_price: product.current_price || 0,
      mercari_title: product.mercari_title || '',
      listed_at: product.listed_at ? new Date(product.listed_at).toISOString().split('T')[0] : '',
      sold_price: product.sold_price || product.current_price || 0,
      sold_at: product.sold_at ? new Date(product.sold_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      shipping_method: product.shipping_method || 'ゆうゆうメルカリ便',
      shipping_cost: product.shipping_cost || 215,
      custom_shipping_type: '',
      hold_reason: type === 'edit_hold' ? (product.notes || '') : '',
      held_at: new Date().toISOString().split('T')[0],
      discard_reason: type === 'edit_discard' ? (product.notes || '') : '',
      discarded_at: product.discarded_at ? new Date(product.discarded_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
    
    setFormData(initialFormData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !modalType) return;

    try {
      let updateData: any = {};

      switch (modalType) {
        case 'edit':
          updateData = {
            current_price: formData.current_price,
            mercari_title: formData.mercari_title,
            listed_at: formData.listed_at ? new Date(formData.listed_at).toISOString() : null,
            shipping_method: formData.shipping_method === 'その他' ? formData.custom_shipping_type : formData.shipping_method,
            shipping_cost: formData.shipping_cost
          };
          break;

        case 'sale':
          updateData = {
            status: 'sold',
            sold_price: formData.sold_price,
            sold_at: new Date(formData.sold_at).toISOString(),
            shipping_method: formData.shipping_method === 'その他' ? formData.custom_shipping_type : formData.shipping_method,
            shipping_cost: formData.shipping_cost,
            platform_fee: Math.floor(formData.sold_price * 0.1) // 販売手数料10%
          };
          break;

        case 'hold':
          updateData = {
            status: 'on_hold',
            notes: formData.hold_reason, // hold_reasonフィールドがないのでnotesに保存
            // held_at: new Date(formData.held_at).toISOString() // held_atフィールドがない場合はコメントアウト
          };
          break;

        case 'discard':
          updateData = {
            status: 'discarded',
            notes: formData.discard_reason, // discard_reasonフィールドがないのでnotesに保存
            discarded_at: new Date(formData.discarded_at).toISOString()
          };
          break;

        case 'edit_sold':
          updateData = {
            sold_price: formData.sold_price,
            sold_at: new Date(formData.sold_at).toISOString(),
            shipping_method: formData.shipping_method === 'その他' ? formData.custom_shipping_type : formData.shipping_method,
            shipping_cost: formData.shipping_cost,
            platform_fee: Math.floor(formData.sold_price * 0.1) // 販売手数料10%
          };
          break;

        case 'edit_hold':
          updateData = {
            notes: formData.hold_reason
          };
          break;

        case 'edit_discard':
          updateData = {
            notes: formData.discard_reason,
            discarded_at: new Date(formData.discarded_at).toISOString()
          };
          break;
      }

      console.log('Updating product with data:', updateData); // デバッグログ

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProduct.id);

      if (error) {
        console.error('Supabase error:', error);
        alert('更新に失敗しました: ' + error.message);
        throw error;
      }

      console.log('Product updated successfully'); // デバッグログ
      
      await fetchProducts();
      closeModal();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

    } catch (error) {
      console.error('Error updating product:', error);
      alert('エラーが発生しました。詳細はコンソールを確認してください。');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ready_to_list': { label: '出品準備', className: 'bg-yellow-100 text-yellow-700' },
      'listed': { label: '出品中', className: 'bg-blue-100 text-blue-700' },
      'sold': { label: '売却済み', className: 'bg-green-100 text-green-700' },
      'on_hold': { label: '保留', className: 'bg-orange-100 text-orange-700' },
      'discarded': { label: '廃棄', className: 'bg-red-100 text-red-700' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['listed'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const shippingMethods = [
    { value: 'ゆうゆうメルカリ便', label: 'ゆうゆうメルカリ便', cost: 215 },
    { value: 'らくらくメルカリ便', label: 'らくらくメルカリ便', cost: 750 },
    { value: 'その他', label: 'その他', cost: 0 }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">出品管理</h1>
          <p className="text-gray-600 mt-2">出品中・売却済み商品の管理</p>
        </div>
      </div>

      {/* フィルターセクション */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="商品名・ブランド・タイトルで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ステータスタブ */}
        <div className="flex overflow-x-auto border-b border-gray-200">
          {[
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

        {/* 商品一覧テーブル */}
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            商品が見つかりません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    現在価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {product.photos && product.photos.length > 0 ? (
                            <img
                              src={product.photos[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand} | {product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{product.current_price?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {/* 出品中の場合 */}
                        {product.status === 'listed' && (
                          <>
                            <button
                              onClick={() => {
                                // 商品詳細画面に直接遷移
                                sessionStorage.setItem('previousProductListPath', '/sales');
                                navigate(`/products/${product.id}`);
                              }}
                              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-1"
                            >
                              <Upload size={12} />
                              <span>出品</span>
                            </button>
                            <button
                              onClick={() => openModal('edit', product)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => openModal('sale', product)}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              売却
                            </button>
                            <button
                              onClick={() => openModal('hold', product)}
                              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              保留
                            </button>
                            <button
                              onClick={() => openModal('discard', product)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              廃棄
                            </button>
                          </>
                        )}
                        
                        {/* 売却済みの場合 */}
                        {product.status === 'sold' && (
                          <button
                            onClick={() => openModal('edit_sold', product)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            売却情報編集
                          </button>
                        )}
                        
                        {/* 保留中の場合 */}
                        {product.status === 'on_hold' && (
                          <>
                            <button
                              onClick={() => openModal('edit_hold', product)}
                              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              保留情報編集
                            </button>
                            <button
                              onClick={() => openModal('sale', product)}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              売却
                            </button>
                            <button
                              onClick={() => openModal('discard', product)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              廃棄
                            </button>
                          </>
                        )}
                        
                        {/* 廃棄済みの場合 */}
                        {product.status === 'discarded' && (
                          <button
                            onClick={() => openModal('edit_discard', product)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            廃棄情報編集
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* モーダル */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalType === 'edit' && '情報修正'}
                {modalType === 'sale' && '売却処理'}
                {modalType === 'hold' && '保留処理'}
                {modalType === 'discard' && '廃棄処理'}
                {modalType === 'edit_sold' && '売却情報編集'}
                {modalType === 'edit_hold' && '保留情報編集'}
                {modalType === 'edit_discard' && '廃棄情報編集'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'edit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">現在価格</label>
                    <input
                      type="number"
                      value={formData.current_price}
                      onChange={(e) => setFormData({ ...formData, current_price: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">タイトル</label>
                    <input
                      type="text"
                      value={formData.mercari_title}
                      onChange={(e) => setFormData({ ...formData, mercari_title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="メルカリ出品タイトル"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">出品日</label>
                    <input
                      type="date"
                      value={formData.listed_at}
                      onChange={(e) => setFormData({ ...formData, listed_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">発送タイプ（予定）</label>
                    <select
                      value={formData.shipping_method}
                      onChange={(e) => {
                        const selectedMethod = shippingMethods.find(m => m.value === e.target.value);
                        setFormData({
                          ...formData,
                          shipping_method: e.target.value,
                          shipping_cost: selectedMethod?.cost || 0,
                          custom_shipping_type: e.target.value === 'その他' ? formData.custom_shipping_type : ''
                        });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {shippingMethods.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* その他選択時の追加フィールド */}
                  {formData.shipping_method === 'その他' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">発送タイプ詳細</label>
                      <input
                        type="text"
                        value={formData.custom_shipping_type}
                        onChange={(e) => setFormData({ ...formData, custom_shipping_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例：普通郵便、レターパック等"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">送料（予定）</label>
                    <input
                      type="number"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="送料"
                    />
                  </div>
                </>
              )}

              {modalType === 'sale' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">売却価格</label>
                    <input
                      type="number"
                      value={formData.sold_price}
                      onChange={(e) => setFormData({ ...formData, sold_price: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">売却日</label>
                    <input
                      type="date"
                      value={formData.sold_at}
                      onChange={(e) => setFormData({ ...formData, sold_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">発送方法</label>
                    <select
                      value={formData.shipping_method}
                      onChange={(e) => {
                        const selectedMethod = shippingMethods.find(m => m.value === e.target.value);
                        setFormData({
                          ...formData,
                          shipping_method: e.target.value,
                          shipping_cost: selectedMethod?.cost || 0,
                          custom_shipping_type: e.target.value === 'その他' ? formData.custom_shipping_type : ''
                        });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">選択してください</option>
                      {shippingMethods.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* その他選択時の追加フィールド */}
                  {formData.shipping_method === 'その他' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">発送タイプ</label>
                      <input
                        type="text"
                        value={formData.custom_shipping_type}
                        onChange={(e) => setFormData({ ...formData, custom_shipping_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例：普通郵便、レターパック等"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">送料</label>
                    <input
                      type="number"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'hold' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">保留理由</label>
                    <textarea
                      value={formData.hold_reason}
                      onChange={(e) => setFormData({ ...formData, hold_reason: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="季節的な理由、価格見直しなど"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">保留日</label>
                    <input
                      type="date"
                      value={formData.held_at}
                      onChange={(e) => setFormData({ ...formData, held_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'discard' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">廃棄理由</label>
                    <textarea
                      value={formData.discard_reason}
                      onChange={(e) => setFormData({ ...formData, discard_reason: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="汚れ、破れ、その他の理由"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">廃棄日</label>
                    <input
                      type="date"
                      value={formData.discarded_at}
                      onChange={(e) => setFormData({ ...formData, discarded_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* 売却済み商品の編集 */}
              {modalType === 'edit_sold' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">売却価格</label>
                    <input
                      type="number"
                      value={formData.sold_price}
                      onChange={(e) => setFormData({ ...formData, sold_price: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">売却日</label>
                    <input
                      type="date"
                      value={formData.sold_at}
                      onChange={(e) => setFormData({ ...formData, sold_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">発送方法</label>
                    <select
                      value={formData.shipping_method}
                      onChange={(e) => {
                        const selectedMethod = shippingMethods.find(m => m.value === e.target.value);
                        setFormData({
                          ...formData,
                          shipping_method: e.target.value,
                          shipping_cost: selectedMethod?.cost || 0,
                          custom_shipping_type: e.target.value === 'その他' ? formData.custom_shipping_type : ''
                        });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {shippingMethods.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* その他選択時の追加フィールド */}
                  {formData.shipping_method === 'その他' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">発送タイプ</label>
                      <input
                        type="text"
                        value={formData.custom_shipping_type}
                        onChange={(e) => setFormData({ ...formData, custom_shipping_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例：普通郵便、レターパック等"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">送料</label>
                    <input
                      type="number"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* 保留商品の編集 */}
              {modalType === 'edit_hold' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">保留理由</label>
                    <textarea
                      value={formData.hold_reason}
                      onChange={(e) => setFormData({ ...formData, hold_reason: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="季節的な理由、価格見直しなど"
                      required
                    />
                  </div>
                </>
              )}

              {/* 廃棄商品の編集 */}
              {modalType === 'edit_discard' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">廃棄理由</label>
                    <textarea
                      value={formData.discard_reason}
                      onChange={(e) => setFormData({ ...formData, discard_reason: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="汚れ、破れ、その他の理由"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">廃棄日</label>
                    <input
                      type="date"
                      value={formData.discarded_at}
                      onChange={(e) => setFormData({ ...formData, discarded_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 成功メッセージ */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center z-50">
          <Check size={20} className="mr-2" />
          処理が完了しました
        </div>
      )}
    </div>
  );
};

export default SalesManagement;