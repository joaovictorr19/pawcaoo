/**
 * Retorna o domínio público canónico da PawCão para links partilháveis.
 *
 * Em produção o domínio personalizado é pawcao.pt; no sandbox de preview
 * o window.location.origin devolve o subdomínio base44.app, que não é o
 * link que queremos mostrar/partilhar aos clientes.
 */
export function getPublicBaseUrl() {
  return 'https://pawcao.pt';
}