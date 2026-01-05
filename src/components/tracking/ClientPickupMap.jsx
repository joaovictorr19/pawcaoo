import React from 'react';
import { ClientPickupMap as NewClientPickupMap } from '@/components/pawcao/ClientPickupMap';

const ClientPickupMap = ({ pickupLocation }) => {
  // Fallback coordinates if not provided
  const location = pickupLocation || {
    lat: 38.7223,
    lng: -9.1393,
    address: 'Lisboa, Portugal',
    clientName: 'Cliente'
  };

  // Ensure clientName exists
  const enhancedLocation = {
    ...location,
    clientName: location.clientName || location.ownerName || 'Cliente'
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md">
      <NewClientPickupMap pickupLocation={enhancedLocation} />
    </div>
  );
};

export default ClientPickupMap;