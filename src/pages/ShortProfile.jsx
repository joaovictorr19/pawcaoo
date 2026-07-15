import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * ShortProfile — Rota curta /p/:id que redireciona para o perfil completo
 * Permite links limpos tipo pawcao.pt/p/abc123
 */
export default function ShortProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/UserProfile?id=${id}`, { replace: true });
    }
  }, [id]);

  return null;
}