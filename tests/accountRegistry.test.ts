import { describe, it, expect } from 'vitest';
import { buildRegistryRow, buildRegistryRows, signatureOf, preservedOverrides } from '../base44/shared/accountRegistry.ts';

const user = (over = {}) => ({ id: 'u1', email: 'Ana@Example.com', full_name: 'Ana Silva', role: 'user', ...over });
const walker = (over = {}) => ({
  id: 'w1',
  created_by: 'ana@example.com',
  professional_type: 'walker',
  country_of_operation: 'portugal',
  verification_status: 'verified',
  ...over,
});
const trainer = (over = {}) => ({
  id: 't1',
  created_by: 'ana@example.com',
  trainer_name: 'Ana',
  verification_status: 'pending',
  ...over,
});

describe('buildRegistryRow — regimes', () => {
  it('sem perfis nem account_type é cliente sem verificação', () => {
    const row = buildRegistryRow(user(), [], []);
    expect(row.regime).toBe('customer');
    expect(row.status).toBe('not_applicable');
    expect(row.review_state).toBe('ok');
    expect(row.user_email).toBe('ana@example.com');
  });

  it('perfil de passeador verificado', () => {
    const row = buildRegistryRow(user(), [walker()], []);
    expect(row.regime).toBe('walker');
    expect(row.country).toBe('portugal');
    expect(row.status).toBe('verified');
    expect(row.review_state).toBe('ok');
  });

  it('perfil de treinador', () => {
    const row = buildRegistryRow(user(), [], [trainer()]);
    expect(row.regime).toBe('trainer');
    expect(row.status).toBe('pending');
  });

  it('perfil de hotel', () => {
    const row = buildRegistryRow(user(), [walker({ professional_type: 'hotel', verification_status: 'requires_documents' })], []);
    expect(row.regime).toBe('hotel');
    expect(row.status).toBe('requires_documents');
  });

  it('perfil de loja', () => {
    const row = buildRegistryRow(user(), [walker({ professional_type: 'shop' })], []);
    expect(row.regime).toBe('shop');
    expect(row.professional_types).toEqual(['shop']);
  });
});

describe('buildRegistryRow — casos de revisão', () => {
  it('perfis em conflito escolhe pela precedência e assinala', () => {
    const row = buildRegistryRow(user(), [walker()], [trainer()]);
    expect(row.regime).toBe('trainer');
    expect(row.review_state).toBe('conflict');
    expect([...row.professional_types].sort()).toEqual(['trainer', 'walker']);
  });

  it('conta profissional sem país fica por definir', () => {
    const row = buildRegistryRow(user(), [walker({ country_of_operation: null })], []);
    expect(row.country).toBeUndefined();
    expect(row.review_state).toBe('missing_country');
  });

  it('conta que se diz profissional mas não tem perfil', () => {
    const row = buildRegistryRow(user({ account_type: 'walker' }), [], []);
    expect(row.regime).toBe('walker');
    expect(row.review_state).toBe('no_profile');
    expect(row.professional_profile_ids).toEqual([]);
  });

  it('nunca inventa país a partir do account_type', () => {
    const row = buildRegistryRow(user({ account_type: 'hotel' }), [], []);
    expect(row.country).toBeUndefined();
  });
});

describe('buildRegistryRows — consolidação', () => {
  it('indexa perfis por email normalizado e devolve uma linha por conta', () => {
    const rows = buildRegistryRows(
      [user(), user({ id: 'u2', email: 'rui@example.com' })],
      [walker({ created_by: 'ANA@example.com' })],
      []
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].regime).toBe('walker');
    expect(rows[1].regime).toBe('customer');
  });
});

describe('idempotência', () => {
  it('reexecutar com os mesmos dados dá a mesma assinatura', () => {
    const first = buildRegistryRow(user(), [walker()], []);
    const second = buildRegistryRow(user(), [walker()], []);
    expect(signatureOf(first)).toBe(signatureOf(second));
    expect(second.source_signature).toBe(first.source_signature);
  });

  it('mudar o país muda a assinatura', () => {
    const before = buildRegistryRow(user(), [walker()], []);
    const after = buildRegistryRow(user(), [walker({ country_of_operation: 'spain' })], []);
    expect(after.source_signature).not.toBe(before.source_signature);
  });
});

describe('decisões manuais sobrevivem à sincronização', () => {
  const detected = buildRegistryRow(user(), [walker({ country_of_operation: null })], []);
  const existing = {
    ...detected,
    confirmed_regime: 'walker',
    confirmed_country: 'spain',
    review_resolved: true,
    review_action: 'confirmed',
    admin_notes: 'Confirmado por telefone.',
    reviewed_by: 'admin@pawcao.pt',
  };

  it('preserva os valores decididos pelo admin no update da sincronização', () => {
    const merged = { ...detected, ...preservedOverrides(existing) };
    expect(merged.confirmed_regime).toBe('walker');
    expect(merged.confirmed_country).toBe('spain');
    expect(merged.review_resolved).toBe(true);
    expect(merged.admin_notes).toBe('Confirmado por telefone.');
    expect(merged.reviewed_by).toBe('admin@pawcao.pt');
    expect(merged.review_action).toBe('confirmed');
  });

  it('sem decisão manual não há overrides a preservar', () => {
    expect(preservedOverrides(detected)).toEqual({});
    expect(preservedOverrides(null)).toEqual({});
  });
});