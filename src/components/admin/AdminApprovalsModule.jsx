import React from "react";
import { BadgeCheck, PencilLine, Building2 } from "lucide-react";
import ApprovalsHub from "./ApprovalsHub";
import AdminVerificationQueue from "./AdminVerificationQueue";
import ProfileEditRequests from "./ProfileEditRequests";
import HotelBookingStatusPanel from "./HotelBookingStatusPanel";
import RejectionModal from "./RejectionModal";

/**
 * Módulo de Aprovações — filas separadas apresentadas num hub compacto.
 */
export default function AdminApprovalsModule({
  walkers = [],
  shops = [],
  hotels = [],
  trainers = [],
  shelters = [],
  pendingEditRequestsCount = 0,
  allHotels = [],
  hotelBookings = [],
  onApprove,
  onReject,
  onViewDetails,
  onRefresh,
  onBulkApprove,
  onBulkReject,
  isBulkApproving,
  rejectionTargets = [],
  onCloseRejection,
  onConfirmRejection,
  isRejecting,
}) {
  const verificationCount =
    walkers.length + shops.length + hotels.length + trainers.length + shelters.length;

  const singleTarget = rejectionTargets[0]?.item;
  const targetLabel = rejectionTargets.length === 1
    ? (singleTarget?.walker_name || singleTarget?.trainer_name || singleTarget?.shelter_name || singleTarget?.hotel_details?.hotel_name)
    : undefined;

  return (
    <div>
      <ApprovalsHub
        queues={[
          {
            key: 'verification',
            label: 'Verificações',
            hint: 'Walkers, hotéis, treinadores, abrigos e lojas',
            count: verificationCount,
            icon: BadgeCheck,
            render: () => (
              <AdminVerificationQueue
                walkers={walkers}
                shops={shops}
                hotels={hotels}
                trainers={trainers}
                shelters={shelters}
                onApprove={onApprove}
                onReject={onReject}
                onViewDetails={onViewDetails}
                onRefresh={onRefresh}
                onBulkApprove={onBulkApprove}
                onBulkReject={onBulkReject}
                isBulkApproving={isBulkApproving}
              />
            ),
          },
          {
            key: 'edits',
            label: 'Edições de Perfil',
            hint: 'Alterações propostas por profissionais',
            count: pendingEditRequestsCount,
            icon: PencilLine,
            render: () => <ProfileEditRequests />,
          },
          {
            key: 'hotelBookings',
            label: 'Reservas de Hotel',
            hint: 'Pedidos aceites e recusados',
            count: 0,
            icon: Building2,
            render: () => <HotelBookingStatusPanel hotels={allHotels} hotelBookings={hotelBookings} />,
          },
        ]}
      />

      <RejectionModal
        isOpen={rejectionTargets.length > 0}
        onClose={onCloseRejection}
        onConfirm={onConfirmRejection}
        isLoading={isRejecting}
        targetCount={rejectionTargets.length}
        targetLabel={targetLabel}
      />
    </div>
  );
}