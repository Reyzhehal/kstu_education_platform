import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import UserAvatar from "./UserAvatar"

export function UserMenuDropdown() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation("common")

  return (
    <div style={{ position: "relative" }}>
      <UserAvatar size={32} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div style={{ position: "absolute", right: 0, top: 40, background: "#1b1c20", border: "1px solid #2a2b30", borderRadius: 8, width: 180, padding: 8 }}>
          <ProfileItem label={t("menu.profile", { defaultValue: "Профиль" })} />
          <SettingsItem label={t("menu.settings", { defaultValue: "Настройки" })} />
          <NotificationsItem label={t("menu.notifications", { defaultValue: "Уведомления" })} />
          <WhatsNewItem label={t("menu.whatsNew", { defaultValue: "Что нового" })} />
          <LogoutItem label={t("menu.logout", { defaultValue: "Выход" })} />
        </div>
      )}
    </div>
  )
}

export function ProfileItem({ label }: { label: string }) {
  return (
    <Link to="/profile">
      <MenuRow dotColor="#4caf50" label={label} />
    </Link>
  )
}

export function SettingsItem({ label }: { label: string }) {
  return (
    <Link to="/settings">
      <MenuRow dotColor="#4caf50" label={label} />
    </Link>
  )
}

export function NotificationsItem({ label }: { label: string }) {
  return (
    <Link to="/notifications">
      <MenuRow label={label} />
    </Link>
  )
}

export function WhatsNewItem({ label }: { label: string }) {
  return (
    <Link to="/news">
      <MenuRow dotColor="#7f7fff" label={label} />
    </Link>
  )
}

export function LogoutItem({ label }: { label: string }) {
  return <MenuRow label={label} onClick={() => localStorage.removeItem("access_token")} />
}

function MenuRow({ label, onClick, dotColor }: { label: string; onClick?: () => void; dotColor?: string }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "8px 10px", background: "transparent", color: "#e8e8ea", border: "none", display: "flex", alignItems: "center", gap: 8, borderRadius: 6 }}>
      {dotColor && <span style={{ width: 8, height: 8, borderRadius: 4, background: dotColor }} />}
      {label}
    </button>
  )
}


