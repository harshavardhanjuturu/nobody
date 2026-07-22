'use client';

import React, { useState } from 'react';
import { createListing } from '@/app/actions/marketplace';
import { useRouter } from 'next/navigation';
import MorphicImage from '@/components/MorphicImage';
import { ToastContainer, useToast } from '@/components/Toast';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  sellerName: string;
  sellerPhone: string;
  createdAt?: Date | string;
}

interface MarketplaceClientProps {
  items: MarketplaceItem[];
  defaultSellerName: string;
  defaultSellerPhone: string;
}

const CATEGORIES = ['All', 'Electronics', 'Textbooks', 'Tickets', 'Furniture', 'Clothing', 'Sports', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  All: 'apps',
  Electronics: 'devices',
  Textbooks: 'menu_book',
  Tickets: 'confirmation_number',
  Furniture: 'chair',
  Clothing: 'checkroom',
  Sports: 'sports_soccer',
  Other: 'category',
};

export default function MarketplaceClient({ items, defaultSellerName, defaultSellerPhone }: MarketplaceClientProps) {
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'low' | 'high'>('newest');
  const [showModal, setShowModal] = useState(false);
  const [contactItem, setContactItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [sellerName, setSellerName] = useState(defaultSellerName);
  const [sellerPhone, setSellerPhone] = useState(defaultSellerPhone);

  const filteredItems = items
    .filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'low') return a.price - b.price;
      if (sortBy === 'high') return b.price - a.price;
      return 0; // newest — already ordered by server
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !sellerName || !sellerPhone) {
      addToast('Please fill out all fields.', 'error');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      addToast('Please enter a valid price greater than 0.', 'error');
      return;
    }

    setLoading(true);
    const res = await createListing(title, description, parsedPrice, category, sellerName, sellerPhone);
    setLoading(false);

    if (res.success) {
      addToast('Listing created.', 'success');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPrice('');
      router.refresh();
    } else {
      addToast(res.error || 'Failed to list item.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">
            Student Marketplace
          </h1>
          <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1">
            Buy or sell secondhand campus gear, textbooks, or event tickets.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          List Item
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 border-b border-outline pb-5">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary dark:bg-white text-white dark:text-black'
                  : 'bg-surface-container-low dark:bg-surface-container-high text-secondary hover:text-primary dark:hover:text-white border border-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {CATEGORY_ICONS[cat] || 'category'}
              </span>
              {cat}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search items, sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white placeholder-secondary/50 border border-transparent focus:border-outline outline-none transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'low' | 'high')}
            className="px-4 py-2.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <p className="text-xs text-secondary font-medium -mt-4">
        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
      </p>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-16 text-secondary">
            <span className="material-symbols-outlined text-[48px] opacity-40 block mb-2">shopping_bag</span>
            <p className="text-sm font-medium">No items match your filters.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="mt-3 text-xs text-primary dark:text-white underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="base-card rounded-24 overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300"
            >
              <div className="h-44 relative w-full overflow-hidden shrink-0 bg-surface-container-low">
                <MorphicImage
                  src={item.imageUrl || ''}
                  alt={item.title}
                  fallbackIcon="shopping_bag"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-primary dark:bg-white text-white dark:text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px]">
                    {CATEGORY_ICONS[item.category] || 'category'}
                  </span>
                  {item.category}
                </span>
              </div>

              <div className="p-5 flex flex-col justify-between flex-grow gap-4">
                <div>
                  <h3 className="font-semibold text-base text-primary dark:text-white leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-secondary dark:text-[#a4a2a5] mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-secondary mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {item.sellerName}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-outline pt-4">
                  <span className="font-bold text-xl text-primary dark:text-white">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={() => setContactItem(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">phone</span>
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Modal */}
      {contactItem && (
        <>
          <div onClick={() => setContactItem(null)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-base text-primary dark:text-white">Contact Seller</h2>
              <button onClick={() => setContactItem(null)} className="text-secondary hover:text-primary dark:hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary dark:text-white">{contactItem.title}</p>
              <p className="text-xs text-secondary">₹{contactItem.price.toLocaleString('en-IN')} · {contactItem.category}</p>
            </div>

            <div className="bg-surface-container-low dark:bg-surface-container-high rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary dark:bg-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white dark:text-black text-[20px]">person</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary dark:text-white">{contactItem.sellerName}</p>
                  <p className="text-xs text-secondary">{contactItem.sellerPhone}</p>
                </div>
              </div>
            </div>

            <a
              href={`tel:${contactItem.sellerPhone}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              Call Seller
            </a>
          </div>
        </>
      )}

      {/* Listing Creation Modal */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">List an Item for Sale</h2>
              <button onClick={() => setShowModal(false)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM5 Headphones"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Description</label>
                <textarea
                  placeholder="Describe condition, included accessories, meetup location..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="2500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Your Name</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Contact Number</label>
                  <input
                    type="tel"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {loading ? 'Creating Listing...' : 'List Item Now'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
