import { Navigate, useParams } from "react-router-dom";

/**
 * ShortProfile — Rota curta /p/:id que redireciona para o perfil completo
 * Permite links limpos tipo pawcao.pt/p/abc123
 */
export default function ShortProfile() {
  const { id } = useParams();

  if (!id) return null;

  return <Navigate to={`/UserProfile?id=${id}`} replace />;
}