import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Store,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'ホーム', color: 'from-blue-500 to-cyan-500' },
    { path: '/products', icon: Package, label: '商品管理', color: 'from-purple-500 to-pink-500' },
    { path: '/purchases', icon: ShoppingCart, label: '仕入管理', color: 'from-green-500 to-emerald-500' },
    { path: '/stores', icon: Store, label: '店舗マスタ', color: 'from-orange-500 to-red-500' },
    { path: '/listing', icon: FileText, label: '出品準備', color: 'from-indigo-500 to-purple-500' },
    { path: '/sales', icon: DollarSign, label: '出品管理', color: 'from-yellow-500 to-orange-500' },
    { path: '/analytics', icon: BarChart3, label: '分析', color: 'from-cyan-500 to-blue-500' },
    { path: '/settings', icon: Settings, label: '設定', color: 'from-gray-600 to-gray-800' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <aside
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-white/80 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200/50`}
      >
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'justify-center'}`}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              {isSidebarOpen && (
                <div className="animate-fade-in">
                  <h1 className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    MercariKit
                  </h1>
                  <p className="text-xs text-gray-500">販売管理システム</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
            >
              {isSidebarOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${isSidebarOpen ? 'px-4' : 'px-3 justify-center'} py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                      active
                        ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                    <Icon
                      size={22}
                      className={`${
                        active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                      } z-10 ${!isSidebarOpen && 'mx-auto'}`}
                    />
                    {isSidebarOpen && (
                      <>
                        <span
                          className={`ml-3 font-medium z-10 ${
                            active ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {item.label}
                        </span>
                        {active && (
                          <ChevronRight className="ml-auto text-white/80" size={18} />
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200/50">
          {isSidebarOpen ? (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">システム稼働中</span>
              </div>
              <p className="text-xs text-gray-600">Version 2.7.0</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;