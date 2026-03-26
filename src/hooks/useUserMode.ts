import type { User } from '@/types/entities';

interface UserModeResult {
  isViewingAsProfessional: boolean;
  canUsePawGoAsClient: boolean;
}

export function useUserMode(user: User | null | undefined): UserModeResult {
  const isViewingAsProfessional =
    user?.pawgo_status?.is_online || user?.preferences?.current_mode === 'professional';

  const canUsePawGoAsClient =
    user?.account_type === 'owner' || user?.preferences?.current_mode === 'owner';

  return { isViewingAsProfessional: !!isViewingAsProfessional, canUsePawGoAsClient: !!canUsePawGoAsClient };
}
