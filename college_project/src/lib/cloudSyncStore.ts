// Real-time Shared Cloud Sync Store across all Vercel Lambdas and Devices
export interface CloudDeliveryGig {
  id: string;
  orderId: string;
  status: 'open' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  deliveryCode: string;
  deliveryAddress: string;
  deliveryFee: number;
  total: number;
  items: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerAvatar?: string;
  delivererId?: string;
  delivererName?: string;
  delivererPhone?: string;
  delivererAvatar?: string;
  currentLat?: number;
  currentLng?: number;
  lastLocationAt?: string;
  createdAt: string;
  updatedAt: string;
}

const SHARED_OBJECT_ID = 'ff8081819f7e10ae019f8989a34e11eb';
const SYNC_API_URL = `https://api.restful-api.dev/objects/${SHARED_OBJECT_ID}`;

// In-memory fallback
const memoryCache: Map<string, CloudDeliveryGig> = new Map();

export async function syncFetchAllGigs(): Promise<CloudDeliveryGig[]> {
  try {
    const res = await fetch(SYNC_API_URL, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const gigs: CloudDeliveryGig[] = json?.data?.gigs || [];
      gigs.forEach((g) => memoryCache.set(g.id, g));
      return gigs;
    }
  } catch (e) {
    console.warn('[CLOUD SYNC] Fetch failed, fallback to memory:', e);
  }
  return Array.from(memoryCache.values());
}

export async function syncSaveGig(gig: CloudDeliveryGig): Promise<void> {
  memoryCache.set(gig.id, gig);
  try {
    const currentGigs = await syncFetchAllGigs();
    const existingIndex = currentGigs.findIndex((g) => g.id === gig.id);
    if (existingIndex >= 0) {
      currentGigs[existingIndex] = gig;
    } else {
      currentGigs.unshift(gig);
    }

    // Keep active non-delivered gigs
    const activeGigs = currentGigs.slice(0, 50);

    await fetch(SYNC_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'nobody_gigs_store',
        data: { gigs: activeGigs },
      }),
      cache: 'no-store',
    });
  } catch (e) {
    console.warn('[CLOUD SYNC] Save failed:', e);
  }
}

export async function syncUpdateGig(
  gigId: string,
  patch: Partial<CloudDeliveryGig>
): Promise<CloudDeliveryGig | null> {
  const currentGigs = await syncFetchAllGigs();
  const existingIndex = currentGigs.findIndex((g) => g.id === gigId);

  let updatedGig: CloudDeliveryGig | null = null;

  if (existingIndex >= 0) {
    updatedGig = {
      ...currentGigs[existingIndex],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    currentGigs[existingIndex] = updatedGig;
  } else {
    const cached = memoryCache.get(gigId);
    if (cached) {
      updatedGig = { ...cached, ...patch, updatedAt: new Date().toISOString() };
      currentGigs.unshift(updatedGig);
    }
  }

  if (updatedGig) {
    memoryCache.set(gigId, updatedGig);
    try {
      await fetch(SYNC_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'nobody_gigs_store',
          data: { gigs: currentGigs },
        }),
        cache: 'no-store',
      });
    } catch (e) {
      console.warn('[CLOUD SYNC] Update failed:', e);
    }
  }

  return updatedGig;
}
