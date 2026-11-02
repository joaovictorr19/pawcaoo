import { X, ArrowUpRight } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { notificationType } from "@/components/notifications/notificationTypes";
import "@/components/notifications/notificationsConsole.css";

function shortDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "d MMM", { locale: pt });
}

export default function NotificationCard({ notification, onOpen, onDelete }) {
  const cfg = notificationType(notification.type);
  const Icon = cfg.icon;
  const unread = !notification.is_read;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(notification);
        }
      }}
      className={`nc-card${unread ? " un" : ""}`}
    >
      <div className="nc-ic">
        <Icon />
      </div>

      <div className="nc-bd">
        <div className="nc-r1">
          <h3 className="nc-h3">{notification.title || cfg.label}</h3>
          <div className="nc-dt">
            {shortDate(notification.created_date)}
            <button
              type="button"
              className="nc-x"
              aria-label="Eliminar notificação"
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
            >
              <X />
            </button>
          </div>
        </div>

        <p className={`nc-m${unread ? "" : " one"}`}>{notification.message}</p>

        <div className="nc-r3">
          <span className="nc-tg">{cfg.label}</span>
          {unread && <span className="nc-nw"><i />Nova</span>}
          {notification.link && (
            <span className="nc-op">
              Abrir <ArrowUpRight />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}