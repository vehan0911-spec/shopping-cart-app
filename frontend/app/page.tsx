'use client';

import { useEffect, useState } from 'react';
import { productService, Product } from '../lib/api';
import { useCart } from '../context/CartContext';

const CATEGORY_COLORS: Record<string, string> = {
  Vegetables: 'var(--color-veg)',
  Fruits: 'var(--color-fruit)',
  Cakes: 'var(--color-cake)',
  Biscuits: 'var(--color-biscuit)',
};
const FALLBACK_COLORS = ['var(--color-stall5)', 'var(--color-stall6)'];

// Any category not in the fixed map above still gets a stable,
// deterministic color from the fallback set based on its name.
function colorForCategory(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await productService.getAllProducts();
        const productData = res.data;
        setProducts(productData);

        const uniqueCategories = [...new Set(productData.map((p: Product) => p.category))];
        setCategories(['All', ...uniqueCategories]);
        setError('');
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const groupedProducts =
    selectedCategory === 'All'
      ? categories
        .filter((c) => c !== 'All')
        .reduce<Record<string, Product[]>>((acc, cat) => {
          acc[cat] = products.filter((p) => p.category === cat);
          return acc;
        }, {})
      : { [selectedCategory]: filteredProducts };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <p className="font-mono text-sm text-ink/50">Stocking the shelves…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <p className="mb-1 font-display text-lg text-fruit">Couldn&apos;t load the shelves</p>
        <p className="font-mono text-sm text-ink/50">{error} — try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
          Fresh from the stall
        </h1>
        <p className="mt-1 text-sm text-ink/60">Picked, weighed, and ready for your basket.</p>
      </header>

      {/* Category tabs, styled like hanging crate labels */}
      <div className="mb-8 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          const accent = cat === 'All' ? 'var(--color-ink)' : colorForCategory(cat);
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="shrink-0 rounded-full border-2 px-4 py-1.5 font-display text-xs uppercase tracking-wide transition-colors"
              style={{
                borderColor: accent,
                background: active ? accent : 'transparent',
                color: active ? '#fff' : accent,
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {selectedCategory === 'All' ? (
        Object.entries(groupedProducts).map(([category, items]) => (
          <section key={category} className="mb-12">
            <CategoryHeader category={category} count={items.length} />
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
              {items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <section>
          <CategoryHeader category={selectedCategory} count={filteredProducts.length} />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CategoryHeader({ category, count }: { category: string; count: number }) {
  const accent = colorForCategory(category);
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
      <h2 className="font-display text-xl uppercase tracking-wide">{category}</h2>
      <span className="font-mono text-xs text-ink/40">
        {count} item{count === 1 ? '' : 's'}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--color-line)' }} />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(product._id, 1);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-line bg-paper-raised p-3.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-line/30">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product._id}/400/300`;
          }}
        />
      </div>

      <h3 className="font-display text-base leading-snug">{product.name}</h3>
      <p className="mb-3 mt-1 flex-1 text-sm text-ink/60">
        {product.description.length > 60
          ? product.description.slice(0, 60) + '…'
          : product.description}
      </p>

      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-ink/50">★ {product.rating || 'N/A'}</span>
        <span className="price-tag">${product.price.toFixed(2)}</span>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={adding}
        className="w-full rounded-lg bg-accent py-2 font-display text-xs uppercase tracking-wide text-accent-ink transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
      >
        {adding ? 'Adding…' : 'Add to cart'}
      </button>
    </div>
  );
}