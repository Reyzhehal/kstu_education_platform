import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import UserAvatar from "./UserAvatar"

type MenuItemProps = {
  label: string
  to?: string
  onClick?: () => void
}

function MenuItem({ label, to, onClick }: MenuItemProps) {
  const button = (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        background: "transparent",
        color: "#e8e8ea",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )

  if (to) {
    return <Link to={to}>{button}</Link>
  }

  return button
}

export function UserMenuDropdown() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation("common")

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    window.location.href = "/login"
  }

  return (
    <div style={{ position: "relative" }}>
      <UserAvatar size={32} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 40,
            background: "#1b1c20",
            border: "1px solid #2a2b30",
            borderRadius: 8,
            width: 180,
            padding: 8,
          }}
        >
          <MenuItem label={t("menu.profile", { defaultValue: "Профиль" })} to="/profile" />
          <MenuItem label={t("menu.settings", { defaultValue: "Настройки" })} to="/settings" />
          <MenuItem label={t("menu.notifications", { defaultValue: "Уведомления" })} to="/notifications" />
          <MenuItem label={t("menu.whatsNew", { defaultValue: "Что нового" })} to="/news" />
          <MenuItem label={t("menu.logout", { defaultValue: "Выход" })} onClick={handleLogout} />
        </div>
      )}
    </div>
  )
}


