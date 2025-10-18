import { Container } from "@chakra-ui/react"
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router"
import usePageTitle from "@/hooks/usePageTitle"
import { useTranslation } from "react-i18next"

import Appearance from "@/components/UserSettings/Appearance"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import SocialLinks from "@/components/UserSettings/SocialLinks"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { t } = useTranslation()
  usePageTitle("pages.settings")
  const { user: currentUser } = useAuth()
  const location = useLocation()

  const tabsConfig = [
    { value: "my-profile", title: t("settings.tabs.myProfile"), component: UserInformation },
    { value: "password", title: t("settings.tabs.password"), component: ChangePassword },
    { value: "appearance", title: t("settings.tabs.appearance"), component: Appearance },
    { value: "danger-zone", title: t("settings.tabs.dangerZone"), component: DeleteAccount },
  ]

  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <Container maxW="1100px" mx="auto">
      <div className="settings-layout">
        <aside className="settings-sidebar" aria-label={t("sidebar.menu")!}>
          <nav className="settings-menu">
            <Link to="/settings/profile" className={`menu-btn ${location.pathname === "/settings/profile" ? "active" : ""}`}>{t("settings.tabs.myProfile")}</Link>
            <Link to="/settings/password" className={`menu-btn ${location.pathname === "/settings/password" ? "active" : ""}`}>{t("settings.tabs.password")}</Link>
            <Link to="/settings/social" className={`menu-btn ${location.pathname === "/settings/social" ? "active" : ""}`}>{t("settings.tabs.social", { defaultValue: "Соцсети" })}</Link>
            <Link to="/settings/appearance" className={`menu-btn ${location.pathname === "/settings/appearance" ? "active" : ""}`}>{t("settings.tabs.appearance")}</Link>
            <Link to="/settings/danger" className={`menu-btn ${location.pathname === "/settings/danger" ? "active" : ""}`}>{t("settings.tabs.dangerZone")}</Link>
          </nav>
        </aside>

        <main className="settings-content">
          <Outlet />
        </main>
      </div>
    </Container>
  )
}
