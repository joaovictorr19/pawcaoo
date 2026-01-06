import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    // Redirect to Service Cockpit if bookingId exists
    if (bookingId) {
      navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${bookingId}`), { replace: true });
    } else {
      // Redirect to Dashboard if no booking context
      navigate(createPageUrl("MyBookings"), { replace: true });
    }
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}