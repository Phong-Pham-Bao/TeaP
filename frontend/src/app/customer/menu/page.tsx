'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Coffee,
  LogIn,
  RefreshCw,
  Search,
  Tag,
  Users,
} from 'lucide-react';
import api from '@/lib/api';

interface ProductSize {
  id: string;
  name: string;
  priceAdj: number | string;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  basePrice: number | string;
  image?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  sizes?: ProductSize[];
}

interface MenuResponse {
  drinks: Product[];
  toppings: Product[];
  categories: Category[];
}

const formatPrice = (value: number | string) => {
  const price = Number(value);
  return `${(Number.isFinite(price) ? price : 0).toLocaleString('vi-VN')} đ`;
};

function ProductImage({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = product.image?.trim();

  if (!imageUrl || imageError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-800">
        <Coffee className="h-10 w-10 stroke-1.5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setImageError(true)}
      className="h-full w-full object-cover"
    />
  );
}

export default function CustomerMenuPage() {
  const [menu, setMenu] = useState<MenuResponse>({ drinks: [], toppings: [], categories: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get<MenuResponse>('/products/menu');
        if (cancelled) return;

        setMenu({
          drinks: Array.isArray(response.data?.drinks) ? response.data.drinks : [],
          toppings: Array.isArray(response.data?.toppings) ? response.data.toppings : [],
          categories: Array.isArray(response.data?.categories) ? response.data.categories : [],
        });
      } catch {
        if (!cancelled) {
          setError('Không thể tải menu lúc này. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const visibleCategories = useMemo(() => {
    const categoryIds = new Set(menu.drinks.map((drink) => drink.categoryId).filter(Boolean));
    return menu.categories.filter((category) => categoryIds.has(category.id));
  }, [menu.categories, menu.drinks]);

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('vi-VN');

  const filteredDrinks = useMemo(
    () =>
      menu.drinks.filter((drink) => {
        const matchesCategory = activeCategory === 'all' || drink.categoryId === activeCategory;
        const searchableText = `${drink.name} ${drink.sku || ''} ${drink.category?.name || ''}`.toLocaleLowerCase(
          'vi-VN'
        );
        return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
      }),
    [activeCategory, menu.drinks, normalizedSearch]
  );

  const filteredToppings = useMemo(
    () =>
      menu.toppings.filter((topping) => {
        const searchableText = `${topping.name} ${topping.sku || ''}`.toLocaleLowerCase('vi-VN');
        return !normalizedSearch || searchableText.includes(normalizedSearch);
      }),
    [menu.toppings, normalizedSearch]
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8FAFC] font-sans text-slate-900">
      <header className="sticky top-0 z-30 bg-[#0F2E22] px-4 py-3.5 text-white shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-emerald-300">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight">TEAP</div>
              <p className="text-[11px] text-emerald-300">Menu dành cho khách hàng</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/customer"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-900/60 px-3 py-2 text-emerald-100 transition hover:bg-emerald-800 hover:text-white"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hội viên &amp; Điểm thưởng</span>
              <span className="sm:hidden">Hội viên</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-emerald-100 transition hover:bg-white/10 hover:text-white"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Đăng nhập nhân viên</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link
            href="/customer"
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Cổng hội viên
          </Link>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                <Coffee className="h-3.5 w-3.5" /> Đồ uống tại TeaP
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0F2E22] sm:text-4xl">Menu TeaP</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Khám phá các món đang phục vụ, lựa chọn kích cỡ và xem giá trước khi ghé quầy TeaP.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm tên món..."
                aria-label="Tìm kiếm món"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
            <p className="mt-4 text-sm font-semibold text-slate-600">Đang tải menu TeaP...</p>
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
            <h2 className="mt-3 text-base font-bold text-rose-900">Không tải được menu</h2>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => setRequestKey((key) => key + 1)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </section>
        ) : menu.drinks.length === 0 && menu.toppings.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <Coffee className="mx-auto h-12 w-12 stroke-1 text-slate-300" />
            <h2 className="mt-4 text-base font-bold text-slate-700">Menu chưa có sản phẩm</h2>
            <p className="mt-1 text-sm text-slate-400">Các món mới sẽ được cập nhật tại đây.</p>
          </section>
        ) : (
          <>
            {menu.drinks.length > 0 && (
              <section aria-label="Bộ lọc danh mục" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Danh mục</h2>
                  <span className="text-xs text-slate-400">{filteredDrinks.length} món</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                      activeCategory === 'all'
                        ? 'border-[#0F2E22] bg-[#0F2E22] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-700 hover:text-emerald-800'
                    }`}
                  >
                    Tất cả
                  </button>
                  {visibleCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                        activeCategory === category.id
                          ? 'border-[#0F2E22] bg-[#0F2E22] text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-700 hover:text-emerald-800'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="drinks-heading" className="space-y-4">
              <div>
                <h2 id="drinks-heading" className="text-xl font-black text-[#0F2E22]">
                  Đồ uống
                </h2>
                <p className="mt-1 text-xs text-slate-500">Giá có thể thay đổi theo kích cỡ bạn chọn.</p>
              </div>

              {filteredDrinks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  {menu.drinks.length === 0 ? (
                    <Coffee className="mx-auto h-10 w-10 text-slate-300" />
                  ) : (
                    <Search className="mx-auto h-10 w-10 text-slate-300" />
                  )}
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    {menu.drinks.length === 0 ? 'Chưa có đồ uống trong menu' : 'Không tìm thấy món phù hợp'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {menu.drinks.length === 0 ? 'Các món mới sẽ được cập nhật tại đây.' : 'Thử từ khóa hoặc danh mục khác.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDrinks.map((drink) => (
                    <article
                      key={drink.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="h-40 border-b border-slate-100 sm:h-44">
                        <ProductImage product={drink} />
                      </div>
                      <div className="space-y-4 p-4">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-extrabold leading-snug text-slate-900">{drink.name}</h3>
                            {drink.category?.name && (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                                {drink.category.name}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Giá cơ bản</p>
                          <p className="text-lg font-black text-emerald-800">{formatPrice(drink.basePrice)}</p>
                        </div>

                        {drink.sizes && drink.sizes.length > 0 && (
                          <div className="border-t border-slate-100 pt-3">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Kích cỡ</p>
                            <div className="flex flex-wrap gap-2">
                              {drink.sizes.map((size) => (
                                <div
                                  key={size.id}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs"
                                >
                                  <span className="font-bold text-slate-700">Size {size.name}</span>
                                  <span className="ml-1.5 font-semibold text-emerald-800">
                                    {formatPrice(Number(drink.basePrice) + Number(size.priceAdj))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {menu.toppings.length > 0 && (
              <section aria-labelledby="toppings-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 id="toppings-heading" className="text-lg font-black text-slate-900">
                      Topping
                    </h2>
                    <p className="text-xs text-slate-500">Thêm hương vị yêu thích cho đồ uống của bạn.</p>
                  </div>
                </div>

                {filteredToppings.length === 0 ? (
                  <p className="mt-5 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    Không có topping phù hợp với từ khóa tìm kiếm.
                  </p>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredToppings.map((topping) => (
                      <div
                        key={topping.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
                      >
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-800">{topping.name}</h3>
                          <p className="mt-0.5 text-[11px] text-slate-400">Topping thêm</p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-emerald-800">
                          {formatPrice(topping.basePrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-[11px] text-slate-400">
        TeaP Bubble Tea &bull; Menu được cập nhật trực tiếp từ cửa hàng
      </footer>
    </div>
  );
}
