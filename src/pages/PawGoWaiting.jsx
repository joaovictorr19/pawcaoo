import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawGoWaitingScreen from "@/components/home/PawGoWaitingScreen";
import { toast } from "sonner";

export default function PawGoWaiting() {
  const navigate = useNavigate();
  const [pendingData, setPendingData] = useState(null);

  useEffect(() => {
    // Recuperar dados guardados
    const stored = localStorage.getItem('pawgo_pending');
    if (!stored) {
      navigate(createPageUrl('Home'));
      return;
    }
    const data = JSON.parse(stored);
    setPendingData(data);
  }, [navigate]);

  const handleCancel = () => {
    localStorage.removeItem('pawgo_pending');
    navigate(createPageUrl('Home'));
  };

  if (!pendingData) return null;

  return (
    <PawGoWaitingScreen 
      selectedPets={pendingData.pets}
      duration={pendingData.duration}
      onCancel={handleCancel}
    />
  );
}