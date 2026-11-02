// Geração de códigos de confirmação com entropia criptográfica (CSPRNG).
// Math.random() é previsível e não pode ser usado em códigos que autorizam pagamentos.
export function generateCompletionCode() {
  const RANGE = 900000; // 100000..999999 (6 dígitos)
  // Limite para rejeição amostral: evita o enviesamento da operação módulo.
  const LIMIT = Math.floor(0x100000000 / RANGE) * RANGE;
  const buffer = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= LIMIT);
  return String(100000 + (value % RANGE));
}