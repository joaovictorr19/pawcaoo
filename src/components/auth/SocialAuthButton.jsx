import React from "react";

const TONES = {
  light: "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  dark: "bg-slate-900 border-slate-900 text-white hover:bg-black",
};

export default function SocialAuthButton({ onClick, label, children, tone = "light" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-12 flex items-center justify-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9483]/30 ${TONES[tone]}`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{children}</span>
      {label}
    </button>
  );
}