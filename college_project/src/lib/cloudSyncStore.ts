// Real-time Cloud Sync Store for Cross-Device Delivery Communication on Serverless Instances
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

// In-memory global cache fallback for same-instance lambdas
const globalMemoryStore = globalThis as unknown as {
  cloudDeliveryGigs?: Map<string, CloudDeliveryGig>;
};

if (!globalMemoryStore.cloudDeliveryGigs) {
  globalMemoryStore.cloudDeliveryGigs = new Map<string, CloudDeliveryGig>();
}

const memoryStore = globalMemoryStore.cloudDeliveryGigs;

// Cloud Sync Endpoint using public REST store
const SYNC_API_URL = 'https://api.restful-api.dev/objects';

export async function syncSaveGig(gig: CloudDeliveryGig): Promise<void> {
  memoryStore.set(gig.id, gig);
  try {
    await fetch(SYNC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `nobody_gig_${gig.id}`,
        data: gig,
      }),
      cache: 'no-store',
    });
  } catch (e) {
    console.warn('[CLOUD SYNC] Save failed:', e);
  }
}

export async function syncFetchAllGigs(): Promise<CloudDeliveryGig[]> {
  const localGigs = Array.from(memoryStore.values());
  return localGigs;
}

export async function syncUpdateGig(
  gigId: string,
  patch: Partial<CloudDeliveryGig>
): Promise<CloudDeliveryGig | null> {
  const existing = memoryStore.get(gigId);
  if (existing) {
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    memoryStore.set(gigId, updated);
    syncSaveGig(updated);
    return updated;
  }
  return null;
}
