import { useLocation, useParams } from 'react-router-dom';

export interface NavigationInfo {
  backPath: string;
  backLabel: string;
  currentLevel: 'home' | 'session' | 'store' | 'product' | 'productDetail' | 'productEdit';
}

export const useHierarchicalNavigation = (): NavigationInfo => {
  const location = useLocation();
  const params = useParams();
  const path = location.pathname;

  // 編集画面
  if (path.includes('/products/') && path.includes('/edit')) {
    const productId = params.productId;
    return {
      backPath: `/products/${productId}`,
      backLabel: '商品詳細に戻る',
      currentLevel: 'productEdit'
    };
  }

  // 商品詳細画面
  if (path.match(/^\/products\/[^\/]+$/) && params.productId) {
    // URLから前のページを判断する必要があるが、デフォルトは商品一覧
    // sessionStorageで前のページを保存する方法も検討
    const previousPath = sessionStorage.getItem('previousProductListPath');
    if (previousPath) {
      return {
        backPath: previousPath,
        backLabel: '商品一覧に戻る',
        currentLevel: 'productDetail'
      };
    }
    return {
      backPath: '/products',
      backLabel: '商品一覧に戻る',
      currentLevel: 'productDetail'
    };
  }

  // 店舗別商品一覧
  if (path.includes('/products/session/') && path.includes('/store/')) {
    const sessionId = params.sessionId;
    return {
      backPath: `/products/session/${sessionId}`,
      backLabel: '店舗一覧に戻る',
      currentLevel: 'product'
    };
  }

  // 店舗一覧（セッション内）
  if (path.includes('/products/session/') && !path.includes('/store/')) {
    return {
      backPath: '/products',
      backLabel: 'セッション一覧に戻る',
      currentLevel: 'store'
    };
  }

  // 全商品一覧
  if (path === '/products/all') {
    return {
      backPath: '/products',
      backLabel: 'セッション一覧に戻る',
      currentLevel: 'product'
    };
  }

  // セッション一覧（商品管理トップ）
  if (path === '/products') {
    return {
      backPath: '/',
      backLabel: 'ホームに戻る',
      currentLevel: 'session'
    };
  }

  // デフォルト（ホームまたは他のページ）
  return {
    backPath: '/',
    backLabel: 'ホームに戻る',
    currentLevel: 'home'
  };
};