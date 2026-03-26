import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Aprova um profissional (Walker ou Trainer)
 * Muda o status para verificado e ativa o modo de receção de pedidos
 */
export async function handleApproveProfessional(proId, entityType = 'WalkerProfile') {
  try {
    const updateData = {
      is_verified: true,
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      can_receive_requests: true,
      is_active: true
    };

    if (entityType === 'WalkerProfile') {
      await base44.entities.WalkerProfile.update(proId, updateData);
    } else if (entityType === 'TrainerProfile') {
      await base44.entities.TrainerProfile.update(proId, updateData);
    }

    toast.success(`${entityType === 'WalkerProfile' ? 'Passeador' : 'Treinador'} aprovado com sucesso!`);
    return true;
  } catch (err) {
    console.error('Erro ao aprovar profissional:', err);
    toast.error('Erro ao aprovar profissional.');
    return false;
  }
}

/**
 * Rejeita um profissional
 */
export async function handleRejectProfessional(proId, reason, entityType = 'WalkerProfile') {
  try {
    const updateData = {
      verification_status: 'rejected',
      is_active: false,
      can_receive_requests: false,
      rejection_reason: reason,
      rejected_at: new Date().toISOString()
    };

    if (entityType === 'WalkerProfile') {
      await base44.entities.WalkerProfile.update(proId, updateData);
    } else if (entityType === 'TrainerProfile') {
      await base44.entities.TrainerProfile.update(proId, updateData);
    }

    toast.success('Profissional rejeitado.');
    return true;
  } catch (err) {
    console.error('Erro ao rejeitar profissional:', err);
    toast.error('Erro ao rejeitar profissional.');
    return false;
  }
}

/**
 * Suspende um profissional (remover do mapa)
 */
export async function handleSuspendProfessional(proId, reason, entityType = 'WalkerProfile') {
  try {
    const updateData = {
      is_active: false,
      can_receive_requests: false,
      suspension_reason: reason,
      suspended_at: new Date().toISOString()
    };

    if (entityType === 'WalkerProfile') {
      await base44.entities.WalkerProfile.update(proId, updateData);
    } else if (entityType === 'TrainerProfile') {
      await base44.entities.TrainerProfile.update(proId, updateData);
    }

    toast.success('Profissional suspenso.');
    return true;
  } catch (err) {
    console.error('Erro ao suspender profissional:', err);
    toast.error('Erro ao suspender profissional.');
    return false;
  }
}

/**
 * Reativa um profissional suspenso
 */
export async function handleReactivateProfessional(proId, entityType = 'WalkerProfile') {
  try {
    const updateData = {
      is_active: true,
      can_receive_requests: true,
      suspension_reason: null,
      suspended_at: null
    };

    if (entityType === 'WalkerProfile') {
      await base44.entities.WalkerProfile.update(proId, updateData);
    } else if (entityType === 'TrainerProfile') {
      await base44.entities.TrainerProfile.update(proId, updateData);
    }

    toast.success('Profissional reativado.');
    return true;
  } catch (err) {
    console.error('Erro ao reativar profissional:', err);
    toast.error('Erro ao reativar profissional.');
    return false;
  }
}

/**
 * Busca profissionais pendentes de aprovação
 */
export async function fetchPendingProfessionals(entityType = 'WalkerProfile') {
  try {
    const pending = await base44.entities[entityType].filter({
      verification_status: 'pending'
    }, '-created_date');
    
    return pending || [];
  } catch (err) {
    console.error('Erro ao buscar profissionais pendentes:', err);
    return [];
  }
}