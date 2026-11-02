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

// Código alfanumérico (cupões de resgate, referências) com entropia criptográfica.
// Alfabeto com 32 caracteres e 256 valores possíveis por byte → sem enviesamento.
export function generateSecureCode(length = 10) {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < length; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}