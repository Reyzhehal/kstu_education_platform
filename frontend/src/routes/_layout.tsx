import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { isLoggedIn } from "@/hooks/useAuth"
import "./main.css"
import LanguageSelect from "@/components/LanguageSelect"
import { UserMenuDropdown } from "@/components/UserMenuDropdown"
import CatalogMenu from "@/components/Common/CatalogMenu"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const { t } = useTranslation()
  const [isCatalogOpen, setCatalogOpen] = useState(false)

  return (
    <div>
      <header className="header" role="banner">
        <nav className="nav" aria-label={t("nav.searchAria")}>
          <button
            className="btn btn-ghost"
            onClick={() => setCatalogOpen((v) => !v)}
            aria-expanded={isCatalogOpen}
            aria-controls="catalog-panel"
          >
            {t("nav.catalog")}
          </button>
          <a href="#" className="active">{t("nav.myLearning")}</a>
          <a href="#">{t("nav.teaching")}</a>
        </nav>
        <form className="search" role="search" aria-label={t("nav.searchAria")} onSubmit={(e) => e.preventDefault()}>
          <input type="search" placeholder={t("nav.searchPlaceholder")!} aria-label={t("nav.searchAria")!} />
        </form>
        <div className="tools">
          <LanguageSelect />
          <UserMenuDropdown />
        </div>
      </header>

      <CatalogMenu open={isCatalogOpen} onClose={() => setCatalogOpen(false)} />

      <Outlet />
    </div>
  )
}

export default Layout
