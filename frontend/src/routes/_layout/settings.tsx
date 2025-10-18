import { Container } from "@chakra-ui/react"
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import Appearance from "@/components/UserSettings/Appearance"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import useAuth from "@/hooks/useAuth"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./settings.module.css"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { t } = useTranslation()
  usePageTitle("pages.settings")
  const { user: currentUser } = useAuth()
  const location = useLocation()

  const tabsConfig = [
    {
      value: "my-profile",
      title: t("settings.tabs.myProfile"),
      component: UserInformation,
    },
    {
      value: "password",
      title: t("settings.tabs.password"),
      component: ChangePassword,
    },
    {
      value: "appearance",
      title: t("settings.tabs.appearance"),
      component: Appearance,
    },
    {
      value: "danger-zone",
      title: t("settings.tabs.dangerZone"),
      component: DeleteAccount,
    },
  ]

  const _finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <Container maxW="1100px" mx="auto">
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label={t("sidebar.menu")!}>
          <nav className={styles.menu}>
            <Link
              to="/settings/profile"
              className={`${styles.menuBtn} ${location.pathname === "/settings/profile" ? styles.menuBtnActive : ""}`}
            >
              {t("settings.tabs.myProfile")}
            </Link>
            <Link
              to="/settings/password"
              className={`${styles.menuBtn} ${location.pathname === "/settings/password" ? styles.menuBtnActive : ""}`}
            >
              {t("settings.tabs.password")}
            </Link>
            <Link
              to="/settings/social"
              className={`${styles.menuBtn} ${location.pathname === "/settings/social" ? styles.menuBtnActive : ""}`}
            >
              {t("settings.tabs.social", { defaultValue: "Соцсети" })}
            </Link>
            <Link
              to="/settings/appearance"
              className={`${styles.menuBtn} ${location.pathname === "/settings/appearance" ? styles.menuBtnActive : ""}`}
            >
              {t("settings.tabs.appearance")}
            </Link>
            <Link
              to="/settings/danger"
              className={`${styles.menuBtn} ${location.pathname === "/settings/danger" ? styles.menuBtnActive : ""}`}
            >
              {t("settings.tabs.dangerZone")}
            </Link>
          </nav>
        </aside>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </Container>
  )
}
