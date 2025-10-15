import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_layout/notifications")({
  component: NotificationsPage,
})

function NotificationsPage() {
  const { t } = useTranslation()
  
  return (
    <div style={{ padding: 24 }}>
      <h1>{t("tabs.notifications")}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}
