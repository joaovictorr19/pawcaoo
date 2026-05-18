import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const timeoutId = window.setTimeout(resetScroll, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}