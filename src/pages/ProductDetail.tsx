import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Package, Gem, Zap, Calendar, DollarSign, Info, Camera, ChevronLeft, ChevronRight, FileText, Copy, Check, Truck, Globe, Clock, Ruler } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, SHIPPING_TYPES } from '../types/index';
import { format } from 'date-fns';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 日本語表示用のマッピング
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

  const assetTypeMapping = {
    'asset': '資産型商品',
    'quick_turn': '回転型商品'
  };

  const statusMapping = {
    'in_stock': '在庫',
    'ready_to_list': '出品準備完了',
    'listed': '出品中',
    'sold': '売却済み',
    'on_hold': '保留',
    'discarded': '破棄'
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'in_stock': { label: '在庫', className: 'bg-gray-100 text-gray-700' },
      'ready_to_list': { label: '出品準備完了', className: 'bg-blue-100 text-blue-700' },
      'listed': { label: '出品中', className: 'bg-green-100 text-green-700' },
      'sold': { label: '売却済み', className: 'bg-purple-100 text-purple-700' },
      'on_hold': { label: '保留', className: 'bg-yellow-100 text-yellow-700' },
      'discarded': { label: '廃棄', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['in_stock'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getAssetTypeIcon = (assetType: string) => {
    if (assetType === 'asset') {
      return <Gem size={20} className="text-blue-600" title="資産型商品" />;
    } else {
      return <Zap size={20} className="text-orange-600" title="回転型商品" />;
    }
  };

  const nextPhoto = () => {
    if (product && product.photos && product.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % product.photos.length);
    }
  };

  const prevPhoto = () => {
    if (product && product.photos && product.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + product.photos.length) % product.photos.length);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          商品が見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* パンくずナビとヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // セッションストレージから元のリストページを取得
              const previousPath = sessionStorage.getItem('previousProductListPath');
              if (previousPath) {
                navigate(previousPath);
              } else {
                // デフォルトは商品管理トップへ
                navigate('/products');
              }
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>商品一覧に戻る</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            {getAssetTypeIcon(product.asset_type)}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(product.status)}
          <Link
            to={`/products/${product.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} />
            <span>編集</span>
          </Link>
        </div>
      </div>

      {/* 3カラムレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム：写真 + 基本情報 */}
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
            {product.photos && product.photos.length > 0 ? (
              <>
                <img
                  src={product.photos[currentPhotoIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg></div>';
                    }
                  }}
                />
                {product.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {product.photos.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Camera size={64} className="mx-auto mb-2" />
                  <p>写真がありません</p>
                </div>
              </div>
            )}
          </div>
          
          {/* サムネイル */}
          {product.photos && product.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentPhotoIndex === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 日付情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
              <Calendar size={16} className="text-indigo-600" />
              <span>日付情報</span>
            </h3>
            <div className="space-y-2">
              {product.listed_date && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">出品日</label>
                  <p className="text-gray-900 text-sm">
                    {new Date(product.listed_date).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </p>
                </div>
              )}
              {product.sold_date && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">売却日</label>
                  <p className="text-gray-900 text-sm">
                    {new Date(product.sold_date).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </p>
                </div>
              )}
              {product.discarded_at && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">廃棄日</label>
                  <p className="text-gray-900 text-sm">
                    {new Date(product.discarded_at).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* 基本情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
              <Package size={16} className="text-blue-600" />
              <span>基本情報</span>
            </h3>
            
            {/* メルカリタイトル */}
            {product.mercari_title && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-blue-700">メルカリタイトル</label>
                  <button
                    onClick={() => handleCopy(product.mercari_title, 'title')}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white rounded hover:bg-blue-100 transition-colors border border-blue-300"
                  >
                    {copiedField === 'title' ? (
                      <>
                        <Check size={12} className="text-green-600" />
                        <span className="text-green-600">コピー済み</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="text-blue-600" />
                        <span className="text-blue-600">コピー</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-900 font-medium text-sm">{product.mercari_title}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">ブランド</label>
                <p className="text-gray-900 text-sm">{product.brand || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">カテゴリー</label>
                <p className="text-gray-900 text-sm">{categoryMapping[product.category as keyof typeof categoryMapping] || product.category}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">サイズ</label>
                <p className="text-gray-900 text-sm">{product.size || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">色</label>
                <p className="text-gray-900 text-sm">{product.color || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">状態</label>
                <p className="text-gray-900 text-sm">{conditionMapping[product.condition as keyof typeof conditionMapping] || product.condition}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">性別</label>
                <p className="text-gray-900 text-sm">{genderMapping[product.gender as keyof typeof genderMapping] || product.gender || '-'}</p>
              </div>
            </div>
          </div>

          {/* その他の情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
              <Info size={16} className="text-purple-600" />
              <span>その他の情報</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {product.production_country && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">生産国</label>
                  <p className="text-gray-900 text-sm">{product.production_country}</p>
                </div>
              )}
              {product.decade && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">年代</label>
                  <p className="text-gray-900 text-sm">{product.decade}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600">アセットタイプ</label>
                <p className="text-gray-900 text-sm">
                  {assetTypeMapping[product.asset_type as keyof typeof assetTypeMapping] || product.asset_type}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">ステータス</label>
                <p className="text-gray-900 text-sm">
                  {statusMapping[product.status as keyof typeof statusMapping] || product.status}
                </p>
              </div>
            </div>
          </div>

          {/* 採寸情報 */}
          {product.measurements && Object.keys(product.measurements).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
                <Ruler size={16} className="text-orange-600" />
                <span>採寸情報</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(product.measurements as Record<string, any>).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600">{key}</label>
                    <p className="text-gray-900 text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 中央カラム：金額関係 */}
        <div className="space-y-4">
          {/* 価格情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
              <DollarSign size={16} className="text-green-600" />
              <span>価格情報</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">仕入価格</label>
                <p className="text-gray-900 text-lg font-semibold">¥{(product.allocated_cost || product.purchase_cost || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">初期価格</label>
                <p className="text-gray-900 text-sm">¥{product.initial_price.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">現在価格</label>
                <p className="text-blue-600 text-lg font-bold">¥{product.current_price.toLocaleString()}</p>
              </div>
              {product.sold_price && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">売却価格</label>
                  <p className="text-green-600 text-lg font-bold">¥{product.sold_price.toLocaleString()}</p>
                </div>
              )}
              {product.reference_price && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">参考価格</label>
                  <p className="text-gray-900 text-sm">¥{product.reference_price.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* 配送情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
              <Truck size={16} className="text-orange-600" />
              <span>配送情報</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">配送方法</label>
                <p className="text-gray-900 text-sm">{product.shipping_method || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">送料</label>
                <p className="text-gray-900 text-sm">
                  {product.shipping_cost ? `¥${product.shipping_cost.toLocaleString()}` : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 利益・手数料情報 */}
          {(product.platform_fee !== null || product.net_profit !== null) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-700">
                <DollarSign size={16} className="text-red-600" />
                <span>利益・手数料</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {product.platform_fee !== null && product.platform_fee !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600">プラットフォーム手数料</label>
                    <p className="text-red-600 font-semibold text-sm">-¥{product.platform_fee.toLocaleString()}</p>
                  </div>
                )}
                {product.net_profit !== null && product.net_profit !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600">純利益</label>
                    <p className={`font-semibold text-sm ${product.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.net_profit >= 0 ? '+' : ''}¥{product.net_profit.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右カラム：説明・備考 */}
        <div className="space-y-4">

          {/* 商品説明 */}
          {product.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">商品説明</h3>
                <button
                  onClick={() => handleCopy(product.description, 'description')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  {copiedField === 'description' ? (
                    <>
                      <Check size={16} />
                      <span>コピー済み</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>コピー</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap text-sm">{product.description}</p>
            </div>
          )}

          {/* テンプレート説明文 */}
          {product.template_description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center space-x-2 text-gray-700">
                  <FileText size={16} className="text-purple-600" />
                  <span>出品用説明文（テンプレート）</span>
                </h3>
                <button
                  onClick={() => handleCopy(product.template_description, 'template')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  {copiedField === 'template' ? (
                    <>
                      <Check size={16} />
                      <span>コピー済み</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>コピー</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-gray-900 whitespace-pre-wrap text-sm">{product.template_description}</p>
              </div>
            </div>
          )}

          {/* 備考 */}
          {product.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">備考</h3>
              <p className="text-gray-900 whitespace-pre-wrap text-sm">{product.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;