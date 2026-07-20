import React from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

const COUNTRY_LINKS = [
  { path: "/portugal", label: "Portugal", flag: "🇵🇹" },
  { path: "/espanha", label: "España", flag: "🇪🇸" },
  { path: "/franca", label: "France", flag: "🇫🇷" },
];

export default function CountryNavLinks({ variant = "footer" }) {
  if (variant === "bar") {
    return (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Globe className="w-4 h-4 text-slate-500 mr-1" />
        {COUNTRY_LINKS.map((c) => (
          <Link
            key={c.path}
            to={c.path}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-white/60 hover:bg-white hover:text-teal-700 border border-slate-200/60 transition-all"
          >
            <span>{c.flag}</span>
            {c.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        Países
      </h4>
      <ul className="space-y-2 text-sm text-gray-600">
        {COUNTRY_LINKS.map((c) => (
          <li key={c.path}>
            <Link to={c.path} className="hover:text-green-600 transition-colors inline-flex items-center gap-1.5">
              <span>{c.flag}</span>
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}