import { useState, useEffect, useRef } from "react"
import { Link } from "@tanstack/react-router"
import useAuth from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"
import UserAvatar from "./UserAvatar"

type MenuItemProps = {
  label: string
  to?: string
  onClick?: () => void
}

function MenuItem({ label, to, onClick }: MenuItemProps) {
  const button = (
    <button onClick={onClick} className="user-menu-item">
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    window.location.href = "/login"
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div className="user-menu-dropdown" ref={dropdownRef}>
      <UserAvatar size={32} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="user-menu-panel">
          <MenuItem label={t("menu.profile", { defaultValue: "Профиль" })} to={user ? `/profile/${user.id}` : "/login"} />
          <MenuItem label={t("menu.settings", { defaultValue: "Настройки" })} to="/settings" />
          <MenuItem label={t("menu.notifications", { defaultValue: "Уведомления" })} to="/notifications" />
          <MenuItem label={t("menu.whatsNew", { defaultValue: "Что нового" })} to="/news" />
          <MenuItem label={t("menu.logout", { defaultValue: "Выход" })} onClick={handleLogout} />
        </div>
      )}
    </div>
  )
}


