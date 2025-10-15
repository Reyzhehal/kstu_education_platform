import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_layout/news")({
  component: NewsPage,
})

function NewsPage() {
  const { t } = useTranslation()
  
  return (
    <div style={{ padding: 24 }}>
      <h1>{t("menu.whatsNew")}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}
