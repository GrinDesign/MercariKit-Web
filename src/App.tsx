import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductStores from './pages/ProductStores';
import ProductsByStore from './pages/ProductsByStore';
import ProductsLegacy from './pages/ProductsLegacy';
import ProductDetail from './pages/ProductDetail';
import ProductEdit from './pages/ProductEdit';
import PurchasesNew from './pages/PurchasesNew';
// import Purchases from './pages/Purchases'; // 旧バージョン
import StorePurchaseDetail from './pages/StorePurchaseDetail';
import StorePurchaseNew from './pages/StorePurchaseNew';
import StorePurchaseEdit from './pages/StorePurchaseEdit';
import ListingManagement from './pages/ListingManagement';
import SalesManagement from './pages/SalesManagement';
import Stores from './pages/Stores';
import StoreAnalysis from './pages/StoreAnalysis';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import CleanupPhotos from './pages/CleanupPhotos';
import TestStorage from './pages/TestStorage';
import CreateBucket from './pages/CreateBucket';
import CheckBucket from './pages/CheckBucket';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/all" element={<ProductsLegacy />} />
          <Route path="products/session/:sessionId" element={<ProductStores />} />
          <Route path="products/session/:sessionId/store/:storeId" element={<ProductsByStore />} />
          <Route path="products/:productId" element={<ProductDetail />} />
          <Route path="products/:productId/edit" element={<ProductEdit />} />
          <Route path="purchases" element={<PurchasesNew />} />
          <Route path="purchases/:sessionId/stores/new" element={<StorePurchaseNew />} />
          <Route path="purchases/:sessionId/stores/:purchaseId/edit" element={<StorePurchaseEdit />} />
          <Route path="purchases/:sessionId/stores/:storeId" element={<StorePurchaseDetail />} />
          <Route path="stores" element={<Stores />} />
          <Route path="stores/:storeId" element={<StoreAnalysis />} />
          <Route path="listing" element={<ListingManagement />} />
          <Route path="sales" element={<SalesManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<div className="p-8"><h1 className="text-3xl font-bold">設定</h1></div>} />
          <Route path="cleanup" element={<CleanupPhotos />} />
          <Route path="test-storage" element={<TestStorage />} />
          <Route path="create-bucket" element={<CreateBucket />} />
          <Route path="check-bucket" element={<CheckBucket />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
