import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { type NextRequest } from 'next/server';
import { syncUpdateGig, syncFetchAllGigs } from '@/lib/cloudSyncStore';

// GET /api/delivery/location?gigId=<gigId> — fetch live location and status for tracking
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const gigId = request.nextUrl.searchParams.get('gigId');
  if (!gigId) return Response.json({ error: 'Missing gigId' }, { status: 400 });

  const gig = await db.deliveryGig.findUnique({
    where: { id: gigId },
    include: {
      deliverer: {
        select: { id: true, name: true, phoneNumber: true, avatarUrl: true },
      },
      order: {
        select: { id: true, status: true, total: true, deliveryAddress: true, deliveryFee: true },
      },
    },
  });

  if (!gig) {
    const cloudGigs = await syncFetchAllGigs();
    const cloudGig = cloudGigs.find((g) => g.id === gigId);
    if (cloudGig) {
      return Response.json({
        status: cloudGig.status,
        deliveryCode: cloudGig.deliveryCode,
        deliverer: cloudGig.delivererId
          ? {
              id: cloudGig.delivererId,
              name: cloudGig.delivererName || 'Student Deliverer',
              phoneNumber: cloudGig.delivererPhone || '',
              avatarUrl: cloudGig.delivererAvatar || '',
            }
          : null,
        lat: cloudGig.currentLat,
        lng: cloudGig.currentLng,
        lastLocationAt: cloudGig.lastLocationAt,
        order: {
          id: cloudGig.orderId,
          status: 'pending',
          total: cloudGig.total,
          deliveryAddress: cloudGig.deliveryAddress,
          deliveryFee: cloudGig.deliveryFee,
        },
      });
    }
    return Response.json({ error: 'Gig not found' }, { status: 404 });
  }

  return Response.json({
    status: gig.status,
    deliveryCode: gig.deliveryCode,
    deliverer: gig.deliverer,
    lat: gig.currentLat,
    lng: gig.currentLng,
    lastLocationAt: gig.lastLocationAt,
    order: gig.order,
  });
}

// POST /api/delivery/location — update deliverer's live GPS coordinates
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { gigId, lat, lng } = await request.json();
  if (!gigId || lat === undefined || lng === undefined) {
    return Response.json({ error: 'gigId, lat, and lng are required.' }, { status: 400 });
  }

  const gig = await db.deliveryGig.findUnique({ where: { id: gigId } });

  await db.deliveryGig.updateMany({
    where: { id: gigId },
    data: {
      currentLat: lat,
      currentLng: lng,
      lastLocationAt: new Date(),
    },
  });

  const nowIso = new Date().toISOString();
  await syncUpdateGig(gigId, {
    currentLat: lat,
    currentLng: lng,
    lastLocationAt: nowIso,
  });

  return Response.json({ success: true, lastLocationAt: nowIso });
}
