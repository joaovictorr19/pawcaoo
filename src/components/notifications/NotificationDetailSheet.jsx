import { X, Check, Trash2, ArrowUpRight } from "lucide-react";
import { notificationType, formatNotificationDate } from "@/components/notifications/notificationTypes";
import "@/components/notifications/notificationsConsole.css";

export default function NotificationDetailSheet({ notification, onClose, onOpenLink, onMarkRead, onDelete }) {
  const cfg = notificationType(notification.type);
  const Icon = cfg.icon;

  return (
    <div className="nc-overlay" onClick={onClose}>
      <div className="nc-overlay-inner" onClick={(e) => e.stopPropagation()}>
        <div className="nc-sheet">
          <div className="nc-sh">
            <span>Detalhe</span>
            <button type="button" className="nc-x" aria-label="Fechar" onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="nc-sb">
            <div className="nc-ic">
              <Icon />
            </div>
            <h2>{notification.title || cfg.label}</h2>
            <p className="nc-m">{notification.message}</p>

            <div className="nc-r3">
              <span className="nc-tg">{cfg.label}</span>
              <span className="nc-dt">{formatNotificationDate(notification.created_date)}</span>
            </div>

            <div className="nc-ac">
              {notification.link && (
                <button type="button" className="nc-ab p" onClick={() => onOpenLink(notification)}>
                  Abrir <ArrowUpRight />
                </button>
              )}
              {!notification.is_read && (
                <button type="button" className="nc-ab s" onClick={() => onMarkRead(notification.id)}>
                  <Check /> Marcar como lida
                </button>
              )}
              <button type="button" className="nc-ab d" onClick={() => onDelete(notification.id)}>
                <Trash2 /> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}