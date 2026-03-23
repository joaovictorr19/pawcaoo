export function useUserMode(user) {
  // Se o utilizador desligou o modo profissional no Switch, ele é CLIENTE
  const isViewingAsProfessional = user?.pawgo_status?.is_online || user?.preferences?.current_mode === 'professional';
  
  // Se ele for profissional mas o modo estiver 'owner', ele usa o app como cliente
  const canUsePawGoAsClient = user?.account_type === 'owner' || user?.preferences?.current_mode === 'owner';

  return { isViewingAsProfessional, canUsePawGoAsClient };
}