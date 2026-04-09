/**
 * LayoutStyles — Extracted from Layout.jsx
 * Contains all global CSS injected via <style> tag.
 * Covers: glassmorphism, button micro-interactions, sidebar overrides,
 * orb animations, mobile responsive fixes.
 */
export default function LayoutStyles() {
  return (
    <style>{`
      :root {
        --primary: 142 76% 36%;
        --primary-foreground: 0 0% 100%;
        --accent: 142 76% 92%;
        --accent-foreground: 142 76% 20%;
        --color-orb-1: #fb923c;
        --color-orb-2: #fdba74;
        --color-primary: #f97316;
        --background: transparent;
      }

      html, body, #root {
        background: #f8fafc;
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
      }

      .fixed {
        pointer-events: auto;
      }

      .fixed > * {
        pointer-events: auto;
      }

      .glass-panel-dark {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.6);
      }

      .dark-cosmos .glass-panel-dark {
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(147, 51, 234, 0.6);
      }

      [role="dialog"],
      .dialog-content,
      form {
        background: rgba(255, 255, 255, 0.98) !important;
        backdrop-filter: blur(20px);
      }

      .dark-cosmos [role="dialog"],
      .dark-cosmos .dialog-content,
      .dark-cosmos form {
        background: rgba(15, 23, 42, 0.98) !important;
      }

      button, .button-premium, a[role="button"] {
        transition: all 0.1s ease-out !important;
        position: relative;
        cursor: pointer !important;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
      }

      button:hover:not(:disabled),
      a[role="button"]:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      button:active:not(:disabled),
      a[role="button"]:active {
        transform: translateY(0px) scale(0.98) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.05s ease-out !important;
      }

      button:active:not(:disabled) *,
      button:active:not(:disabled) span,
      button:active:not(:disabled) svg,
      button:active:not(:disabled) path,
      a:active *,
      a:active span,
      a:active svg,
      a:active path {
        opacity: 1 !important;
        color: inherit !important;
      }

      [data-sidebar] a,
      [data-sidebar] a *,
      [data-sidebar] a > *,
      [data-sidebar] a span,
      [data-sidebar] a svg,
      [data-sidebar] a svg *,
      [data-sidebar] a path,
      [data-sidebar] button,
      [data-sidebar] button *,
      [data-sidebar] button > *,
      [data-sidebar] button span,
      [data-sidebar] button svg,
      [data-sidebar] button svg *,
      [data-sidebar] button path {
        opacity: 1 !important;
        visibility: visible !important;
      }

      [data-sidebar] a:hover,
      [data-sidebar] a:hover > *,
      [data-sidebar] a:hover span,
      [data-sidebar] a:hover svg,
      [data-sidebar] a:hover svg *,
      [data-sidebar] a:hover path,
      [data-sidebar] button:hover,
      [data-sidebar] button:hover *,
      [data-sidebar] button:hover > *,
      [data-sidebar] a:focus,
      [data-sidebar] a:focus *,
      [data-sidebar] a:focus > *,
      [data-sidebar] button:focus,
      [data-sidebar] button:focus *,
      [data-sidebar] button:focus > * {
        opacity: 1 !important;
        visibility: visible !important;
      }

      [data-sidebar] a:active,
      [data-sidebar] a:active > *,
      [data-sidebar] button:active,
      [data-sidebar] button:active > * {
        opacity: 1 !important;
        visibility: visible !important;
        transition: transform 0.1s !important;
      }

      [data-sidebar] a[class*="from-blue-600"],
      [data-sidebar] a[class*="from-blue-600"] *,
      [data-sidebar] a[class*="from-blue-600"] span,
      [data-sidebar] a[class*="from-blue-600"] svg,
      [data-sidebar] a[class*="from-blue-600"] path,
      [data-sidebar] a[class*="bg-gradient"],
      [data-sidebar] a[class*="bg-gradient"] *,
      [data-sidebar] a[class*="bg-gradient"] span,
      [data-sidebar] a[class*="bg-gradient"] svg,
      [data-sidebar] a[class*="bg-gradient"] path {
        opacity: 1 !important;
        color: white !important;
      }

      [data-sidebar] a[class*="from-red-"],
      [data-sidebar] a[class*="from-red-"] *,
      [data-sidebar] a[class*="from-red-"] span,
      [data-sidebar] a[class*="from-red-"] svg,
      [data-sidebar] a[class*="from-red-"] path,
      [data-sidebar] a[class*="bg-red-6"],
      [data-sidebar] a[class*="bg-red-6"] *,
      [data-sidebar] a[class*="bg-red-6"] span,
      [data-sidebar] a[class*="bg-red-6"] svg,
      [data-sidebar] a[class*="bg-red-6"] path {
        opacity: 1 !important;
        color: white !important;
      }

      .bg-red-500,
      .bg-red-500 * {
        opacity: 1 !important;
      }

      button:disabled {
        cursor: not-allowed !important;
        opacity: 0.7 !important;
      }

      svg {
        display: block !important;
      }

      .glass-panel, [role="listbox"], [role="menu"], .card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        touch-action: manipulation;
      }

      li, [role="option"], [role="menuitem"] {
        touch-action: manipulation;
      }

      @keyframes float-badge {
        0%, 100% { transform: translateY(0px); filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2)); }
        50% { transform: translateY(-8px); filter: drop-shadow(0 15px 10px rgba(0,0,0,0.1)); }
      }

      .badge-4d-anim {
        animation: float-badge 4s ease-in-out infinite;
        will-change: transform;
      }

      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes blob-rotate {
        0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        33% { transform: translate(30px, -50px) rotate(120deg) scale(1.2); }
        66% { transform: translate(-20px, 20px) rotate(240deg) scale(0.9); }
        100% { transform: translate(0px, 0px) rotate(360deg) scale(1); }
      }

      .animate-spin-slow { animation: spin-slow 60s linear infinite; }
      .animate-blob-1 { animation: blob-rotate 23s infinite ease-in-out; }
      .animate-blob-2 { animation: blob-rotate 29s infinite ease-in-out reverse; }
      .animate-blob-3 { animation: blob-rotate 31s infinite ease-in-out; }

      @keyframes blob {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }

      .animate-blob { animation: blob 20s ease-in-out infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }

      @media (max-width: 768px) {
        input:not([type="checkbox"]):not([type="radio"]), select, textarea {
          width: 100% !important;
          max-width: 100%;
          box-sizing: border-box;
        }
        .table-responsive-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      }

      [data-sidebar="sidebar"] {
        background: rgba(255, 255, 255, 0.92) !important;
        backdrop-filter: blur(24px) !important;
        -webkit-backdrop-filter: blur(24px) !important;
      }

      [data-state="open"][role="dialog"] {
        background: transparent !important;
      }

      [data-state="open"][role="dialog"] > div:last-child,
      [vaul-drawer] {
        background: rgba(255, 255, 255, 0.96) !important;
        backdrop-filter: blur(24px) !important;
        -webkit-backdrop-filter: blur(24px) !important;
      }

      [data-radix-scroll-area-viewport] {
        background: transparent !important;
      }

      [data-sidebar] button[class*="bg-gradient"],
      [data-sidebar] a[class*="bg-gradient"],
      [data-sidebar] button[class*="from-"],
      [data-sidebar] a[class*="from-"],
      [data-sidebar] button[class*="bg-red"],
      [data-sidebar] a[class*="bg-red"] {
        background: revert !important;
      }

      [data-sidebar] button:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]),
      [data-sidebar] a:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]) {
        background-color: transparent;
      }

      [data-sidebar] button:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]):hover,
      [data-sidebar] a:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]):hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `}</style>
  );
}