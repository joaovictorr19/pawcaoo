import { base44 } from "@/api/base44Client";

export const DEBUG_FLAG = "__DEBUG_TEST__";

/**
 * Runner para testes efémeros: criar → verificar → apagar.
 * Garante a limpeza do registo mesmo em caso de erro (try/finally).
 *
 * @param {object} opts
 * @param {string} opts.btnId            id do botão (controlo de loading)
 * @param {string} opts.label            etiqueta legível p/ log + toast
 * @param {() => Promise<{id:string}>} opts.createFn   cria o registo efémero
 * @param {(rec) => Promise<void>}      [opts.verifyFn] verifica o registo (lança se inválido)
 * @param {(rec) => Promise<void>}       opts.deleteFn   apaga o registo
 * @param {(msg, type?) => void}        opts.addLog
 * @param {(id: string|null) => void}   opts.setLoadingBtn
 * @param {object}                       opts.toast       instância do sonner toast
 */
export async function runEphemeral({
  btnId,
  label,
  createFn,
  verifyFn,
  deleteFn,
  addLog,
  setLoadingBtn,
  toast,
}) {
  setLoadingBtn(btnId);
  let record = null;
  try {
    addLog(`▶ ${label}: a criar...`);
    record = await createFn();
    if (!record?.id) throw new Error("Registo criado sem ID");
    addLog(`  ✓ criado (${record.id})`);
    if (verifyFn) {
      await verifyFn(record);
      addLog(`  ✓ verificado`);
    }
    await deleteFn(record);
    addLog(`  ✓ apagado`);
    addLog(`✅ ${label}: criado + verificado + apagado`);
    toast.success(`${label}: OK (efémero)`);
  } catch (e) {
    addLog(`❌ ${label}: ${e.message}`, "error");
    if (record?.id) {
      try {
        await deleteFn(record);
        addLog(`  ↻ limpeza de segurança: registo apagado`);
      } catch (ce) {
        addLog(`  ⚠ limpeza falhou: ${ce.message}`, "warn");
      }
    }
    toast.error(`${label}: ${e.message}`);
  } finally {
    setLoadingBtn(null);
  }
}

/**
 * Limpa side-effects criados por funções de pagamento durante um teste
 * (notificações, payouts, transações de carteira associadas a um booking).
 */
export async function cleanupBookingSideEffects(bookingId, addLog) {
  const targets = [
    { entity: "Notification", field: "related_id" },
    { entity: "WalkerPayout", field: "booking_id" },
    { entity: "WalletTransaction", field: "related_booking_id" },
  ];
  for (const { entity, field } of targets) {
    try {
      const items = await base44.entities[entity].filter({ [field]: bookingId });
      if (items.length === 0) continue;
      await Promise.all(items.map((it) => base44.entities[entity].delete(it.id)));
      addLog(`  ↻ ${items.length} ${entity} apagados (side-effect)`);
    } catch {
      /* entidade pode não ser acessível — ignora */
    }
  }
}