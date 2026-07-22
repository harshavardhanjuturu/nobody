import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import MarketplaceClient from './MarketplaceClient';

export const revalidate = 0; // Dynamic rendering

export default async function MarketplacePage() {
  const user = await getSessionUser();
  
  const items = await db.marketplaceItem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <MarketplaceClient
      items={items}
      defaultSellerName={user?.name || ''}
      defaultSellerPhone={user?.phoneNumber || ''}
    />
  );
}
