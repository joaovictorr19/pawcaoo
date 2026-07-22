import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Professional sticky tab bar for HotelDashboard.
 * - Desktop: all tabs visible in a wrapped grid (pill style)
 * - Mobile: horizontal scroll with always-visible arrow buttons + edge fade
 */
export default function HotelDashboardTabs({ tabs, activeTab, onChange, getCount }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  // Auto-scroll active tab into view on change (mobile)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      const btnLeft = activeBtn.offsetLeft;
      const btnRight = btnLeft + activeBtn.offsetWidth;
      const viewLeft = el.scrollLeft;
      const viewRight = viewLeft + el.clientWidth;
      if (btnLeft < viewLeft + 20 || btnRight > viewRight - 20) {
        el.scrollTo({ left: btnLeft - el.clientWidth / 2 + activeBtn.offsetWidth / 2, behavior: "smooth" });
      }
    }
    setTimeout(updateScrollState, 100);
  }, [activeTab]);

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[3.25rem] md:top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-2 md:px-4">
        <div className="relative flex items-center">
          {/* Left arrow — mobile only */}
          <button
            onClick={() => scrollByAmount(-1)}
            className={`md:hidden absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white via-white/90 to-transparent transition-opacity ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          {/* Scrollable / wrapped tabs */}
          <div
            ref={scrollRef}
            className="flex md:flex-wrap gap-1 overflow-x-auto md:overflow-visible flex-nowrap md:flex-nowrap py-2.5 no-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const count = getCount?.(tab.key) || 0;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  onClick={() => onChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right arrow — mobile only */}
          <button
            onClick={() => scrollByAmount(1)}
            className={`md:hidden absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white via-white/90 to-transparent transition-opacity ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}