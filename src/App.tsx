import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import PurchaseDetail from './pages/PurchaseDetail';
import StorePurchaseDetail from './pages/StorePurchaseDetail';
import ListingManagement from './pages/ListingManagement';
import SalesManagement from './pages/SalesManagement';
import Stores from './pages/Stores';
import Analytics from './pages/Analytics';
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
          <Route path="purchases" element={<Purchases />} />
          <Route path="purchases/:sessionId" element={<PurchaseDetail />} />
          <Route path="purchases/:sessionId/stores/:storeId" element={<StorePurchaseDetail />} />
          <Route path="stores" element={<Stores />} />
          <Route path="listing" element={<ListingManagement />} />
          <Route path="sales" element={<SalesManagement />} />
          <Route path="analytics" element={<Analytics />} />
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
