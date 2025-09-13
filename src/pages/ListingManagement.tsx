import React, { useState, useEffect } from 'react';
import { Package, Filter, Search, X, Save, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/index';
import { getProductDescriptionTemplate } from '../templates/productDescriptionTemplate';

const ListingManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingFormData, setListingFormData] = useState({
    mercari_title: '',
    description: '',
    current_price: 0,
    reference_price: 0,
    listed_at: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store_purchases!store_purchase_id (
            stores (
              name
            )
          )
        `)
        .in('status', ['in_stock', 'ready_to_list'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched products for listing:', data); // デバッグログ
      console.log('Total products found:', data?.length || 0); // デバッグログ
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.mercari_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };


  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'in_stock': '在庫中',
      'ready_to_list': '出品準備完了',
      'listed': '出品済み',
      'sold': '売却済み'
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'tops': 'トップス',
      'outerwear': 'アウター', 
      'bottoms': 'ボトムス',
      'dresses': 'ワンピース',
      'shoes': 'シューズ',
      'accessories': 'アクセサリー',
      'bags': 'バッグ',
      'other': 'その他'
    };
    return labels[category] || category;
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setListingFormData({
      mercari_title: product.mercari_title || '',
      description: product.description || '',
      current_price: product.current_price || 0,
      reference_price: product.reference_price || 0,
      listed_at: product.listed_at ? new Date(product.listed_at).toISOString().split('T')[0] : ''
    });
    setShowListingForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const updateData: any = {
        mercari_title: listingFormData.mercari_title,
        description: listingFormData.description,
        current_price: listingFormData.current_price,
        initial_price: listingFormData.current_price, // 出品価格を初期価格にも設定
        reference_price: listingFormData.reference_price || null
      };

      // 出品日が設定されている場合のみ追加
      if (listingFormData.listed_at) {
        updateData.listed_at = new Date(listingFormData.listed_at).toISOString();
        updateData.status = 'listed';
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setShowListingForm(false);
      setSelectedProduct(null);
      fetchProducts();
      
      // 成功メッセージを表示
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('更新に失敗しました');
    }
  };

  const generateDescriptionTemplate = () => {
    if (!selectedProduct) return;
    
    const template = getProductDescriptionTemplate(selectedProduct);
    setListingFormData({ ...listingFormData, description: template });
  };

  const getConditionLabel = (condition: string) => {
    const labels: { [key: string]: string } = {
      'new_with_tags': '新品・未使用',
      'new_without_tags': '未使用に近い',
      'used_like_new': '目立った傷や汚れなし',
      'used_good': 'やや傷や汚れあり',
      'used_fair': '傷や汚れあり',
      'used_poor': '全体的に状態が悪い'
    };
    return labels[condition] || condition;
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">出品準備</h1>
        <p className="text-gray-600">商品の出品準備と管理を行います</p>
      </div>


      {/* フィルターとサーチ */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="商品名、ブランド、タイトルで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全てのステータス</option>
              <option value="in_stock">在庫中</option>
              <option value="ready_to_list">出品準備完了</option>
              <option value="listed">出品済み</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全てのカテゴリ</option>
              <option value="tops">トップス</option>
              <option value="outerwear">アウター</option>
              <option value="bottoms">ボトムス</option>
              <option value="dresses">ワンピース</option>
              <option value="shoes">シューズ</option>
              <option value="accessories">アクセサリー</option>
              <option value="bags">バッグ</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>
      </div>

      {/* 商品一覧 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            商品一覧 ({filteredProducts.length}件)
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            商品が見つかりません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {product.photos && product.photos.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-600">{product.brand}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {getCategoryLabel(product.category)}
                          </span>
                          {product.color && (
                            <span className="text-sm text-gray-500">
                              {product.color}
                            </span>
                          )}
                          {product.size && (
                            <span className="text-sm text-gray-500">
                              {product.size}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'in_stock' 
                            ? 'bg-blue-100 text-blue-700'
                            : product.status === 'ready_to_list'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {getStatusLabel(product.status)}
                        </span>

                        <button
                          onClick={() => handleProductSelect(product)}
                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          出品情報編集
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">仕入価格:</span>
                        <span className="ml-1 font-medium">¥{product.purchase_cost.toLocaleString()}</span>
                      </div>
                      {product.current_price > 0 && (
                        <div>
                          <span className="text-gray-500">出品価格:</span>
                          <span className="ml-1 font-medium text-blue-600">¥{product.current_price.toLocaleString()}</span>
                        </div>
                      )}
                      {product.reference_price && (
                        <div>
                          <span className="text-gray-500">参考価格:</span>
                          <span className="ml-1 font-medium text-green-600">¥{product.reference_price.toLocaleString()}</span>
                        </div>
                      )}
                      {product.store_purchases?.stores?.name && (
                        <div>
                          <span className="text-gray-500">仕入店舗:</span>
                          <span className="ml-1 font-medium">{product.store_purchases.stores.name}</span>
                        </div>
                      )}
                    </div>

                    {product.mercari_title && (
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm">メルカリタイトル:</span>
                        <p className="text-sm text-gray-700 truncate">{product.mercari_title}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 出品情報編集モーダル */}
      {showListingForm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  出品情報編集 - {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowListingForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* メルカリタイトル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メルカリタイトル *
                  </label>
                  <input
                    type="text"
                    value={listingFormData.mercari_title}
                    onChange={(e) => setListingFormData({ ...listingFormData, mercari_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 美品 ユニクロ カシミヤセーター Mサイズ グレー"
                    required
                    maxLength={40}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {listingFormData.mercari_title.length}/40文字
                  </p>
                </div>

                {/* 説明文 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      商品説明 *
                    </label>
                    <button
                      type="button"
                      onClick={generateDescriptionTemplate}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      テンプレート生成
                    </button>
                  </div>
                  <textarea
                    value={listingFormData.description}
                    onChange={(e) => setListingFormData({ ...listingFormData, description: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="商品の詳細な説明を入力してください..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {listingFormData.description.length}/1000文字
                  </p>
                </div>

                {/* 価格情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      出品価格 (円) *
                    </label>
                    <input
                      type="number"
                      value={listingFormData.current_price || ''}
                      onChange={(e) => setListingFormData({ ...listingFormData, current_price: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      placeholder="0"
                      min="300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メルカリ参考価格 (円)
                    </label>
                    <input
                      type="number"
                      value={listingFormData.reference_price || ''}
                      onChange={(e) => setListingFormData({ ...listingFormData, reference_price: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {/* 出品日 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    出品日
                  </label>
                  <input
                    type="date"
                    value={listingFormData.listed_at}
                    onChange={(e) => setListingFormData({ ...listingFormData, listed_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    出品日を設定すると自動的に「出品済み」ステータスになります
                  </p>
                </div>

                {/* 利益計算表示 */}
                {listingFormData.current_price > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">利益計算</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">出品価格:</span>
                        <span>¥{listingFormData.current_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">手数料 (10%):</span>
                        <span className="text-red-600">-¥{Math.floor(listingFormData.current_price * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">仕入価格:</span>
                        <span className="text-red-600">-¥{selectedProduct.purchase_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>予想利益:</span>
                        <span className={`${
                          listingFormData.current_price * 0.9 - selectedProduct.purchase_cost >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          ¥{Math.floor(listingFormData.current_price * 0.9 - selectedProduct.purchase_cost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ボタン */}
                <div className="flex space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowListingForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>保存</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 成功メッセージ */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">更新完了</h3>
              <p className="text-gray-600">商品情報を正常に更新しました</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingManagement;