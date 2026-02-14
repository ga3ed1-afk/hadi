
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './components/AdminDashboard';
import ProductDetailView from './components/ProductDetailView';
import WholesaleView from './components/WholesaleView';
import Hero from './components/Hero';
import { Product, CartItem, Order, KonnectSettings } from './types';
import { APP_NAME } from './constants';
import { dbService } from './services/dbService';
import { 
  Sparkles, Layout, ChevronLeft, Loader2, CheckCircle2, Settings, ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'shop' | 'admin' | 'product-detail' | 'wholesale'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [konnectSettings] = useState<KonnectSettings>({ 
    apiKey: '', wallets: [], activeWalletId: '', mode: 'sandbox', enabledMethods: { bankCard: true, edinar: true }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const [p, o, c] = await Promise.all([
        dbService.getProducts(),
        dbService.getOrders(),
        dbService.getCategories()
      ]);
      setProducts(p);
      setOrders(o);
      setCategories(c);
      setIsLoading(false);
    };
    initData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      dbService.saveProducts(products);
      dbService.saveOrders(orders);
      dbService.saveCategories(categories);
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [products, orders, categories, cartItems, isLoading]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "الكل" || product.category === selectedCategory;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product, openDrawer: boolean = false) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      setShowToast(product.title);
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setView('product-detail');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white" dir="rtl">
        <Loader2 className="w-16 h-16 text-[#f68b1e] animate-spin mb-6" />
        <p className="font-black text-gray-500 text-xl uppercase tracking-widest animate-pulse">{APP_NAME} - جاري التحميل</p>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <AdminDashboard 
        products={products} setProducts={setProducts}
        categories={categories} setCategories={setCategories}
        orders={orders} setOrders={setOrders}
        onBackToShop={() => setView('shop')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col antialiased" dir="rtl">
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        onSearch={setSearchQuery}
        onWholesaleClick={() => setView('wholesale')}
        onHomeClick={() => setView('shop')}
        currentView={view}
      />
      
      <main className="flex-grow py-4 md:py-10">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          {view === 'wholesale' ? (
             <WholesaleView 
                products={products} 
                onAddToCart={addToCart} 
                onViewDetail={handleViewDetail} 
             />
          ) : view === 'product-detail' && selectedProduct ? (
             <ProductDetailView 
                product={selectedProduct} onBack={() => setView('shop')}
                onAddToCart={(p) => addToCart(p)} onBuyNow={(p) => { addToCart(p, true); }}
             />
          ) : (
            <div className="space-y-10">
              {/* Hero (Banners) will only show when "All" is selected */}
              <Hero 
                categories={categories} 
                selectedCategory={selectedCategory} 
                onCategorySelect={setSelectedCategory} 
              />
              
              <div className="flex flex-col gap-10">
                <div className="flex-1 min-w-0">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-4">
                        {selectedCategory !== "الكل" && (
                          <button 
                            onClick={() => setSelectedCategory("الكل")}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-sm transition-all"
                          >
                            <ArrowRight size={18} />
                            <span>رجوع</span>
                          </button>
                        )}
                        <h2 className="font-black text-gray-900 flex items-center gap-3 text-2xl uppercase tracking-tight">
                           <Sparkles size={28} className="text-[#f68b1e]" />
                           {selectedCategory === 'الكل' ? 'أحدث العروض الحصرية' : selectedCategory}
                        </h2>
                      </div>
                      <span className="text-sm font-black text-gray-400 uppercase bg-gray-50 px-4 py-2 rounded-xl">{filteredProducts.length} منتج</span>
                    </div>

                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                        {filteredProducts.map((product) => (
                          <ProductCard 
                            key={product.id} product={product} 
                            onAddToCart={(p) => addToCart(p)} 
                            onViewDetail={handleViewDetail}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-40 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                          <p className="text-xl font-black text-gray-300 italic uppercase tracking-widest">لا توجد منتجات حالياً في هذا القسم</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-16 mt-20">
         <div className="max-w-[1440px] mx-auto px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-right">
               <span className="text-4xl font-black text-[#f68b1e] uppercase tracking-tighter">{APP_NAME}</span>
               <p className="text-sm text-gray-400 font-black mt-3 tracking-[0.2em] uppercase">منصة التسوق الرقمي الأولى في تونس</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={() => setView('admin')}
                className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-black transition-all shadow-2xl active:scale-95 border border-white/10"
              >
                <Settings size={24} />
                <span>لوحة تحكم التاجر</span>
              </button>
            </div>
         </div>
         <div className="max-w-[1440px] mx-auto px-8 mt-12 pt-12 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-300 font-black uppercase tracking-widest">© 2024 جميع الحقوق محفوظة لمتجر جين - تصميم ذكي واحترافي</p>
         </div>
      </footer>

      {showToast && (
        <div className="fixed bottom-10 right-10 left-10 md:left-auto md:w-96 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl z-[60] flex items-center gap-4 animate-in slide-in-from-bottom-10 border border-white/10">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
             <CheckCircle2 size={28} className="text-green-500" />
          </div>
          <p className="text-base font-black truncate">تمت إضافة المنتج بنجاح إلى السلة</p>
        </div>
      )}

      <CartDrawer 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        onUpdateQuantity={(id, delta) => {
           setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
        }}
        onRemoveItem={(id) => setCartItems(prev => prev.filter(i => i.id !== id))}
        onClearCart={() => setCartItems([])}
        onAddOrder={(o) => setOrders(prev => [o, ...prev])}
        konnectSettings={konnectSettings}
      />
    </div>
  );
};

export default App;