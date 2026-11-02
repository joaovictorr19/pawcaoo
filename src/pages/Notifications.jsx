import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Settings, Loader2, CheckCheck } from "lucide-react";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import NotificationCard from "@/components/notifications/NotificationCard";
import NotificationDetailSheet from "@/components/notifications/NotificationDetailSheet";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { groupByDay, notificationType } from "@/components/notifications/notificationTypes";
import "@/components/notifications/notificationsConsole.css";

const HERO_IMAGE = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/274fcfc2d_generated_f9394f35.jpg";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedId, setSelectedId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => getCurrentUser() });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
    initialData: [],
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
  };

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: () => base44.entities.Notification.updateMany(
      { recipient_email: user.email, is_read: false },
      { $set: { is_read: true } }
    ),
    onSuccess: () => {
      refresh();
      toast.success("Todas as notificações marcadas como lidas");
    },
    onError: () => toast.error("Não foi possível marcar as notificações"),
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      refresh();
      toast.success("Notificação eliminada");
    },
  });

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    else setSelectedId(n.id);
  };

  const selectedNotif = notifications.find(n => n.id === selectedId);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter(n => !n.is_read);
    return notifications.filter(n => (n.type || "system") === activeFilter);
  }, [notifications, activeFilter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Filtros construídos a partir dos tipos que realmente existem na conta.
  const categories = useMemo(() => {
    const counts = new Map();
    notifications.forEach((n) => {
      const key = n.type || "system";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([key, count]) => ({ key, count, label: notificationType(key).label }))
      .sort((a, b) => b.count - a.count);
  }, [notifications]);

  const chips = [
    { key: "all", label: "Todas", count: notifications.length },
    { key: "unread", label: "Não lidas", count: unreadCount },
    ...categories,
  ];

  return (
    <div className="nc-page">
      <div className="nc-hero">
        <img src={HERO_IMAGE} alt="" />
      </div>
      <div className="nc-scrim" />

      <div className="nc-in">
        <div className="nc-top nc-a" style={{ animationDelay: '.05s' }}>
          <div>
            <h1 className="nc-h1">Notificações</h1>
            <div className="nc-sub">
              {unreadCount > 0 ? `${unreadCount} por ler` : "Está tudo em dia"}
            </div>
          </div>
          {activeTab === 'list' && unreadCount > 0 && (
            <button
              type="button"
              className="nc-btn"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              aria-label="Marcar todas as notificações como lidas"
            >
              {markAllRead.isPending ? <Loader2 className="animate-spin" /> : <CheckCheck />}
              Marcar todas
            </button>
          )}
        </div>

        <div className="nc-tabs nc-a" style={{ animationDelay: '.15s' }}>
          <button
            type="button"
            className={`nc-tab${activeTab === 'list' ? ' on' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <Bell /> Lista
          </button>
          <button
            type="button"
            className={`nc-tab${activeTab === 'prefs' ? ' on' : ''}`}
            onClick={() => setActiveTab('prefs')}
          >
            <Settings /> Preferências
          </button>
        </div>

        {activeTab === 'prefs' ? (
          <div className="nc-sec" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
            <NotificationPreferences />
          </div>
        ) : (
          <div>
            <div className="nc-chips nc-a" style={{ animationDelay: '.25s' }}>
              {chips.map(f => (
                <button
                  type="button"
                  key={f.key}
                  className={`nc-chip${activeFilter === f.key ? ' on' : ''}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}<b>{f.count}</b>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div>
                {[1, 2, 3, 4].map(i => <div key={i} className="nc-loading" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="nc-sec nc-a" style={{ animationDelay: '.35s' }}>
                <div className="nc-lab">Sem notificações</div>
                <div className="nc-empty">
                  <div className="ring">
                    <Bell />
                  </div>
                  <h3>Sem notificações</h3>
                  <p>{activeFilter === 'unread' ? 'Já viu todas as atualizações.' : 'Está tudo em dia.'}</p>
                </div>
              </div>
            ) : (
              groups.map((group, gi) => (
                <div
                  key={group.label}
                  className="nc-grp nc-a"
                  style={{ animationDelay: `${0.35 + gi * 0.1}s` }}
                >
                  <div className="nc-gl">{group.label}</div>
                  {group.items.map(n => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      onOpen={handleClick}
                      onDelete={(id) => deleteNotif.mutate(id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedNotif && (
        <NotificationDetailSheet
          notification={selectedNotif}
          onClose={() => setSelectedId(null)}
          onOpenLink={(n) => { setSelectedId(null); navigate(n.link); }}
          onMarkRead={(id) => { markRead.mutate(id); setSelectedId(null); }}
          onDelete={(id) => { deleteNotif.mutate(id); setSelectedId(null); }}
        />
      )}
    </div>
  );
}