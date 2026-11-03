// Reservar (e preencher dados dos animais) exige sessão iniciada.
// Sem login, o visitante vai para entrar/criar conta e regressa à página onde estava.
export function goToAuth() {
  const from = window.location.pathname + window.location.search;
  window.location.href = `/login?from=${encodeURIComponent(from)}`;
}