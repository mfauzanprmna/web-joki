import Link from "next/link";
import type { OrderNotification } from "@/lib/order-notifications";
import { FaBell, FaHourglassEnd, FaArrowRotateRight, FaCalendarDay, FaArrowRight } from "react-icons/fa6";
import type { IconType } from "react-icons";

const KIND_ICON: Record<OrderNotification["kind"], IconType> = {
    deadline: FaHourglassEnd,
    reset: FaArrowRotateRight,
    event: FaCalendarDay,
};

export function OrderNotifications({ notifications, role }: {
    notifications: OrderNotification[];
    role: "admin" | "worker";
}) {
    const visibleNotifications = notifications.slice(0, 12);

    return (
        <section className="mb-7">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="font-display text-sm font-semibold text-shihu-text flex items-center gap-2">
                        <FaBell className="text-shihu-corona text-[13px]" aria-hidden="true" />
                        Notifikasi pengerjaan
                    </p>
                    <p className="text-shihu-faint text-xs mt-0.5">Pengingat order yang mendekati batas waktu dan jadwal konten.</p>
                </div>
                {notifications.length > 12 && <span className="text-xs text-shihu-faint">+{notifications.length - 12} lainnya</span>}
            </div>

            {visibleNotifications.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 text-sm text-shihu-muted">
                    Belum ada pengingat untuk order aktif.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {visibleNotifications.map((notification) => {
                        const Icon = KIND_ICON[notification.kind];
                        return (
                            <Link
                                key={notification.id}
                                href={`${role === "admin" ? "/admin/progress" : "/worker/orders"}/${notification.orderId}`}
                                className={`bg-shihu-card border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-shihu-corona/50 transition-colors ${notification.tone === "urgent" ? "border-red-400/35" : "border-shihu-border"
                                    }`}
                            >
                                <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${notification.tone === "urgent" ? "bg-red-400/15 text-red-400" : "bg-shihu-corona/15 text-shihu-corona"}`}
                                >
                                    <Icon className="text-xs" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-display font-semibold text-shihu-text truncate">
                                        {notification.orderCode} · {notification.title}
                                    </p>
                                    <p className="text-[11px] text-shihu-muted mt-0.5">{notification.detail}</p>
                                </div>
                                <span className="text-[10px] text-shihu-faint shrink-0 flex items-center gap-1">
                                    Buka <FaArrowRight className="text-[9px]" aria-hidden="true" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}