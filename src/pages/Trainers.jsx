import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Página legada — a descoberta de treinadores faz agora parte do marketplace
 * de Profissionais na página inicial (com filtros e reservas modernas).
 * Este redirecionamento mantém links antigos a funcionar.
 */
export default function Trainers() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl("Home"), { replace: true });
  }, [navigate]);

  return null;
}