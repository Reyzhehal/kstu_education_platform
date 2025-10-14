import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import AppButton from "@/components/AppButton"
import "../main.css"
import LanguageSelect from "@/components/LanguageSelect"

export const Route = createFileRoute("/_layout/")({
  component: IndexPage,
})

function IndexPage() {
  const { t } = useTranslation()
  const tabs = useMemo(
    () => [
      { key: "learn", label: t("tabs.learn") },
      { key: "courses", label: t("tabs.courses") },
      { key: "progress", label: t("tabs.progress") },
      { key: "favorites", label: t("tabs.favorites") },
      { key: "wishlist", label: t("tabs.wishlist") },
      { key: "archive", label: t("tabs.archive") },
      { key: "classes", label: t("tabs.classes") },
      { key: "notifications", label: t("tabs.notifications") },
    ],
    [t]
  )
  const [tab, setTab] = useState<string>("learn")

  const currentLabel = tabs.find((t) => t.key === tab)?.label ?? tabs[0].label
  const renderContent = () => {
    switch (tab) {
      case "courses":
        return <p>{t("content.coursesListSoon")}</p>
      case "progress":
        return <p>{t("content.yourProgress")}</p>
      case "favorites":
        return <p>{t("content.favorites")}</p>
      case "wishlist":
        return <p>{t("content.wishlist")}</p>
      case "archive":
        return <p>{t("content.archive")}</p>
      case "classes":
        return <p>{t("content.classes")}</p>
      case "notifications":
        return <p>{t("content.notifications")}</p>
      default:
        return <p>{t("content.welcome")}</p>
    }
  }
  return (
    <div>
      <header className="header" role="banner">
        <nav className="nav" aria-label={t("nav.searchAria")}>
          <a href="#">{t("nav.catalog")}</a>
          <a href="#" className="active">{t("nav.myLearning")}</a>
          <a href="#">{t("nav.teaching")}</a>
        </nav>
        <form className="search" role="search" aria-label={t("nav.searchAria")} onSubmit={(e) => e.preventDefault()}>
          <input type="search" placeholder={t("nav.searchPlaceholder")!} aria-label={t("nav.searchAria")!} />
        </form>
        <div className="tools">
          <LanguageSelect />
          <span className="avatar" aria-hidden="true">R</span>
        </div>
      </header>

      <div className="container" role="main">
        <aside className="sidebar" aria-label={t("nav.sidebarAria")}>
          <div className="sidebar__hero" aria-hidden="true" />
          <ul className="menu">
            {tabs.map((t) => (
              <li key={t.key}>
                <AppButton
                  variant="ghost"
                  className={`menu-btn${t.key === tab ? " active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </AppButton>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <h1>{currentLabel} {t("content.titleSuffix")}</h1>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
