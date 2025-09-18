import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Edit,
  Trash2,
  Camera,
  Upload,
  X,
  Tag,
  Shirt,
  DollarSign,
  Calculator,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StorePurchase, Store, Product } from '../types/index';
import { format } from 'date-fns';
import { resizeImage, formatFileSize, isSupportedImageFormat } from '../utils/imageResize';

const StorePurchaseDetail: React.FC = () => {
  const { sessionId, storeId } = useParams<{ sessionId: string; storeId: string }>();
  const [storePurchase, setStorePurchase] = useState<StorePurchase | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    brand: '',
    category: 'tops',
    size: '',
    color: '',
    condition: 'used_like_new',
    gender: '',
    purchase_cost: 0,
    initial_price: 0,
    current_price: 0,
    notes: '',
    measurements: {},
    production_country: '',
    decade: '90s',
    asset_type: 'quick_turn' as 'asset' | 'quick_turn'
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [priceInputMode, setPriceInputMode] = useState<'batch' | 'individual'>('individual');
  const [customColor, setCustomColor] = useState<string>('');
  const [batchPrice, setBatchPrice] = useState<number>(0);
  const [showCustomColorInput, setShowCustomColorInput] = useState<boolean>(false);
  const [customSize, setCustomSize] = useState<string>('');
  const [showCustomSizeInput, setShowCustomSizeInput] = useState<boolean>(false);
  const [customCountry, setCustomCountry] = useState<string>('');
  const [showCustomCountryInput, setShowCustomCountryInput] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'listed' | 'sold'>('all');

  // 基本色の選択肢（メルカリ表記に準拠）
  const basicColors = [
    'ホワイト', 'ブラック', 'グレー', 
    'レッド', 'ブルー', 'グリーン', 
    'イエロー', 'ピンク', 'パープル', 
    'ブラウン', 'オレンジ', 'ベージュ', 
    'ゴールド', 'シルバー', 'その他'
  ];

  // サイズの選択肢
  const basicSizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'その他'
  ];

  // 年代の選択肢
  const decades = [
    '50s', '60s', '70s', '80s', '90s', '00s', '10s', '20s',
    '50s～60s', '60s～70s', '70s～80s', '80s～90s', '90s～00s', '不明'
  ];

  // 生産国の選択肢
  const countries = [
    'USA', 'Mexico', 'Japan', 'Korea', 'China', 
    'Bangladesh', 'Vietnam', 'Thailand', 'India', '不明', 'Other'
  ];

  // カテゴリー別採寸項目
  const measurementFields = {
    tops: [
      { key: 'shoulder', label: '肩幅' },
      { key: 'chest', label: '身幅' },
      { key: 'length', label: '着丈' },
      { key: 'sleeve', label: '袖丈' }
    ],
    outerwear: [
      { key: 'shoulder', label: '肩幅' },
      { key: 'chest', label: '身幅' },
      { key: 'length', label: '着丈' },
      { key: 'sleeve', label: '袖丈' }
    ],
    bottoms: [
      { key: 'waist', label: 'ウエスト' },
      { key: 'rise', label: '股上' },
      { key: 'inseam', label: '股下' },
      { key: 'length', label: '総丈' },
      { key: 'hem', label: '裾幅' }
    ],
    dresses: [
      { key: 'shoulder', label: '肩幅' },
      { key: 'chest', label: '身幅' },
      { key: 'length', label: '着丈' },
      { key: 'sleeve', label: '袖丈' },
      { key: 'waist', label: 'ウエスト' }
    ],
    shoes: [
      { key: 'length', label: '全長' },
      { key: 'width', label: '横幅' },
      { key: 'height', label: 'ヒール高' }
    ],
    bags: [
      { key: 'width', label: '横幅' },
      { key: 'height', label: '高さ' },
      { key: 'depth', label: 'マチ' }
    ],
    accessories: [
      { key: 'width', label: '横幅' },
      { key: 'height', label: '高さ' }
    ],
    other: [
      { key: 'width', label: '横幅' },
      { key: 'height', label: '高さ' },
      { key: 'depth', label: '奥行き' }
    ]
  };

  useEffect(() => {
    if (sessionId && storeId) {
      fetchStorePurchaseDetail();
    }
  }, [sessionId, storeId]);

  const fetchStorePurchaseDetail = async () => {
    try {
      // セッションIDと店舗IDで store_purchases を取得
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('store_purchases')
        .select('*')
        .eq('session_id', sessionId)
        .eq('store_id', storeId)
        .single();

      if (purchaseError) throw purchaseError;
      
      setStorePurchase(purchaseData);
      // price_input_mode を設定
      setPriceInputMode((purchaseData as any).price_input_mode || 'individual');

      // 次に関連する店舗情報と商品を取得
      const [storeRes, productsRes] = await Promise.all([
        supabase.from('stores').select('*').eq('id', purchaseData.store_id).single(),
        supabase.from('products').select('*').eq('store_purchase_id', purchaseData.id)
      ]);

      if (storeRes.error) throw storeRes.error;
      if (productsRes.error) throw productsRes.error;

      setStore(storeRes.data);
      const productsData = productsRes.data || [];
      console.log('取得した商品データ:', productsData);
      productsData.forEach(product => {
        console.log(`商品「${product.name}」のphotos:`, product.photos);
      });
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching store purchase detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイル形式チェック
    if (!isSupportedImageFormat(file)) {
      alert('サポートされていない画像形式です。JPEG、PNG、WebP、HEICファイルを選択してください。');
      return;
    }

    try {
      console.log(`元のファイル: ${file.name} (${formatFileSize(file.size)})`);
      
      // 画像をリサイズ（12MB → 200KB程度）
      const resizedFile = await resizeImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        outputFormat: 'image/jpeg',
        targetSizeKB: 200
      });

      setSelectedPhoto(resizedFile);
      
      // プレビュー用のDataURLを生成
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(resizedFile);

      console.log(`リサイズ後: ${resizedFile.name} (${formatFileSize(resizedFile.size)})`);
    } catch (error) {
      console.error('画像処理エラー:', error);
      alert('画像の処理中にエラーが発生しました。別の画像を選択してください。');
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview('');
  };

  const resetForm = () => {
    setProductFormData({
      name: '',
      brand: '',
      category: 'tops',
      size: '',
      color: '',
      condition: 'used_like_new',
      gender: '',
      purchase_cost: 0,
      initial_price: 0,
      current_price: 0,
      notes: '',
      measurements: {},
      production_country: '',
      decade: '90s',
      asset_type: 'quick_turn' as 'asset' | 'quick_turn'
    });
    setSelectedPhoto(null);
    setPhotoPreview('');
    setEditingProduct(null);
    setShowCustomColorInput(false);
    setCustomColor('');
    setShowCustomSizeInput(false);
    setCustomSize('');
    setShowCustomCountryInput(false);
    setCustomCountry('');
  };

  // 按分後単価を計算する関数
  const calculateAllocatedCost = async (storePurchaseData: any, productCost: number) => {
    try {
      // セッション情報と全店舗情報を取得
      const { data: sessionData } = await supabase
        .from('purchase_sessions')
        .select(`
          transportation_cost,
          transfer_fee,
          agency_fee,
          store_purchases(product_cost, shipping_cost, commission_fee)
        `)
        .eq('id', sessionId)
        .single();

      if (!sessionData) return productCost;

      // セッション全体の共通コスト
      const commonCosts = (sessionData.transportation_cost || 0) + 
                         (sessionData.transfer_fee || 0) + 
                         (sessionData.agency_fee || 0);

      // セッション全体の総額を計算
      let totalAmount = 0;
      if (sessionData.store_purchases) {
        totalAmount = sessionData.store_purchases.reduce((sum: number, sp: any) => {
          return sum + (sp.product_cost || 0) + (sp.shipping_cost || 0) + (sp.commission_fee || 0);
        }, 0);
      }

      // 現在の店舗のコスト
      const currentStoreAmount = (storePurchaseData?.product_cost || 0) + 
                                (storePurchaseData?.shipping_cost || 0) + 
                                (storePurchaseData?.commission_fee || 0);

      // 共通コストの按分
      const allocatedCommonCost = totalAmount > 0 ? 
        (commonCosts * currentStoreAmount / totalAmount) : 0;

      // 店舗の商品数で割って1商品あたりの按分後単価
      const itemCount = storePurchaseData?.item_count || 1;
      const allocatedCostPerItem = Math.round((currentStoreAmount + allocatedCommonCost) / itemCount);

      return allocatedCostPerItem;
    } catch (error) {
      console.error('按分後単価計算エラー:', error);
      return productCost;
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 一括入力の場合の価格配分計算
    let finalProductData = { ...productFormData };
    
    // カスタム生産国の場合、フォームデータに追加
    if (showCustomCountryInput && customCountry) {
      finalProductData.production_country = customCountry;
    }
    
    // カスタム色の場合、フォームデータに追加
    if (showCustomColorInput && customColor) {
      finalProductData.color = customColor;
    }
    
    if (priceInputMode === 'batch' && batchPrice > 0) {
      // 現在の商品数を取得して配分計算
      const totalItems = storePurchase?.items_count || 1;
      const pricePerItem = Math.round(batchPrice / totalItems);
      
      finalProductData = {
        ...productFormData,
        purchase_cost: pricePerItem,
        initial_price: Math.round(pricePerItem * 2.5), // 2.5倍マージン
        current_price: Math.round(pricePerItem * 2.5)
      };
    }

    // allocated_cost を計算
    const allocatedCost = await calculateAllocatedCost(storePurchase, finalProductData.purchase_cost || 0);
    finalProductData.allocated_cost = allocatedCost;
    
    try {
      let photoUrl = '';
      
      // 写真をアップロード
      if (selectedPhoto) {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        console.log('アップロード開始:', filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-photos')
          .upload(filePath, selectedPhoto);

        if (uploadError) {
          console.error('アップロードエラー:', uploadError);
          throw uploadError;
        }
        
        console.log('アップロード成功:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('product-photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
        console.log('生成されたURL:', photoUrl);
      }

      if (editingProduct) {
        // 編集の場合
        // 既存の有効な写真URLを保持し、ローカルパスは除外
        const existingValidPhotos = (editingProduct.photos || []).filter(url => 
          url && !url.startsWith('file://') && !url.startsWith('blob:')
        );
        
        const photosToSave = photoUrl ? [photoUrl] : existingValidPhotos;
        console.log('保存する写真URL (編集):', photosToSave);
        
        const updatePayload = {
          ...finalProductData,
          photos: photosToSave,
          status: editingProduct.status || 'in_stock', // ステータスを保持、なければin_stockに設定
          measurements: finalProductData.measurements || null,
          production_country: finalProductData.production_country || null,
          decade: finalProductData.decade || '90s'
        };

        console.log('商品更新データ:', updatePayload);

        const { data: updateData, error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', editingProduct.id)
          .select();

        if (error) {
          console.error('商品更新エラー:', error);
          throw error;
        }
        console.log('更新結果:', updateData);
      } else {
        // 新規作成の場合
        const photosToSave = photoUrl ? [photoUrl] : [];
        console.log('保存する写真URL (新規):', photosToSave);
        
        const insertPayload = {
          ...finalProductData,
          store_purchase_id: storePurchase?.id,
          photos: photosToSave,
          status: 'in_stock',
          measurements: finalProductData.measurements || null,
          production_country: finalProductData.production_country || null,
          decade: finalProductData.decade || '90s'
        };

        console.log('商品挿入データ:', insertPayload);

        const { data: insertData, error } = await supabase
          .from('products')
          .insert([insertPayload])
          .select();

        if (error) {
          console.error('商品挿入エラー:', error);
          throw error;
        }
        console.log('挿入結果:', insertData);
      }
      
      setShowProductForm(false);
      resetForm();
      fetchStorePurchaseDetail();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      alert(`商品の保存に失敗しました: ${errorMessage}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    // カスタム色かどうかを判定
    const isCustomColor = product.color && !basicColors.includes(product.color);
    // カスタムサイズかどうかを判定
    const isCustomSize = product.size && !basicSizes.includes(product.size);
    // カスタム生産国かどうかを判定
    const isCustomCountry = product.production_country && !countries.includes(product.production_country);
    
    setProductFormData({
      name: product.name,
      brand: product.brand || '',
      category: product.category,
      size: isCustomSize ? 'その他' : (product.size || ''),
      color: isCustomColor ? 'その他' : (product.color || ''),
      condition: product.condition,
      gender: product.gender || '',
      purchase_cost: product.purchase_cost,
      initial_price: product.initial_price,
      current_price: product.current_price,
      notes: product.notes || '',
      measurements: product.measurements || {},
      production_country: product.production_country || '',
      decade: product.decade || '90s',
      asset_type: product.asset_type || 'quick_turn'
    });
    
    // カスタム色の場合はcustomColorに実際の色を設定
    setCustomColor(isCustomColor ? product.color : '');
    setShowCustomColorInput(isCustomColor);
    // カスタムサイズの場合はcustomSizeに実際のサイズを設定
    setCustomSize(isCustomSize ? product.size : '');
    setShowCustomSizeInput(isCustomSize);
    // カスタム生産国の場合はcustomCountryに実際の生産国を設定
    setCustomCountry(isCustomCountry ? product.production_country : '');
    setShowCustomCountryInput(isCustomCountry);
    // 有効な画像URLのみプレビューに設定（ローカルパスは除外）
    if (product.photos && product.photos.length > 0) {
      const validPhoto = product.photos.find(url => 
        url && !url.startsWith('file://') && !url.startsWith('blob:')
      );
      if (validPhoto) {
        setPhotoPreview(validPhoto);
      } else {
        setPhotoPreview('');
      }
    } else {
      setPhotoPreview('');
    }
    setSelectedPhoto(null); // 編集開始時は新しい写真は選択されていない
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('この商品を削除しますか？')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      fetchStorePurchaseDetail();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
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

  const getConditionLabel = (condition: string) => {
    const labels: { [key: string]: string } = {
      'new': '新品',
      'used_like_new': '未使用に近い',
      'used_good': '目立った傷や汚れなし',
      'used_fair': 'やや傷や汚れあり',
      'used_poor': '傷や汚れあり',
      'junk': 'ジャンク品'
    };
    return labels[condition] || condition;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'in_stock': '在庫',
      'ready_to_list': '出品準備完了',
      'listed': '出品中',
      'sold': '売却済み',
      'on_hold': '保留',
      'discarded': '破棄'
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; className: string } } = {
      'in_stock': { label: '在庫', className: 'bg-gray-100 text-gray-700' },
      'ready_to_list': { label: '出品準備完了', className: 'bg-blue-100 text-blue-700' },
      'listed': { label: '出品中', className: 'bg-green-100 text-green-700' },
      'sold': { label: '売却済み', className: 'bg-purple-100 text-purple-700' },
      'on_hold': { label: '保留', className: 'bg-yellow-100 text-yellow-700' },
      'discarded': { label: '破棄', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || statusConfig['in_stock'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!storePurchase || !store) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">店舗仕入れが見つかりません</div>
      </div>
    );
  }

  const totalAmount = ((storePurchase as any).product_amount || 0) + ((storePurchase as any).shipping_cost || 0) + ((storePurchase as any).commission_fee || 0);
  
  // 価格入力モードに応じて登録済金額を計算
  const registeredCost = priceInputMode === 'batch'
    ? storePurchase.item_count > 0 
      ? Math.round((totalAmount / storePurchase.item_count) * products.length)
      : 0
    : products.reduce((sum, p) => sum + p.purchase_cost, 0);
  
  const remainingCost = totalAmount - registeredCost;
  const remainingItems = storePurchase.item_count - products.length;

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <Link
          to="/purchases"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft size={20} />
          <span>セッション一覧に戻る</span>
        </Link>
        
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                {store.name}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {store.type === 'online' ? 'オンライン' : 
                   store.type === 'recycle' ? 'リサイクル' : 
                   store.type === 'wholesale' ? '卸問屋' : 'その他'}
                </span>
                {store.prefecture && (
                  <span className="text-sm">{store.prefecture}</span>
                )}
                <span className="text-sm">{format(new Date(storePurchase.purchase_date), 'yyyy年MM月dd日')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Package className="text-white" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{products.length}/{storePurchase.item_count}</div>
                  <div className="text-sm text-gray-600">登録済み商品</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Calculator className="text-white" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">¥{registeredCost.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">登録済み金額</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <Info className="text-white" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">¥{remainingCost.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">残り金額</div>
                </div>
              </div>
            </div>
          </div>

          {storePurchase.payment_notes && (
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">支払いメモ</div>
              <div className="text-gray-800">{storePurchase.payment_notes}</div>
            </div>
          )}

          {/* 価格入力モード表示 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-sm text-gray-600 mb-2">商品価格設定モード</div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                priceInputMode === 'batch' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {priceInputMode === 'batch' ? '一括入力' : '個別入力'}
              </div>
              <span className="text-xs text-gray-500">
                {priceInputMode === 'batch' 
                  ? '総額を商品数で均等配分' 
                  : '商品ごとに個別価格入力'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ※ 価格入力方法は店舗登録時に設定されます
            </p>
          </div>
        </div>
      </div>

      {/* ステータスタブとボタン */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            商品一覧
          </h2>
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Plus size={20} />
            <span>商品追加</span>
          </button>
        </div>

        {/* ステータスフィルタータブ */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            全て ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_stock')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'in_stock'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            登録中 ({products.filter(p => p.status === 'in_stock').length})
          </button>
          <button
            onClick={() => setStatusFilter('listed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'listed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            出品中 ({products.filter(p => p.status === 'listed').length})
          </button>
          <button
            onClick={() => setStatusFilter('sold')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'sold'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            売約済 ({products.filter(p => p.status === 'sold').length})
          </button>
        </div>
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8 animate-fade-in">
            <h3 className="text-xl font-semibold mb-4">
              {editingProduct ? '商品編集' : '商品登録'}
            </h3>
            <form onSubmit={handleProductSubmit}>
              {/* 写真アップロード */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品写真
                  {editingProduct && photoPreview && !selectedPhoto && (
                    <span className="ml-2 text-xs text-gray-500">（現在の画像）</span>
                  )}
                  {selectedPhoto && (
                    <span className="ml-2 text-xs text-blue-600">
                      （新しい画像: {formatFileSize(selectedPhoto.size)}）
                    </span>
                  )}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  JPEG、PNG、WebP、HEIC形式対応。大きな画像は自動的に200KB程度にリサイズされます。
                </p>
                <div className="flex items-start space-x-4">
                  {photoPreview && (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="商品写真" className="w-32 h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-xs text-gray-500 text-center">
                        {photoPreview ? '変更' : '選択'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名 *
                  </label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ブランド
                  </label>
                  <input
                    type="text"
                    value={productFormData.brand}
                    onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サイズ
                  </label>
                  <select
                    value={showCustomSizeInput ? 'その他' : productFormData.size}
                    onChange={(e) => {
                      if (e.target.value === 'その他') {
                        setShowCustomSizeInput(true);
                        setProductFormData({ ...productFormData, size: customSize });
                      } else {
                        setShowCustomSizeInput(false);
                        setProductFormData({ ...productFormData, size: e.target.value });
                        setCustomSize('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">サイズを選択してください</option>
                    {basicSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {showCustomSizeInput && (
                    <input
                      type="text"
                      value={customSize}
                      onChange={(e) => {
                        setCustomSize(e.target.value);
                        setProductFormData({ ...productFormData, size: e.target.value });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="サイズを入力"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    色
                  </label>
                  <select
                    value={productFormData.color === '' ? '' : (basicColors.includes(productFormData.color) ? productFormData.color : 'その他')}
                    onChange={(e) => {
                      if (e.target.value === 'その他') {
                        setShowCustomColorInput(true);
                        setProductFormData({ ...productFormData, color: customColor || '' });
                      } else {
                        setShowCustomColorInput(false);
                        setProductFormData({ ...productFormData, color: e.target.value });
                        setCustomColor('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">色を選択してください</option>
                    {basicColors.slice(0, -1).map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                    <option value="その他">その他</option>
                  </select>
                  {showCustomColorInput && (
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="カスタム色を入力"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生産国
                  </label>
                  <select
                    value={showCustomCountryInput ? 'Other' : (productFormData.production_country || '')}
                    onChange={(e) => {
                      if (e.target.value === 'Other') {
                        setShowCustomCountryInput(true);
                        setProductFormData({ ...productFormData, production_country: customCountry });
                      } else {
                        setShowCustomCountryInput(false);
                        setProductFormData({ ...productFormData, production_country: e.target.value });
                        setCustomCountry('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">生産国を選択してください</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {showCustomCountryInput && (
                    <input
                      type="text"
                      value={customCountry}
                      onChange={(e) => {
                        setCustomCountry(e.target.value);
                      }}
                      placeholder="生産国を入力"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年代
                  </label>
                  <select
                    value={productFormData.decade || '90s'}
                    onChange={(e) => setProductFormData({ ...productFormData, decade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {decades.map(decade => (
                      <option key={decade} value={decade}>{decade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品タイプ
                  </label>
                  <select
                    value={productFormData.asset_type}
                    onChange={(e) => setProductFormData({ ...productFormData, asset_type: e.target.value as 'asset' | 'quick_turn' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="quick_turn">回転型商品 (Quick Turn)</option>
                    <option value="asset">資産型商品 (Asset)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    回転型：早期売却重視 / 資産型：長期保有OK
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    状態
                  </label>
                  <select
                    value={productFormData.condition}
                    onChange={(e) => setProductFormData({ ...productFormData, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="new">新品</option>
                    <option value="used_like_new">未使用に近い</option>
                    <option value="used_good">目立った傷や汚れなし</option>
                    <option value="used_fair">やや傷や汚れあり</option>
                    <option value="used_poor">傷や汚れあり</option>
                    <option value="junk">ジャンク品</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別
                  </label>
                  <select
                    value={productFormData.gender}
                    onChange={(e) => setProductFormData({ ...productFormData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">指定なし</option>
                    <option value="men">メンズ</option>
                    <option value="women">レディース</option>
                    <option value="unisex">ユニセックス</option>
                    <option value="kids">キッズ</option>
                  </select>
                </div>


                {/* 仕入価格入力（個別入力時のみ） */}
                {priceInputMode === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      仕入価格（個別）
                    </label>
                    <input
                      type="number"
                      value={productFormData.purchase_cost}
                      onChange={(e) => setProductFormData({ ...productFormData, purchase_cost: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      placeholder="0"
                    />
                  </div>
                )}

                {/* 按分価格表示（一括入力時） */}
                {priceInputMode === 'batch' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <Calculator className="mr-2 text-blue-600" size={16} />
                      <span className="text-sm font-medium text-blue-800">按分価格が自動計算されます</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      店舗の仕入れ総額から商品数で按分した価格が仕入価格として設定されます
                    </div>
                  </div>
                )}


                {/* 採寸情報 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    採寸情報
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {measurementFields[productFormData.category as keyof typeof measurementFields]?.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {field.label} (cm)
                        </label>
                        <input
                          type="number"
                          value={productFormData.measurements[field.key] || ''}
                          onChange={(e) => setProductFormData({
                            ...productFormData,
                            measurements: {
                              ...productFormData.measurements,
                              [field.key]: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="0"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メモ
                  </label>
                  <textarea
                    value={productFormData.notes}
                    onChange={(e) => setProductFormData({ ...productFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="内部用のメモや注意事項..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  {editingProduct ? '更新' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 簡素化された商品リスト */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {(() => {
          const filteredProducts = statusFilter === 'all'
            ? products
            : products.filter(p => p.status === statusFilter);

          if (filteredProducts.length === 0) {
            return (
              <div className="p-8 text-center text-gray-500">
                <Package className="mx-auto mb-4 text-gray-400" size={48} />
                <p>
                  {statusFilter === 'all'
                    ? 'まだ商品が登録されていません'
                    : `${statusFilter === 'in_stock' ? '登録中' : statusFilter === 'listed' ? '出品中' : '売約済'}の商品がありません`
                  }
                </p>
              </div>
            );
          }

          return (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center space-x-4">
                    {/* 商品写真 */}
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.photos && product.photos.length > 0 && product.photos[0] && !product.photos[0].startsWith('file://') ? (
                        <img
                          src={product.photos[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Camera className="text-gray-400" size={24} />
                      )}
                    </div>

                    {/* 商品情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {product.brand && (
                              <span className="text-sm text-gray-500">{product.brand}</span>
                            )}
                            <span className="text-sm text-gray-400">・</span>
                            <span className="text-sm text-gray-500">{getCategoryLabel(product.category)}</span>
                            {product.size && (
                              <>
                                <span className="text-sm text-gray-400">・</span>
                                <span className="text-sm text-gray-500">{product.size}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            {getStatusBadge(product.status)}
                            <span className="text-sm font-medium text-green-600">¥{product.purchase_cost.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                            title="詳細表示"
                          >
                            <Shirt size={16} />
                          </Link>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.status === 'sold'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                            }`}
                            title="編集"
                            disabled={product.status === 'sold'}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.status === 'sold'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                            }`}
                            title="削除"
                            disabled={product.status === 'sold'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {remainingItems > 0 && (
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <Info className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-800">登録未完了</h3>
              <p className="text-sm text-yellow-700">
                あと{remainingItems}個の商品と¥{remainingCost.toLocaleString()}の登録が必要です
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePurchaseDetail;