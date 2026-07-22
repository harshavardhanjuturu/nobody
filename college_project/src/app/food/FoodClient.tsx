'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  placeOrder,
  cancelOrder,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  toggleFoodItemAvailability,
  submitFoodRating,
  getFoodItemReviews,
} from '@/app/actions/food';
import {
  placeOrderWithDelivery,
  getOpenDeliveryGigs,
  acceptDeliveryGig,
  updateGigStatus,
} from '@/app/actions/delivery';
import { useRouter } from 'next/navigation';
import { toggleSectorRegistration } from '@/app/actions/profile';
import PeerDeliveryTracker from '@/components/PeerDeliveryTracker';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  discount: string | null;
  category: string;
  hotelName: string;
  isAvailable: boolean;
  rating?: number;
  reviewCount?: number;
}

interface Order {
  id: string;
  items: string;
  total: number;
  status: string;
  deliveryType?: string;
  deliveryAddress?: string | null;
  deliveryFee?: number;
  deliveryGig?: {
    id: string;
    status: string;
    delivererId: string | null;
  } | null;
  createdAt: Date;
}

interface FoodClientProps {
  foodItems: FoodItem[];
  activeOrders: Order[];
  orderHistory: Order[];
  isFoodVendor: boolean;
  userRole?: string;
}

const KC_CATEGORIES = [
  'All',
  'Noodles',
  'Lappa',
  'Briyani',
  'Gravy',
  'Paratha',
  'Dosai',
  'Rava',
  'Rotis',
  'Pulav',
  'Parotta',
  'Combos',
  'Chinese Rice',
  'Starters',
  'Sandwich',
  'Pizza',
  'Chat',
  'Maggie',
  'Hotdog',
  'Juice',
  'Milkshakes',
  'Icecreams',
  'Vadai',
];

const SOUTHERN_CATEGORIES = [
  'All',
  'South Indian',
  'Dosa',
  'Chinese',
  'Manchurian',
  'Lappa',
  'Briyani',
  'Variety Rice',
  'Snacks',
];

const CATEGORY_ICONS: Record<string, string> = {
  All: 'restaurant_menu',
  Noodles: 'ramen_dining',
  Lappa: 'bakery_dining',
  Briyani: 'rice_bowl',
  Gravy: 'soup_kitchen',
  Paratha: 'bakery_dining',
  Dosai: 'breakfast_dining',
  Rava: 'breakfast_dining',
  Rotis: 'bakery_dining',
  Pulav: 'rice_bowl',
  Parotta: 'bakery_dining',
  Combos: 'lunch_dining',
  'Chinese Rice': 'rice_bowl',
  Starters: 'tapas',
  Sandwich: 'lunch_dining',
  Pizza: 'local_pizza',
  Chat: 'kebab_dining',
  Maggie: 'ramen_dining',
  Hotdog: 'fastfood',
  Juice: 'local_bar',
  Milkshakes: 'local_cafe',
  Icecreams: 'icecream',
  Vadai: 'bakery_dining',
  // Southern Food
  'South Indian': 'breakfast_dining',
  Dosa: 'breakfast_dining',
  Chinese: 'ramen_dining',
  Manchurian: 'soup_kitchen',
  'Variety Rice': 'rice_bowl',
  Snacks: 'tapas',
};

type TabView = 'menu' | 'orders' | 'history' | 'radar';

// Inject keyframe animations into document head once
const ANIMATION_CSS = `
@keyframes cartBadgePop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.6); }
  70%  { transform: scale(0.85); }
  100% { transform: scale(1); }
}
@keyframes addedFlash {
  0%   { opacity: 0; transform: scale(0.7); }
  30%  { opacity: 1; transform: scale(1.1); }
  80%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9); }
}
@keyframes drawerSlideIn {
  0%   { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0);   opacity: 1; }
}
@keyframes successBounce {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  50%  { transform: scale(1.15) rotate(5deg);  opacity: 1; }
  75%  { transform: scale(0.95) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes floatUp {
  0%   { transform: translateY(0)  scale(1);   opacity: 1; }
  100% { transform: translateY(-60px) scale(0); opacity: 0; }
}
@keyframes ripple {
  0%   { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}
@keyframes qtyPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}
.cart-badge-pop { animation: cartBadgePop 0.45s cubic-bezier(.36,.07,.19,.97) both; }
.drawer-slide-in { animation: drawerSlideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) both; }
.success-bounce  { animation: successBounce 0.5s cubic-bezier(.36,.07,.19,.97) both; }
`;

export default function FoodClient({ foodItems, activeOrders, orderHistory, isFoodVendor, userRole }: FoodClientProps) {
  const router = useRouter();
  const canManageMenu = userRole === 'admin';

  // Inject CSS animations once
  useEffect(() => {
    if (document.getElementById('food-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'food-anim-css';
    style.textContent = ANIMATION_CSS;
    document.head.appendChild(style);
  }, []);

  // View state
  const [tabView, setTabView] = useState<TabView>('menu');
  const [selectedHotel, setSelectedHotel] = useState<string>('KC');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Delivery state
  const [cart, setCart] = useState<{ [key: string]: { item: FoodItem; quantity: number } }>({});
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'peer_delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('20');

  // Load saved cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nobody_food_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse saved cart:', e);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (Object.keys(cart).length > 0) {
        localStorage.setItem('nobody_food_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('nobody_food_cart');
      }
    } catch (e) {
      console.warn('Failed to save cart:', e);
    }
  }, [cart]);

  // Campus Delivery Radar state
  const [radarGigs, setRadarGigs] = useState<any[]>([]);
  const [dismissedGigIds, setDismissedGigIds] = useState<string[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSharingGps, setIsSharingGps] = useState<{ [gigId: string]: boolean }>({});
  const watchIdRef = React.useRef<{ [gigId: string]: number }>({});

  // Animation states
  const [animatedItemId, setAnimatedItemId] = useState<string | null>(null);   // "Added!" flash
  const [cartBadgeKey, setCartBadgeKey]     = useState(0);                     // re-mount to retrigger
  const [orderSuccess, setOrderSuccess]     = useState(false);                  // order placed overlay
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null); // for QR code
  const qrCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [floatingItems, setFloatingItems]   = useState<{ id: string; x: number; y: number }[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registered, setRegistered] = useState(isFoodVendor);

  // Create food modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodCategory, setFoodCategory] = useState('Noodles');
  const [foodDiscount, setFoodDiscount] = useState('');
  const [foodHotel, setFoodHotel] = useState('KC');

  // Edit food modal
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Rating & Review Modal State
  const [ratingModalItem, setRatingModalItem] = useState<FoodItem | null>(null);
  const [itemReviews, setItemReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userRatingInput, setUserRatingInput] = useState(5);
  const [userCommentInput, setUserCommentInput] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');

  // Rating Filter & Sort State
  const [ratingFilter, setRatingFilter] = useState<'all' | 'top_rated' | '4.5_plus'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'price_low' | 'price_high'>('recommended');

  // Derived data
  const hotels = useMemo(() => {
    const names = Array.from(new Set(foodItems.map((i) => i.hotelName)));
    return names.sort((a, b) => (a === 'KC' ? -1 : b === 'KC' ? 1 : a.localeCompare(b)));
  }, [foodItems]);

  const filteredItems = useMemo(() => {
    const result = foodItems.filter((item) => {
      if (item.hotelName !== selectedHotel) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (ratingFilter === 'top_rated' && (item.rating || 0) < 4.8) return false;
      if (ratingFilter === '4.5_plus' && (item.rating || 0) < 4.5) return false;
      return true;
    });

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [foodItems, selectedHotel, selectedCategory, searchQuery, ratingFilter, sortBy]);

  const openRatingModal = async (item: FoodItem) => {
    setRatingModalItem(item);
    setUserRatingInput(5);
    setUserCommentInput('');
    setRatingMessage('');
    setLoadingReviews(true);
    try {
      const res = await getFoodItemReviews(item.id);
      if (res.success && res.reviews) {
        setItemReviews(res.reviews);
      } else {
        setItemReviews([]);
      }
    } catch (e) {
      console.error(e);
      setItemReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalItem) return;
    setSubmittingRating(true);
    setRatingMessage('');
    try {
      const res = await submitFoodRating(ratingModalItem.id, userRatingInput, userCommentInput);
      if (res.success) {
        setRatingMessage('★ Review submitted! Thanks for helping peers decide.');
        setUserCommentInput('');
        const reviewsRes = await getFoodItemReviews(ratingModalItem.id);
        if (reviewsRes.success) setItemReviews(reviewsRes.reviews);
        router.refresh();
      } else {
        setRatingMessage(res.error || 'Failed to submit rating.');
      }
    } catch (err: any) {
      console.error(err);
      setRatingMessage(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const categoriesForHotel = useMemo(() => {
    if (selectedHotel === 'KC') return KC_CATEGORIES;
    if (selectedHotel === 'Southern Food') return SOUTHERN_CATEGORIES;
    const cats = Array.from(new Set(foodItems.filter((i) => i.hotelName === selectedHotel).map((i) => i.category)));
    return ['All', ...cats.sort()];
  }, [selectedHotel, foodItems]);

  // Cart helpers
  const addToCart = useCallback((item: FoodItem, event?: React.MouseEvent) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const current = prev[item.id] || { item, quantity: 0 };
      return { ...prev, [item.id]: { item, quantity: current.quantity + 1 } };
    });
    // Trigger "Added!" flash
    setAnimatedItemId(item.id);
    setTimeout(() => setAnimatedItemId(null), 900);
    // Pop cart badge
    setCartBadgeKey((k) => k + 1);
    // Floating +1 emoji
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const floatId = item.id + Date.now();
      setFloatingItems((prev) => [...prev, { id: floatId, x: rect.left + rect.width / 2, y: rect.top }]);
      setTimeout(() => setFloatingItems((prev) => prev.filter((f) => f.id !== floatId)), 800);
    }
  }, []);

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...current, quantity: current.quantity - 1 } };
    });
  };

  const removeItemFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
    try {
      localStorage.removeItem('nobody_food_cart');
    } catch (e) {}
  };

  const cartArray = Object.values(cart);
  const cartItemCount = cartArray.reduce((acc, c) => acc + c.quantity, 0);
  const cartTotal = cartArray.reduce((acc, c) => acc + c.item.price * c.quantity, 0);

  const getCartQty = (itemId: string) => cart[itemId]?.quantity || 0;

  // Register handler
  const handleRegister = async () => {
    setLoadingRegister(true);
    try {
      const res = await toggleSectorRegistration('food');
      if (res.success) {
        setRegistered(true);
        router.refresh();
      } else {
        alert(res.error || 'Failed to register.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegister(false);
    }
  };

  // Fetch Radar Gigs
  const fetchRadarGigs = useCallback(async () => {
    setRadarLoading(true);
    try {
      const res = await getOpenDeliveryGigs();
      if (res.success && res.gigs) {
        setRadarGigs(res.gigs);
        if (res.currentUserId) {
          setCurrentUserId(res.currentUserId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRadarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRadarGigs();
    const interval = setInterval(fetchRadarGigs, 1500);
    return () => clearInterval(interval);
  }, [fetchRadarGigs]);

  const handleAcceptGig = async (gigId: string) => {
    try {
      const res = await acceptDeliveryGig(gigId);
      if (res.success) {
        alert('Delivery gig accepted! Heading to pickup counter.');
        fetchRadarGigs();
      } else {
        alert(res.error || 'Could not accept gig.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGigStatusUpdate = async (gigId: string, status: 'picked_up' | 'delivered') => {
    try {
      const res = await updateGigStatus(gigId, status);
      if (res.success) {
        if (status === 'delivered') {
          // stop GPS tracking if active
          if (watchIdRef.current[gigId]) {
            navigator.geolocation.clearWatch(watchIdRef.current[gigId]);
            delete watchIdRef.current[gigId];
            setIsSharingGps((prev) => ({ ...prev, [gigId]: false }));
          }
        }
        fetchRadarGigs();
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGpsSharing = (gigId: string) => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    if (isSharingGps[gigId]) {
      if (watchIdRef.current[gigId]) {
        navigator.geolocation.clearWatch(watchIdRef.current[gigId]);
        delete watchIdRef.current[gigId];
      }
      setIsSharingGps((prev) => ({ ...prev, [gigId]: false }));
    } else {
      const wId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await fetch('/api/delivery/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gigId, lat: latitude, lng: longitude }),
            });
          } catch (e) {
            console.warn('GPS update failed:', e);
          }
        },
        async (err) => {
          console.warn('GPS watch warning:', err?.message || 'Location permission or timeout');
          // Fallback to simulated campus coordinates for testing when browser location is restricted
          try {
            await fetch('/api/delivery/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gigId, lat: 12.9716, lng: 77.5946 }),
            });
          } catch (e) {
            // ignore fallback error
          }
        },
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 10000 }
      );
      watchIdRef.current[gigId] = wId;
      setIsSharingGps((prev) => ({ ...prev, [gigId]: true }));
    }
  };

  // Checkout
  const handleCheckout = async () => {
    if (cartItemCount === 0) return;
    if (deliveryType === 'peer_delivery' && !deliveryAddress.trim()) {
      alert('Please enter your Hostel & Room # for Peer Delivery.');
      return;
    }
    setLoading(true);
    try {
      const itemsPayload = cartArray.map((c) => ({
        id: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        hotelName: c.item.hotelName,
      }));
      const parsedFee = parseFloat(deliveryFee) || 20;
      const res = await placeOrderWithDelivery(
        itemsPayload,
        cartTotal,
        deliveryType,
        deliveryAddress,
        parsedFee
      );
      if (res.success) {
        clearCart();
        setShowCartDrawer(false);
        setConfirmedOrderId(res.orderId ?? null);
        setOrderSuccess(true);
        setTimeout(() => {
          if (res.orderId) {
            import('qrcode').then((QRCode) => {
              const canvas = document.getElementById('order-qr-canvas') as HTMLCanvasElement | null;
              if (canvas) {
                QRCode.toCanvas(
                  canvas,
                  JSON.stringify({ orderId: res.orderId, items: itemsPayload.map((i) => i.name).join(', '), total: cartTotal }),
                  { width: 140, margin: 1, color: { dark: '#111215', light: '#ffffff' } }
                );
              }
            });
          }
        }, 100);
        setTimeout(() => {
          setOrderSuccess(false);
          setConfirmedOrderId(null);
          setTabView('orders');
        }, 5000);
        router.refresh();
      } else {
        alert(res.error || 'Failed to place order.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    try {
      const res = await cancelOrder(orderId);
      if (res.success) router.refresh();
      else alert(res.error || 'Failed to cancel.');
    } catch (e) {
      console.error(e);
    }
  };

  // Create food item
  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodDescription || !foodPrice) {
      alert('Please fill all required fields.');
      return;
    }
    setFoodLoading(true);
    try {
      const res = await createFoodItem(foodName, foodDescription, parseFloat(foodPrice), foodCategory, foodDiscount, foodHotel);
      if (res.success) {
        setShowCreateModal(false);
        setFoodName('');
        setFoodDescription('');
        setFoodPrice('');
        setFoodDiscount('');
        router.refresh();
      } else {
        alert(res.error || 'Failed to add menu item.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFoodLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (item: FoodItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditPrice(String(item.price));
    setEditCategory(item.category);
    setEditDiscount(item.discount || '');
    setEditAvailable(item.isAvailable);
  };

  // Update food item
  const handleUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditLoading(true);
    try {
      const res = await updateFoodItem(
        editItem.id,
        editName,
        editDescription,
        parseFloat(editPrice),
        editCategory,
        editDiscount,
        editAvailable
      );
      if (res.success) {
        setEditItem(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to update.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete food item
  const handleDeleteFood = async () => {
    if (!deleteItemId) return;
    setDeleteLoading(true);
    try {
      const res = await deleteFoodItem(deleteItemId);
      if (res.success) {
        setDeleteItemId(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      await toggleFoodItemAvailability(item.id, !item.isAvailable);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16">

      {/* ===================== ORDER SUCCESS OVERLAY ===================== */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="success-bounce flex flex-col items-center gap-5 bg-white dark:bg-[#0d0d0f] rounded-32 p-8 shadow-2xl border border-outline max-w-sm mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/40">
              <span className="material-symbols-outlined text-white text-[32px]">check_circle</span>
            </div>
            <div>
              <h2 className="font-black text-2xl text-primary dark:text-white">Order Placed</h2>
              <p className="text-sm text-secondary mt-1">Show this QR at the counter for pickup.</p>
            </div>
            {/* QR Code for pickup */}
            {confirmedOrderId && (
              <div className="flex flex-col items-center gap-2">
                <canvas
                  id="order-qr-canvas"
                  className="rounded-xl border-4 border-white dark:border-surface-container shadow"
                  style={{ width: 140, height: 140 }}
                />
                <p className="text-[10px] text-secondary font-mono">{confirmedOrderId.slice(0, 8).toUpperCase()}</p>
              </div>
            )}
            <button
              onClick={() => { setOrderSuccess(false); setConfirmedOrderId(null); setTabView('orders'); }}
              className="text-xs text-secondary underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating +1 particles */}
      {floatingItems.map((f) => (
        <div
          key={f.id}
          className="fixed z-[90] pointer-events-none text-green-500 font-black text-lg"
          style={{
            left: f.x,
            top: f.y,
            animation: 'floatUp 0.7s ease-out both',
            transform: 'translateX(-50%)',
          }}
        >
          +1
        </div>
      ))}
      {/* ---- Register Banner ---- */}
      {!registered && (
        <div className="glass-panel p-5 rounded-24 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-outline/10 shadow-sm">
          <div className="flex-1">
            <h3 className="font-bold text-sm text-primary dark:text-white">Become a Campus Food Vendor!</h3>
            <p className="text-xs text-secondary mt-1 leading-relaxed">Register to list your menu items and manage orders directly on the portal.</p>
          </div>
          <button
            onClick={handleRegister}
            disabled={loadingRegister}
            className="px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            {loadingRegister ? 'Registering...' : 'Register as Vendor'}
          </button>
        </div>
      )}

      {/* ---- Header ---- */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Food &amp; Dining</h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Order from campus restaurants with exclusive discounts.</p>
        </div>
        <div className="flex items-center gap-3">
          {canManageMenu && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Add Item</span>
            </button>
          )}
          <button
            onClick={() => setShowCartDrawer(true)}
            className="relative px-4 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            <span className="font-bold">Cart</span>
            {cartItemCount > 0 && (
              <span
                key={cartBadgeKey}
                className="cart-badge-pop absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-red-500/50"
              >
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ---- Active Orders Alert ---- */}
      {activeOrders.length > 0 && (
        <button
          onClick={() => setTabView('orders')}
          className="w-full flex items-center gap-3 p-4 rounded-20 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/40 text-left hover:scale-[1.005] transition-transform cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[24px] animate-pulse">pending_actions</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-950 dark:text-amber-200">
              {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">Tap to track your orders →</p>
          </div>
        </button>
      )}

      {/* ---- Live Open Delivery Requests Alert Banner ---- */}
      {radarGigs.some((g) => g.status === 'open') && tabView !== 'radar' && (
        <button
          onClick={() => setTabView('radar')}
          className="w-full flex items-center justify-between gap-3 p-4 rounded-20 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-left hover:scale-[1.005] transition-transform cursor-pointer shadow-lg shadow-orange-500/20"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] animate-pulse">two_wheeler</span>
            <div>
              <p className="text-sm font-black">Live Campus Delivery Request Available!</p>
              <p className="text-xs text-white/90 font-medium">
                Earn ₹{radarGigs.find((g) => g.status === 'open')?.order.deliveryFee || 20} cash tip delivering food to a classmate on campus.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-white text-black font-bold text-xs shrink-0 shadow">
            View &amp; Accept Request →
          </span>
        </button>
      )}

      {/* ---- Main Tab Nav (Centered Equal Grid on Mobile & Web) ---- */}
      <div className="w-full max-w-lg mx-auto grid grid-cols-4 gap-1 p-1.5 bg-slate-200 dark:bg-[#1b1b1f] rounded-full border border-slate-300 dark:border-slate-800 shadow-xs text-center">
        {(['menu', 'orders', 'radar', 'history'] as TabView[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTabView(tab)}
            className={`py-2 px-1 text-xs font-bold rounded-full transition-all capitalize cursor-pointer flex items-center justify-center gap-1 truncate ${
              tabView === tab
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-300/50'
            }`}
          >
            <span>
              {tab === 'menu'
                ? 'Menu'
                : tab === 'orders'
                ? 'Orders'
                : tab === 'radar'
                ? 'Radar'
                : 'History'}
            </span>
            {tab === 'radar' && radarGigs.filter((g) => g.status === 'open').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black text-[9px] shrink-0">
                {radarGigs.filter((g) => g.status === 'open').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===================== MENU TAB ===================== */}
      {tabView === 'menu' && (
        <>
          {/* Hotel Tabs */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-200">Select Restaurant</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {hotels.map((hotel) => (
                <button
                  key={hotel}
                  onClick={() => {
                    setSelectedHotel(hotel);
                    setSelectedCategory('All');
                  }}
                  className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer border ${
                    selectedHotel === hotel
                      ? 'bg-gradient-to-r from-[#004CBB] to-[#8078FF] text-white border-transparent shadow-md shadow-[#004CBB]/20'
                      : 'bg-white dark:bg-surface-container-high border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-bold hover:bg-neutral-100 dark:hover:bg-surface-container-highest shadow-xs'
                  }`}
                >
                  {hotel === 'KC' ? 'New KC Tasty' : hotel === 'Southern Food' ? 'Southern Food' : hotel}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-700 dark:text-secondary text-[20px]">search</span>
            <input
              type="text"
              placeholder={`Search ${selectedHotel === 'KC' ? 'KC menu' : selectedHotel}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-surface-container-high text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-secondary/75 border border-neutral-300 dark:border-outline/70 focus:border-black dark:focus:border-white outline-none transition-colors font-bold shadow-xs"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {categoriesForHotel.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedCategory === cat
                    ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-sm'
                    : 'bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white border-neutral-300 dark:border-transparent font-bold hover:bg-neutral-100 shadow-xs'
                }`}
              >
                {cat !== 'All' && (
                  <span className="material-symbols-outlined text-[14px]">{CATEGORY_ICONS[cat] || 'restaurant'}</span>
                )}
                {cat}
              </button>
            ))}
          </div>

          {/* Rating Filter & Sort Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 p-3 rounded-20 bg-neutral-100 dark:bg-surface-container-high border border-neutral-300 dark:border-outline/30">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
              <button
                onClick={() => setRatingFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  ratingFilter === 'all'
                    ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-sm'
                    : 'bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white border-neutral-300 dark:border-transparent hover:bg-neutral-50'
                }`}
              >
                All Menu
              </button>
              <button
                onClick={() => setRatingFilter('top_rated')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                  ratingFilter === 'top_rated'
                    ? 'bg-[#004CBB] text-white border-transparent shadow-sm'
                    : 'bg-[#004CBB]/10 text-[#004CBB] dark:text-[#8078FF] border-[#004CBB]/20 hover:bg-[#004CBB]/20'
                }`}
              >
                <span>Top Rated</span>
              </button>
              <button
                onClick={() => setRatingFilter('4.5_plus')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                  ratingFilter === '4.5_plus'
                    ? 'bg-[#004CBB] text-white border-transparent shadow-sm'
                    : 'bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white border-neutral-300 dark:border-transparent hover:bg-neutral-50'
                }`}
              >
                <span>4.5+ Stars</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
              <span className="text-neutral-900 dark:text-white font-bold hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-[#121214] text-neutral-900 dark:text-white font-bold border border-neutral-300 dark:border-outline/60 outline-none cursor-pointer text-xs shadow-xs w-full sm:w-auto"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Items count */}
          <div className="flex justify-between items-center text-xs text-neutral-700 dark:text-secondary px-1 font-medium">
            <span>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            </span>
            {ratingFilter !== 'all' && (
              <button onClick={() => setRatingFilter('all')} className="text-neutral-900 dark:text-white underline cursor-pointer font-bold">
                Reset rating filter
              </button>
            )}
          </div>

          {/* Food Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-neutral-700 dark:text-secondary flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[48px] opacity-30">restaurant_menu</span>
              <p className="text-sm font-medium">No items match your rating or search criteria.</p>
              <button onClick={() => { setSearchQuery(''); setRatingFilter('all'); }} className="text-xs text-neutral-900 dark:text-white font-bold underline cursor-pointer">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const qty = getCartQty(item.id);
                const isAdded = animatedItemId === item.id;
                const inCart = qty > 0;
                const itemRating = item.rating || 4.5;
                const reviewCount = item.reviewCount || 0;
                const isTopRated = itemRating >= 4.8;

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-[#121214] border border-slate-300 dark:border-slate-800 rounded-20 overflow-hidden flex flex-col group transition-all duration-200 shadow-sm ${
                      !item.isAvailable
                        ? 'opacity-60'
                        : inCart
                          ? 'hover:shadow-xl hover:-translate-y-1 ring-2 ring-slate-900 dark:ring-white/30'
                          : 'hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* In-cart indicator strip */}
                    {inCart && (
                      <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-slate-700 to-transparent dark:from-white dark:via-white/50" />
                    )}

                    {/* Card Header */}
                    <div className="p-4 flex flex-col gap-2.5 flex-grow">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{item.name}</h3>
                            {isTopRated && (
                              <span className="text-[9px] bg-[#004CBB] text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-xs">
                                Top Rated
                              </span>
                            )}
                            {!item.isAvailable && (
                              <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold uppercase">Unavailable</span>
                            )}
                            {inCart && (
                              <span className="text-[9px] bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white px-1.5 py-0.5 rounded-full font-bold">In Cart</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-black text-base text-slate-900 dark:text-white">₹{item.price}</span>
                          {item.discount && (
                            <span className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-full font-bold uppercase whitespace-nowrap">
                              {item.discount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Rating Badge & Category Row */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 mt-auto">
                        <span className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold">{item.category}</span>
                        
                        {/* Rating Pill Button (Opens Rating & Review Modal) */}
                        <button
                          onClick={() => openRatingModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#004CBB]/10 hover:bg-[#004CBB]/20 text-[#004CBB] dark:text-[#8078FF] transition-all cursor-pointer font-bold text-xs group/star border border-[#004CBB]/20 shadow-xs"
                          title="Click to view student reviews & rate this item"
                        >
                          <span className="material-symbols-outlined text-[14px] text-[#004CBB] dark:text-[#8078FF] group-hover/star:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span>{itemRating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-700 dark:text-slate-400 font-semibold">({reviewCount})</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Footer: Add to cart / qty controls */}
                    <div className="px-4 pb-4 flex items-center justify-between gap-2">
                      {/* Vendor controls */}
                      {canManageMenu && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
                            title="Edit item"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
                            title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {item.isAvailable ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                          <button
                            onClick={() => setDeleteItemId(item.id)}
                            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer text-slate-700 hover:text-red-600 dark:text-slate-300"
                            title="Delete item"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      )}

                      {/* Cart control */}
                      <div className="ml-auto relative">
                        {qty === 0 ? (
                          <button
                            onClick={(e) => addToCart(item, e)}
                            disabled={!item.isAvailable}
                            className="relative overflow-hidden px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                          >
                            {isAdded && (
                              <span
                                className="absolute inset-0 flex items-center justify-center bg-green-600 rounded-full text-white text-xs font-black z-10"
                                style={{ animation: 'addedFlash 0.9s ease-out both' }}
                              >
                                Added!
                              </span>
                            )}
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 rounded-full px-2 py-1 border border-slate-300 dark:border-slate-700">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[16px] text-center">{qty}</span>
                            <button
                              onClick={(e) => addToCart(item, e)}
                              className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===================== ORDERS TAB ===================== */}
      {tabView === 'orders' && (
        <div className="flex flex-col gap-4">
          {activeOrders.length === 0 ? (
            <div className="text-center py-20 text-secondary flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[56px] opacity-20">package_2</span>
              <p className="text-base font-semibold">No active orders</p>
              <p className="text-xs opacity-70">Your current orders will appear here.</p>
              <button
                onClick={() => setTabView('menu')}
                className="mt-2 px-6 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-sm font-semibold cursor-pointer hover:scale-105 transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            activeOrders.map((order) => {
              const parsedItems = JSON.parse(order.items) as Array<{ name: string; quantity: number; price: number; hotelName?: string }>;
              return (
                <div key={order.id} className="base-card p-5 rounded-20 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>
                          ● {order.status}
                        </span>
                        <span className="text-[11px] text-secondary font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-secondary mt-0.5">
                        {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <span className="font-bold text-lg text-primary dark:text-white shrink-0">₹{order.total.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {parsedItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b border-outline/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary/10 dark:bg-white/10 rounded-full flex items-center justify-center text-[11px] font-bold text-primary dark:text-white">{it.quantity}</span>
                          <span className="text-primary dark:text-white font-medium">{it.name}</span>
                        </div>
                        <span className="text-secondary font-semibold">₹{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Render Peer Delivery Live Tracker Component if applicable */}
                  {(order.deliveryType === 'peer_delivery' || order.deliveryGig) && (
                    <div className="mt-2">
                      <PeerDeliveryTracker
                        gigId={order.deliveryGig?.id || `gig_${order.id}`}
                        orderId={order.id}
                        deliveryAddress={order.deliveryAddress}
                        deliveryFee={order.deliveryFee}
                      />
                    </div>
                  )}

                  {order.status === 'pending' && (!order.deliveryGig || order.deliveryGig.status === 'open') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="self-end px-5 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs font-bold transition-all cursor-pointer border border-red-200 dark:border-red-700/40"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== HISTORY TAB ===================== */}
      {tabView === 'history' && (
        <div className="flex flex-col gap-4">
          {orderHistory.length === 0 ? (
            <div className="text-center py-20 text-secondary flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[56px] opacity-20">history</span>
              <p className="text-base font-semibold">No order history</p>
              <p className="text-xs opacity-70">Completed and cancelled orders will appear here.</p>
            </div>
          ) : (
            orderHistory.map((order) => {
              const parsedItems = JSON.parse(order.items) as Array<{ name: string; quantity: number; price: number }>;
              return (
                <div key={order.id} className="base-card p-5 rounded-20 flex flex-col gap-3 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-[11px] text-secondary font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <span className="font-bold text-base text-primary dark:text-white">₹{order.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-secondary">
                    {parsedItems.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== DELIVERY RADAR TAB ===================== */}
      {tabView === 'radar' && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-24 flex items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-outline/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-white text-[22px]">two_wheeler</span>
                <h3 className="font-bold text-base text-primary dark:text-white">Campus Peer Delivery Radar</h3>
              </div>
              <p className="text-xs text-secondary mt-1">Accept food delivery requests from fellow students & earn delivery tips!</p>
            </div>
            <button
              onClick={fetchRadarGigs}
              disabled={radarLoading}
              className="px-4 py-2 rounded-full bg-surface-container-low dark:bg-surface-container-high text-xs font-semibold text-primary dark:text-white flex items-center gap-1 cursor-pointer hover:scale-105 transition-all"
            >
              <span className={`material-symbols-outlined text-[16px] ${radarLoading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {radarLoading && radarGigs.length === 0 ? (
              <div className="text-center py-16 text-secondary">
                <span className="material-symbols-outlined text-[48px] animate-spin mb-2">hourglass_empty</span>
                <p className="text-sm font-medium">Scanning campus for delivery requests...</p>
              </div>
            ) : radarGigs.length === 0 ? (
              <div className="text-center py-16 text-secondary">
                <span className="material-symbols-outlined text-[48px] opacity-40 mb-2 font-light">radar</span>
                <p className="text-sm font-semibold">No open delivery requests right now.</p>
                <p className="text-xs mt-1">Check back soon when students order food with Peer Delivery!</p>
              </div>
            ) : (
              radarGigs.map((gig) => {
                const parsedItems = JSON.parse(gig.order.items) as Array<{ name: string; quantity: number }>;
                const isMyAcceptedGig = (currentUserId && gig.delivererId === currentUserId) || (currentUserId && gig.deliverer?.id === currentUserId);
                const isGpsActive = isSharingGps[gig.id];

                return (
                  <div key={gig.id} className="base-card p-6 rounded-24 flex flex-col gap-4 hover:scale-[1.005] transition-transform">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-primary dark:text-white">Order for {gig.order.user.name}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            gig.status === 'open' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}>
                            {gig.status}
                          </span>
                        </div>
                        <p className="text-xs text-secondary mt-0.5">Drop-off: <strong className="text-primary dark:text-white">{gig.order.deliveryAddress || 'Campus Location'}</strong></p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Delivery Tip</span>
                        <span className="text-lg font-black text-green-600 dark:text-green-400">₹{gig.order.deliveryFee}</span>
                      </div>
                    </div>

                    {gig.status === 'open' ? (
                      /* Open Gig Teaser: Privacy Protected until Accepted */
                      <div className="p-4 bg-surface-container-low dark:bg-surface-container-high rounded-20 flex flex-col gap-3 border border-outline/10">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">restaurant</span>
                            Campus Food Order
                          </span>
                          <span className="font-bold text-primary dark:text-white bg-primary/10 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                            {parsedItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} Item(s)
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">lock</span>
                          <span>Accept this delivery request to view the full item checklist &amp; contact the buyer.</span>
                        </div>
                      </div>
                    ) : (
                      /* Accepted Gig: Full Item Checklist & Buyer Contacts Unlocked */
                      <div className="p-4 bg-surface-container-low dark:bg-surface-container-high rounded-20 flex flex-col gap-2.5 border border-outline/10">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-secondary text-[11px] uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            Food Items to Order at Counter
                          </span>
                          <span className="text-[11px] font-bold text-primary dark:text-white bg-primary/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
                            {parsedItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5 border-t border-b border-outline/10 py-2">
                          {parsedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold text-primary dark:text-white">
                              <span>{item.quantity || 1}× {item.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Payment Summary */}
                        <div className="flex justify-between items-center text-xs font-medium pt-1">
                          <span className="text-secondary">Counter Bill (Pay at Canteen):</span>
                          <span className="font-bold text-primary dark:text-white">₹{(gig.order.total - gig.order.deliveryFee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-green-600 dark:text-green-400 font-semibold">+ Your Delivery Tip (Earned):</span>
                          <span className="font-black text-green-600 dark:text-green-400">₹{gig.order.deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-outline/10 text-primary dark:text-white">
                          <span>Total Cash Collected from Buyer:</span>
                          <span>₹{gig.order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-outline/10 pt-3 flex-wrap gap-2">
                      {gig.status !== 'open' && (
                        <div className="flex items-center gap-3">
                          <a
                            href={`tel:${gig.order.user.phoneNumber}`}
                            className="px-3 py-1.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-xs font-semibold text-secondary hover:text-primary dark:hover:text-white flex items-center gap-1 transition-all"
                          >
                            <span className="material-symbols-outlined text-[15px]">call</span>
                            Call Buyer
                          </a>

                          <button
                            onClick={() => router.push(`/messages/${gig.order.user.id}`)}
                            className="px-3 py-1.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-xs font-semibold text-secondary hover:text-primary dark:hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">chat</span>
                            Message Buyer
                          </button>
                        </div>
                      )}

                      {gig.status === 'open' ? (
                        <button
                          onClick={() => handleAcceptGig(gig.id)}
                          className="ml-auto px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Accept Request (Earn ₹{gig.order.deliveryFee})
                        </button>
                      ) : isMyAcceptedGig ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleGpsSharing(gig.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isGpsActive ? 'bg-green-600 text-white animate-pulse' : 'bg-surface-container-low dark:bg-surface-container-high text-secondary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {isGpsActive ? 'GPS Live On' : 'Share GPS Location'}
                          </button>

                          {gig.status === 'accepted' && (
                            <button
                              onClick={() => handleGigStatusUpdate(gig.id, 'picked_up')}
                              className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              Mark Picked Up
                            </button>
                          )}

                          {gig.status === 'picked_up' && (
                            <button
                              onClick={() => handleGigStatusUpdate(gig.id, 'delivered')}
                              className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-secondary font-medium">Assigned to deliverer</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================== CART DRAWER ===================== */}
      {showCartDrawer && (
        <>
          <div onClick={() => setShowCartDrawer(false)} className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }} />
          <div className="drawer-slide-in fixed top-0 right-0 bottom-0 w-96 max-w-[92vw] bg-white dark:bg-[#0d0d0f] border-l border-outline z-[100] shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-outline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-white">shopping_cart</span>
                <h2 className="font-bold text-lg text-primary dark:text-white">Your Cart</h2>
                {cartItemCount > 0 && (
                  <span className="text-xs bg-primary/10 dark:bg-white/10 text-primary dark:text-white px-2 py-0.5 rounded-full font-bold">{cartItemCount} items</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cartArray.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-secondary hover:text-red-500 cursor-pointer font-medium transition-colors">
                    Clear All
                  </button>
                )}
                <button onClick={() => setShowCartDrawer(false)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white ml-2">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {cartArray.length === 0 ? (
                <div className="text-center py-16 text-secondary flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-[56px] opacity-20">shopping_cart</span>
                  <p className="text-sm font-medium">Your cart is empty.</p>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="text-xs text-primary dark:text-white underline cursor-pointer"
                  >
                    Browse menu →
                  </button>
                </div>
              ) : (
                <>
                  {cartArray.map(({ item, quantity }) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-16 bg-surface-container-low dark:bg-surface-container-high">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-primary dark:text-white truncate">{item.name}</h4>
                        <p className="text-xs text-secondary mt-0.5">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-black/20 rounded-full px-2 py-1 border border-outline">
                          <button onClick={() => removeFromCart(item.id)} className="w-5 h-5 flex items-center justify-center text-primary dark:text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform">−</button>
                          <span className="text-xs font-bold text-primary dark:text-white min-w-[16px] text-center">{quantity}</span>
                          <button onClick={() => addToCart(item)} className="w-5 h-5 flex items-center justify-center text-primary dark:text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform">+</button>
                        </div>
                        <span className="text-sm font-bold text-primary dark:text-white min-w-[48px] text-right">₹{(item.price * quantity).toFixed(0)}</span>
                        <button onClick={() => removeItemFromCart(item.id)} className="text-secondary hover:text-red-500 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Delivery Selection */}
                  <div className="p-4 bg-surface-container-low dark:bg-surface-container-high rounded-20 flex flex-col gap-3 mt-2 border border-outline/30">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">Fulfillment Option</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          deliveryType === 'pickup'
                            ? 'bg-primary dark:bg-white text-white dark:text-black shadow-sm'
                            : 'bg-white dark:bg-black/20 text-secondary hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">storefront</span>
                        Counter Pickup
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('peer_delivery')}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          deliveryType === 'peer_delivery'
                            ? 'bg-primary dark:bg-white text-white dark:text-black shadow-sm'
                            : 'bg-white dark:bg-black/20 text-secondary hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
                        Peer Delivery
                      </button>
                    </div>

                    {deliveryType === 'peer_delivery' && (
                      <div className="flex flex-col gap-2.5 pt-2 border-t border-outline/30">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Delivery Location (Hostel & Room #)</label>
                          <input
                            type="text"
                            placeholder="e.g. Hostel 4, Room 204"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 text-xs text-primary dark:text-white border border-outline outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Delivery Tip / Fee (₹)</label>
                          <input
                            type="number"
                            placeholder="20"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 text-xs text-primary dark:text-white border border-outline outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer - Pinned to Bottom Above Mobile Navigation */}
            {cartArray.length > 0 && (
              <div className="p-4 pb-24 md:pb-5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] shrink-0 flex flex-col gap-3 shadow-2xl z-20 sticky bottom-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#a4a2a5]">Order Total</p>
                    <p className="font-extrabold text-xl text-slate-900 dark:text-white">
                      ₹{(cartTotal + (deliveryType === 'peer_delivery' ? (parseFloat(deliveryFee) || 20) : 0)).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-[#a4a2a5] text-right">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'Placing Order...' : deliveryType === 'peer_delivery' ? 'Request Peer Delivery' : 'Place Pickup Order'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== CREATE FOOD MODAL ===================== */}
      {showCreateModal && (
        <>
          <div onClick={() => setShowCreateModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">Add Menu Item</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateFood} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Hotel / Restaurant</label>
                  <select
                    value={foodHotel}
                    onChange={(e) => setFoodHotel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none cursor-pointer"
                  >
                    {hotels.map((h) => <option key={h} value={h}>{h}</option>)}
                    <option value="Campus Dining">Campus Dining</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Category</label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none cursor-pointer"
                  >
                    {KC_CATEGORIES.filter(c => c !== 'All').map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Butter Masala"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Description *</label>
                <textarea
                  placeholder="Describe your dish, key ingredients..."
                  value={foodDescription}
                  onChange={(e) => setFoodDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 120"
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Discount (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10% OFF"
                    value={foodDiscount}
                    onChange={(e) => setFoodDiscount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={foodLoading}
                className="w-full py-3.5 mt-1 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold shadow-md hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {foodLoading ? 'Adding...' : 'Add to Menu'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* ===================== EDIT FOOD MODAL ===================== */}
      {editItem && (
        <>
          <div onClick={() => setEditItem(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">Edit: {editItem.name}</h2>
              <button onClick={() => setEditItem(null)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateFood} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Item Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Description *</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none cursor-pointer"
                  >
                    {KC_CATEGORIES.filter(c => c !== 'All').map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Discount</label>
                  <input
                    type="text"
                    placeholder="e.g. 10% OFF"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Availability</label>
                  <button
                    type="button"
                    onClick={() => setEditAvailable(!editAvailable)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      editAvailable
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{editAvailable ? 'check_circle' : 'cancel'}</span>
                    {editAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="flex-1 py-3 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white font-semibold text-sm cursor-pointer hover:scale-[1.01] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-3 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteItemId && (
        <>
          <div onClick={() => setDeleteItemId(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-[28px]">delete_forever</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary dark:text-white">Delete Item?</h3>
              <p className="text-sm text-secondary mt-1">This action cannot be undone. The item will be permanently removed from the menu.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteItemId(null)}
                className="flex-1 py-3 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFood}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===================== FOOD RATING & REVIEWS MODAL ===================== */}
      {ratingModalItem && (
        <>
          <div onClick={() => setRatingModalItem(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#0d0d0f] border border-outline rounded-32 p-6 z-50 shadow-2xl flex flex-col gap-5 overflow-y-auto animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-outline/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-primary dark:text-white">{ratingModalItem.name}</h3>
                  <span className="text-[10px] bg-primary/10 dark:bg-white/10 text-primary dark:text-white px-2 py-0.5 rounded-full font-bold">
                    {ratingModalItem.hotelName}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5">{ratingModalItem.category} • ₹{ratingModalItem.price}</p>
              </div>
              <button
                onClick={() => setRatingModalItem(null)}
                className="p-1 rounded-full text-secondary hover:text-primary dark:hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Overall Rating Summary Card */}
            <div className="p-4 rounded-24 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center gap-5">
              <div className="flex flex-col items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-20 shadow-md">
                <span className="text-3xl font-black">{ (ratingModalItem.rating || 4.5).toFixed(1) }</span>
                <div className="flex text-amber-200 text-xs mt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: star <= Math.round(ratingModalItem.rating || 4.5) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-sm text-primary dark:text-white">Overall Student Rating</p>
                <p className="text-xs text-secondary mt-0.5">
                  Based on {ratingModalItem.reviewCount || itemReviews.length || 0} student reviews &amp; ratings on campus.
                </p>
              </div>
            </div>

            {/* Submit Your Rating Form */}
            <form onSubmit={handleRatingSubmit} className="p-4 rounded-24 bg-surface-container-low dark:bg-surface-container-high border border-outline/20 flex flex-col gap-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-secondary">Rate this item</h4>
              
              {/* Interactive Star Selector */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRatingInput(star)}
                    className="p-1 text-amber-500 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: star <= userRatingInput ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  </button>
                ))}
                <span className="text-xs font-bold text-primary dark:text-white ml-2">
                  {userRatingInput === 5 ? '5/5 - Excellent' : userRatingInput === 4 ? '4/5 - Good' : userRatingInput === 3 ? '3/5 - Average' : userRatingInput === 2 ? '2/5 - Needs Improvement' : '1/5 - Poor'}
                </span>
              </div>

              {/* Review Comment Input */}
              <textarea
                placeholder="Write a brief review (e.g., taste, spice level, portion size)..."
                value={userCommentInput}
                onChange={(e) => setUserCommentInput(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121214] text-xs text-primary dark:text-white placeholder-secondary/75 border border-outline/40 outline-none resize-none"
              />

              {ratingMessage && (
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 animate-fade-up">
                  {ratingMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingRating}
                className="w-full py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-bold text-xs hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {submittingRating ? 'Submitting Rating...' : 'Submit Rating & Review'}
              </button>
            </form>

            {/* Reviews List */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-secondary">
                Student Reviews ({itemReviews.length})
              </h4>

              {loadingReviews ? (
                <div className="text-center py-6 text-xs text-secondary">Loading reviews...</div>
              ) : itemReviews.length === 0 ? (
                <div className="text-center py-6 text-xs text-secondary bg-surface-container-low dark:bg-surface-container-high rounded-20">
                  No reviews written yet. Be the first student to review this dish!
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {itemReviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-20 bg-surface-container-low dark:bg-surface-container-high border border-outline/20 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-primary dark:text-white">
                            {rev.user?.name ? rev.user.name[0] : 'U'}
                          </div>
                          <span className="font-semibold text-xs text-primary dark:text-white">{rev.user?.name || 'Student'}</span>
                        </div>
                        <div className="flex text-amber-500 text-xs">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className="material-symbols-outlined text-[12px]"
                              style={{ fontVariationSettings: star <= rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-secondary leading-relaxed pl-8">{rev.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
