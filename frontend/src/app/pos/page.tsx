'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ROLE_DEFAULT_ROUTES, useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { 
  Coffee, ShoppingCart, Trash2, Plus, Minus, Check, 
  Search, Tag, User, DollarSign,
  Receipt, CheckCircle, Store, LogOut, LayoutDashboard,
  Menu, Calculator, ChefHat, History, X, ChevronRight,
  Edit3, MessageSquare, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import {
  addVnd,
  formatVnd,
  multiplyVnd,
  parseVnd,
  percentageOfVnd,
} from '@/lib/money';
import type { components } from '@/lib/api-contract.generated';

type CreateOrderRequest = components['schemas']['CreateOrderDto'];
type CheckoutRequest = components['schemas']['CheckoutDto'];
type OrderResponse = components['schemas']['OrderResponseDto'];
type ProductSize = components['schemas']['ProductSizeResponseDto'];
type Product = components['schemas']['ProductResponseDto'];
type MenuResponse = components['schemas']['MenuResponseDto'];
type CategoryResponse = components['schemas']['CategoryResponseDto'];

interface CartItem {
  cartId: string;
  product: Product;
  size: ProductSize | null;
  qty: number;
  unitPrice: number;
  ice: number;
  sugar: number;
  selectedToppings: Product[];
  note: string;
}

type CheckoutReceiptView = OrderResponse & {
  cartItems: CartItem[];
  discountAmount: number;
  finalTotal: number;
  customer?: unknown;
  branch?: { name?: string };
};

export default function PosPage() {
  const { user, logout } = useAuth();
  const workspaceHref = user ? ROLE_DEFAULT_ROUTES[user.role] : '/login';
  const hasSeparateWorkspace = workspaceHref !== '/pos';
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [showSideMenu, setShowSideMenu] = useState<boolean>(false);

  // Checkout Success Modal
  const [checkedOutOrder, setCheckedOutOrder] = useState<CheckoutReceiptView | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH'>('CASH');
  const checkoutAttemptRef = useRef<{
    fingerprint: string;
    key: string;
    orderId?: string;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Kiểm tra loại bỏ bánh ngọt & tráng miệng khỏi quầy POS
  const isCake = (p: Product) => {
    const type = p.type?.toLowerCase() || '';
    const name = p.name?.toLowerCase() || '';
    const sku = p.sku?.toLowerCase() || '';
    const catName = p.category?.name?.toLowerCase() || '';
    return (
      type.includes('cake') ||
      name.includes('bánh') ||
      name.includes('tart') ||
      name.includes('croissant') ||
      name.includes('mousse') ||
      name.includes('tiramisu') ||
      name.includes('su kem') ||
      name.includes('red velvet') ||
      sku.startsWith('cake') ||
      catName.includes('bánh') ||
      catName.includes('tráng miệng')
    );
  };

  const loadInitialData = async () => {
    try {
      // 1. Categories (loại bỏ danh mục bánh & tráng miệng)
      const catRes = await api.get<CategoryResponse[]>('/categories');
      const validCats = (catRes.data || []).filter((c) => {
        const name = c.name?.toLowerCase() || '';
        return (
          !name.includes('bánh') && 
          !name.includes('tráng miệng') && 
          !name.includes('cake') && 
          !name.includes('dessert')
        );
      });
      setCategories(validCats);

      // 2. Menu (lọc chỉ lấy đồ uống & topping, loại bỏ bánh)
      const menuRes = await api.get<MenuResponse>('/products/menu');
      const menuData = menuRes.data;

      setProducts(menuData.drinks.filter((product) => !isCake(product)));
      setToppings(menuData.toppings);

      // 3. Branches
      const branchRes = await api.get('/branches');
      setBranches(branchRes.data);
      if (branchRes.data.length > 0) {
        setSelectedBranchId(user?.branchId || branchRes.data[0].id);
      }

      // 4. Promotions
      const promoRes = await api.get('/promotions/active');
      setActivePromos(
        (promoRes.data || []).filter(
          (promotion: { type?: string }) =>
            promotion.type === 'PERCENTAGE' || promotion.type === 'FIXED_AMOUNT',
        ),
      );
    } catch (err) {
      console.error('Lỗi nạp dữ liệu POS:', err);
    }
  };

  // KHI CHỌN SẢN PHẨM:
  // - Nếu đã có trong order: mở thẳng chính món đó ra để sửa/chọn thêm, không cuộn đi cuộn lại!
  // - Nếu chưa có: đưa lên đầu order để thấy ngay trước mắt!
  const handleSelectProduct = (product: Product) => {
    const existingItemIndex = cart.findIndex((i) => i.product.id === product.id);

    if (existingItemIndex > -1) {
      const targetCartId = cart[existingItemIndex].cartId;
      setEditingCartId(targetCartId);
      setTimeout(() => {
        document.getElementById(`cart-item-${targetCartId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    } else {
      const defaultSize = product.sizes?.find((s) => s.name === 'M') || product.sizes?.[0] || null;
      const baseP = parseVnd(product.basePrice);
      const sizeP = defaultSize ? parseVnd(defaultSize.priceAdj) : 0;
      const unitPrice = addVnd(baseP, sizeP);

      const newCartId = `item-${crypto.randomUUID()}`;
      const newItem: CartItem = {
        cartId: newCartId,
        product,
        size: defaultSize,
        qty: 1,
        unitPrice,
        ice: 100,
        sugar: 100,
        selectedToppings: [],
        note: '',
      };

      // Đưa lên đầu danh sách để thu ngân thấy ngay món đang chọn không cần cuộn!
      setCart((prev) => [newItem, ...prev]);
      setEditingCartId(newCartId);

      setTimeout(() => {
        document.getElementById(`cart-item-${newCartId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    }
  };

  // Cập nhật thuộc tính của món trong giỏ hàng (Size, Đường, Đá, Topping, Ghi chú)
  const updateCartItem = (cartId: string, updater: (item: CartItem) => Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const changes = updater(item);
        const updated = { ...item, ...changes };

        const baseP = parseVnd(updated.product.basePrice);
        const sizeP = updated.size ? parseVnd(updated.size.priceAdj) : 0;
        const toppingTotal = addVnd(
          ...updated.selectedToppings.map((t) => parseVnd(t.basePrice)),
        );
        updated.unitPrice = addVnd(baseP, sizeP, toppingTotal);

        return updated;
      })
    );
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
    if (editingCartId === cartId) {
      setEditingCartId(null);
    }
  };

  const lookupCustomer = async () => {
    if (!customerPhone || customerPhone.trim().length < 9) return;
    try {
      const res = await api.post('/customers/lookup', { phone: customerPhone.trim() });
      setCustomerInfo(res.data);
    } catch {
      setCustomerInfo(null);
      alert('Chưa có thông tin hội viên cho SĐT này. Hệ thống sẽ tự tạo mới khi thanh toán.');
    }
  };

  // Tính tiền
  const subtotal = addVnd(
    ...cart.map((item) => multiplyVnd(item.unitPrice, item.qty)),
  );

  let discountAmount = 0;
  if (selectedPromo) {
    if (selectedPromo.type === 'PERCENTAGE') {
      discountAmount = percentageOfVnd(subtotal, selectedPromo.value);
      if (selectedPromo.maxDiscount && discountAmount > parseVnd(selectedPromo.maxDiscount)) {
        discountAmount = parseVnd(selectedPromo.maxDiscount);
      }
    } else if (selectedPromo.type === 'FIXED_AMOUNT') {
      discountAmount = parseVnd(selectedPromo.value);
    }
  }

  discountAmount = Math.min(discountAmount, subtotal);
  const finalTotal = Math.max(0, addVnd(subtotal, -discountAmount));
  const totalItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  // Thanh toán
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      const itemsPayload: CreateOrderRequest['items'] = cart.map((item) => ({
        productId: item.product.id,
        sizeId: item.size?.id,
        qty: item.qty,
        attributes: {
          ice: item.ice,
          sugar: item.sugar,
          toppings: item.selectedToppings.map((t) => t.id),
          note: item.note ? item.note.trim() : undefined,
        },
      }));

      const notesList = cart.filter((i) => i.note).map((i) => `${i.product.name}: ${i.note}`);
      const overallNote = notesList.length > 0 
        ? notesList.join(' | ') 
        : `Đơn bán hàng tại quầy (${paymentMethod})`;

      const orderPayload: CreateOrderRequest = {
        branchId: selectedBranchId,
        customerId: customerInfo?.id,
        promotionId: selectedPromo?.id,
        items: itemsPayload,
        note: overallNote,
      };
      const fingerprint = JSON.stringify(orderPayload);
      let attempt = checkoutAttemptRef.current;
      if (!attempt || attempt.fingerprint !== fingerprint) {
        attempt = {
          fingerprint,
          key: crypto.randomUUID(),
        };
        checkoutAttemptRef.current = attempt;
      }

      if (!attempt.orderId) {
        const createOrderRes = await api.post<OrderResponse>('/pos/orders', orderPayload, {
          headers: { 'Idempotency-Key': attempt.key },
        });
        attempt.orderId = createOrderRes.data.id;
      }

      const checkoutPayload: CheckoutRequest = {
        paymentMethod,
        amountPaid: finalTotal,
      };
      const checkoutRes = await api.post<OrderResponse>(
        `/pos/orders/${attempt.orderId}/checkout`,
        checkoutPayload,
        { headers: { 'Idempotency-Key': attempt.key } },
      );

      setCheckedOutOrder({
        ...checkoutRes.data,
        cartItems: [...cart],
        subtotal,
        discountAmount,
        finalTotal,
        customer: customerInfo,
        branch: branches.find((b) => b.id === selectedBranchId),
      });

      setCart([]);
      setEditingCartId(null);
      setSelectedPromo(null);
      setCustomerInfo(null);
      setCustomerPhone('');
      checkoutAttemptRef.current = null;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thanh toán thất bại, vui lòng kiểm tra lại!');
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (isCake(p)) return false;
    const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-screen w-full flex flex-col bg-teap-cream text-slate-900 select-none overflow-hidden font-sans">
      {/* Top POS Header */}
      <header className="min-h-14 bg-teap-dark text-white px-3 sm:px-4 py-2 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Menu Drawer Button (3 sọc) */}
          <button
            type="button"
            onClick={() => setShowSideMenu(true)}
            className="p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 cursor-pointer"
            aria-label="Mở menu chức năng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* POS Title */}
          <div className="flex items-center gap-2 font-bold tracking-tight text-white text-base">
            <Coffee className="w-5 h-5 text-emerald-400" />
            <span>MÁY POS</span>
          </div>

          <div className="h-4 w-px bg-emerald-800 mx-1 hidden sm:block"></div>

          {/* Chi nhánh */}
          <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/80 text-xs">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">Chi nhánh:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="text-slate-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 text-xs">

          {hasSeparateWorkspace && (
            <Link
              href={workspaceHref}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 transition border border-emerald-700/50"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Trang làm việc</span>
            </Link>
          )}

          <div className="text-right pl-2 hidden sm:block">
            <div className="font-semibold text-white leading-tight">MÁY POS #01</div>
            <div className="text-emerald-400 text-[11px] leading-tight">{user?.fullName || user?.email}</div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition cursor-pointer"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Side Menu Drawer (3 sọc) */}
      {showSideMenu && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Đóng menu chức năng"
            onClick={() => setShowSideMenu(false)}
            className="fixed inset-0 bg-slate-950/60 transition-opacity"
          />

          <div className="relative w-80 bg-white text-slate-800 flex flex-col h-full shadow-2xl z-10 border-r border-slate-200 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F2E22] text-emerald-400 flex items-center justify-center font-bold">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Menu chức năng</h3>
                  <p className="text-[11px] text-slate-500">Thao tác nhanh cho ca trực</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSideMenu(false)}
                aria-label="Đóng menu chức năng"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
              <button
                type="button"
                disabled
                title="Chờ hoàn tất SHIFT-01 và FIN-01"
                className="flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-700">Bàn giao & kết ca</div>
                    <div className="text-[11px] text-slate-500">Chưa khả dụng · Roadmap SHIFT-01</div>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Sắp tới</span>
              </button>

              <button
                type="button"
                disabled
                title="Chờ hoàn tất KDS-01"
                className="flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-700">Hàng đợi bar & bếp</div>
                    <div className="text-[11px] text-slate-500">Chưa khả dụng · Roadmap KDS-01</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">KDS</span>
              </button>

              <Link
                href="/order-history"
                onClick={() => setShowSideMenu(false)}
                className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">Lịch sử hóa đơn</div>
                    <div className="text-[11px] text-slate-500">Tra cứu và xem chi tiết đơn thật</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </Link>

              {hasSeparateWorkspace && (
                <Link
                  href={workspaceHref}
                  onClick={() => setShowSideMenu(false)}
                  className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Về trang làm việc</div>
                      <div className="text-[11px] text-slate-500">Đúng cổng nghiệp vụ của tài khoản hiện tại</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                </Link>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400 text-center bg-slate-50">
              TeaP POS &bull; Vận hành quầy bán hàng
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace (Chia đôi 5/5: 50% Sản phẩm, 50% Order) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* CỘT TRÁI (50%): PHÂN LOẠI CUỘN DỌC + GRID SẢN PHẨM */}
        <div className="w-full md:w-1/2 min-h-[52vh] md:min-h-0 flex flex-row overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 bg-teap-cream">
          {/* 1. Thanh phân loại cuộn dọc (Vertical Category Sidebar) */}
          <div className="w-24 sm:w-32 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
            <div className="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center bg-slate-50/50">
              Danh mục
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-teap-dark text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  activeCategory === 'all' ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-teap-dark text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate pr-1">{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      activeCategory === cat.id ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ô tìm kiếm & Lưới sản phẩm đồ uống */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            {/* Search Input */}
            <div className="relative mb-2.5 flex-shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món, mã SKU..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-700 placeholder-slate-400 shadow-xs"
              />
            </div>

            {/* Product Items Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Coffee className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                  <p>Không tìm thấy món phù hợp</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pb-3">
                  {filteredProducts.map((drink) => (
                    <button
                      key={drink.id}
                      onClick={() => handleSelectProduct(drink)}
                      className="bg-white rounded-xl p-2.5 border border-slate-200 hover:border-emerald-700/60 hover:shadow-sm transition text-left flex flex-col justify-between group active:scale-[0.99] cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-mono">{drink.sku}</span>
                          <span className="text-slate-500 font-medium">
                            {drink.category?.name || 'Món'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 transition line-clamp-2 leading-snug">
                          {drink.name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-bold text-emerald-800">
                          {formatVnd(drink.basePrice)}
                        </div>
                        <div className="w-5 h-5 rounded-md bg-slate-100 group-hover:bg-emerald-700 text-slate-500 group-hover:text-white flex items-center justify-center transition">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (50%): BẢNG ORDER DÀI & RỘNG RÃI TOÀN MÀN HÌNH */}
        <div className="w-full md:w-1/2 min-h-[68vh] md:min-h-0 bg-white flex flex-col md:h-full flex-shrink-0">
          {/* 1. Header Order gọn gàng */}
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs tracking-tight">
              <ShoppingCart className="w-4 h-4 text-emerald-800" />
              <span>Hóa đơn bán hàng ({totalItemCount} món)</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  setCart([]);
                  setEditingCartId(null);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Xóa tất cả
              </button>
            )}
          </div>

          {/* 2. Tích điểm Siêu gọn (Chỉ 1 dòng duy nhất, giải phóng chiều dài) */}
          <div className="px-4 py-1.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
            {customerInfo ? (
              <div className="flex items-center justify-between w-full text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-bold text-emerald-900">{customerInfo.fullName}</span>
                  <span className="text-emerald-700 text-[11px] font-mono">({customerInfo.phone})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {customerInfo.totalPoints || 0} điểm
                  </span>
                  <button
                    onClick={() => {
                      setCustomerInfo(null);
                      setCustomerPhone('');
                    }}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                    title="Bỏ khách hàng"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 w-full">
                <div className="relative flex-1">
                  <User className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') lookupCustomer();
                    }}
                    placeholder="Nhập SĐT khách tích điểm..."
                    className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={lookupCustomer}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer flex-shrink-0"
                >
                  Tìm
                </button>
              </div>
            )}
          </div>

          {/* 3. Danh Sách Món Order Dài & Rộng Rãi - Chiếm tối đa không gian */}
          <div 
            onClick={() => setEditingCartId(null)}
            className="flex-1 overflow-y-auto p-3.5 space-y-2.5 cursor-default"
          >
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 pointer-events-none">
                <Coffee className="w-10 h-10 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600 text-sm">Đơn hàng đang trống</p>
                <p className="text-xs text-slate-400">Chọn đồ uống từ danh mục bên trái để thêm vào đơn</p>
              </div>
            ) : (
              cart.map((item) => {
                const isEditing = editingCartId === item.cartId;

                // 1. TRẠNG THÁI MỞ RỘNG (ĐANG CHỈNH SỬA MÓN NÀY)
                if (isEditing) {
                  return (
                    <div
                      key={item.cartId}
                      id={`cart-item-${item.cartId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-xl border-2 border-emerald-600 bg-emerald-50/20 p-3 shadow-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100"
                    >
                      {/* Tiêu đề món & Nút xóa */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCartId(null);
                          }}
                          className="flex-1 cursor-pointer group/title"
                          title="Bấm vào để thu gọn"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 leading-tight">
                              {item.product.name}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium group-hover/title:underline">
                              (đang sửa - click để đóng)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.product.sku} &bull; Giá gốc: {Number(item.product.basePrice).toLocaleString()}đ
                          </div>
                        </div>

                        {/* Bộ tăng giảm số lượng & Xóa */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-300">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(item.cartId, -1);
                              }}
                              className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-rose-600 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-slate-800">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(item.cartId, 1);
                              }}
                              className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.cartId);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Xóa món này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 1. Chọn Size */}
                      {item.product.sizes && item.product.sizes.length > 0 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Chọn kích cỡ (Size)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {item.product.sizes.map((sz) => (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItem(item.cartId, () => ({ size: sz }));
                                }}
                                className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer text-xs ${
                                  item.size?.id === sz.id
                                    ? 'bg-[#0F2E22] text-white font-bold border-[#0F2E22]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="font-semibold text-xs">Size {sz.name}</div>
                                <div className="text-[9px] opacity-80">
                                  {Number(sz.priceAdj) > 0 ? `+${Number(sz.priceAdj).toLocaleString()}đ` : 'Giá gốc'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Mức đường & Mức đá */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Lượng đường
                          </label>
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            {[30, 50, 70, 100].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItem(item.cartId, () => ({ sugar: lvl }));
                                }}
                                className={`py-1 rounded border text-center cursor-pointer transition text-[11px] ${
                                  item.sugar === lvl
                                    ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {lvl}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Lượng đá
                          </label>
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            {[0, 50, 70, 100].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItem(item.cartId, () => ({ ice: lvl }));
                                }}
                                className={`py-1 rounded border text-center cursor-pointer transition text-[11px] ${
                                  item.ice === lvl
                                    ? 'bg-blue-600 text-white font-bold border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {lvl}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. Thêm Topping */}
                      {toppings.length > 0 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Thêm Topping
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                            {toppings.map((top) => {
                              const isSelected = item.selectedToppings.some((t) => t.id === top.id);
                              return (
                                <button
                                  key={top.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      updateCartItem(item.cartId, (curr) => ({
                                        selectedToppings: curr.selectedToppings.filter((t) => t.id !== top.id),
                                      }));
                                    } else {
                                      updateCartItem(item.cartId, (curr) => ({
                                        selectedToppings: [...curr.selectedToppings, top],
                                      }));
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-emerald-100/80 border-emerald-600 text-emerald-900 font-bold'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="truncate text-[11px]">{top.name}</span>
                                  <span className="text-[10px] text-emerald-700 font-semibold ml-1 flex-shrink-0">
                                    +{Number(top.basePrice).toLocaleString()}đ
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. Ghi chú mục cuối cùng */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>Ghi chú món</span>
                        </label>
                        <input
                          type="text"
                          value={item.note}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateCartItem(item.cartId, () => ({ note: e.target.value }))}
                          placeholder="VD: ít ngọt hơn, đá riêng, mang về..."
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700 placeholder-slate-400"
                        />
                      </div>

                      {/* Thành tiền món */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 font-medium text-[11px]">Thành tiền món:</span>
                        <div className="text-xs font-bold text-emerald-800">
                          {formatVnd(multiplyVnd(item.unitPrice, item.qty))}
                        </div>
                      </div>
                    </div>
                  );
                }

                // 2. TRẠNG THÁI THU GỌN (CLICK VÀO ĐỂ SỬA LẠI - TỰ ĐỘNG CHUYỂN FOCUS)
                return (
                  <div
                    key={item.cartId}
                    id={`cart-item-${item.cartId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCartId(item.cartId);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-600/60 hover:bg-slate-50/50 transition cursor-pointer flex flex-col gap-1.5 group"
                    title="Bấm vào để sửa lại size, topping, ghi chú"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 transition">
                            {item.product.name}
                          </span>
                          {item.size && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-semibold">
                              Size {item.size.name}
                            </span>
                          )}
                        </div>

                        {/* Chi tiết tóm tắt */}
                        {(item.ice !== 100 || item.sugar !== 100) && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Đường: {item.sugar}% &bull; Đá: {item.ice}%
                          </div>
                        )}

                        {item.selectedToppings.length > 0 && (
                          <div className="text-[10px] text-emerald-800 mt-0.5">
                            + {item.selectedToppings.map((t) => t.name).join(', ')}
                          </div>
                        )}

                        {item.note && (
                          <div className="text-[10px] text-amber-700 italic mt-0.5">
                            Ghi chú: {item.note}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-slate-900">
                          {formatVnd(multiplyVnd(item.unitPrice, item.qty))}
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <span className="text-[10px] text-emerald-700 group-hover:underline flex items-center gap-0.5">
                            <Edit3 className="w-2.5 h-2.5" /> Sửa
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controller & Delete */}
                    <div 
                      className="flex items-center justify-between pt-1.5 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-slate-400">
                        {formatVnd(item.unitPrice)} / ly
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQty(item.cartId, -1)}
                            className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-slate-800">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.cartId, 1)}
                            className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.cartId)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition cursor-pointer font-medium"
                          title="Xóa món"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Thanh toán Tinh gọn (Thu gọn tối đa để order rộng và dài hơn) */}
          <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex-shrink-0 space-y-2">
            {/* Hàng 1: Mã khuyến mãi & Tổng tiền */}
            <div className="flex items-center justify-between gap-3 text-xs">
              {/* Promotion Select Gọn */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Tag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <select
                  value={selectedPromo?.id || ''}
                  onChange={(e) => {
                    const promo = activePromos.find((p) => p.id === e.target.value);
                    setSelectedPromo(promo || null);
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-emerald-700 truncate cursor-pointer"
                >
                  <option value="">Không áp dụng khuyến mãi</option>
                  {activePromos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type === 'PERCENTAGE' ? `-${p.value}%` : `-${Number(p.value).toLocaleString()}đ`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tổng tiền hiển thị đậm nét */}
              <div className="text-right flex-shrink-0 flex items-baseline gap-2">
                {discountAmount > 0 && (
                  <span className="text-[11px] text-rose-600 font-medium">
                    -{formatVnd(discountAmount)}
                  </span>
                )}
                <span className="text-slate-500 text-xs">Tổng:</span>
                <span className="text-base font-black text-[#0F2E22]">
                  {formatVnd(finalTotal)}
                </span>
              </div>
            </div>

            {/* Hàng 2: Phương thức thanh toán + Nút THANH TOÁN (Gọn gàng trong 1 hàng ngang) */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className="flex items-center justify-center gap-1 rounded-lg border border-[#0F2E22] bg-[#0F2E22] px-4 py-1.5 text-xs font-bold text-white"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Tiền mặt
                </button>
                <span className="text-[11px] text-slate-500">
                  Thanh toán điện tử sẽ mở khi kết nối xác minh nhà cung cấp.
                </span>
              </div>

              {/* Nút THANH TOÁN bản to tích hợp cùng hàng */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkingOut}
                className="px-5 py-1.5 bg-[#0F2E22] hover:bg-[#1B4332] active:bg-[#081C14] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer h-[34px]"
              >
                {checkingOut ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Receipt className="w-3.5 h-3.5" />
                    <span>THANH TOÁN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Bill Receipt Preview sau khi thanh toán thành công */}
      {checkedOutOrder && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="text-center">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Thanh toán hoàn tất</h3>
              <p className="text-xs text-slate-500">
                Mã đơn: <span className="font-mono font-bold text-slate-800">{checkedOutOrder.orderNumber}</span>
              </p>
            </div>

            {/* Bill Receipt Preview */}
            <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50 font-mono text-xs space-y-2">
              <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
                TEA-P &bull; {checkedOutOrder.branch?.name || 'Chi nhánh'}
                <div className="text-[10px] font-normal text-slate-500">Phiếu thanh toán</div>
              </div>

              <div className="space-y-1 py-1 max-h-40 overflow-y-auto">
                {checkedOutOrder.cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {item.qty}x {item.product.name} {item.size ? `(${item.size.name})` : ''}
                    </span>
                    <span className="font-medium">{(item.unitPrice * item.qty).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính:</span>
                  <span>{checkedOutOrder.subtotal?.toLocaleString()}đ</span>
                </div>
                {checkedOutOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Khuyến mãi:</span>
                    <span>-{checkedOutOrder.discountAmount?.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs text-slate-900 pt-1 border-t border-slate-200">
                  <span>TỔNG CỘNG:</span>
                  <span>{checkedOutOrder.finalTotal?.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg text-[11px] flex items-center gap-2 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Định lượng kho (BOM) đã được tự động trừ tương ứng.</span>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setCheckedOutOrder(null)}
                className="w-full py-2.5 bg-[#0F2E22] hover:bg-[#1B4332] text-white font-bold rounded-xl transition text-xs shadow-sm cursor-pointer"
              >
                Tạo đơn hàng tiếp theo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
