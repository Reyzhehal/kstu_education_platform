import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
// import AppButton from "@/components/AppButton"
import "../main.css"
import Sidebar from "@/components/Common/Sidebar"

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
      <div className="container" role="main">
        <Sidebar tab={tab} setTab={setTab} />

        <main className="content">
          <h1>{currentLabel} {t("content.titleSuffix")}</h1>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
