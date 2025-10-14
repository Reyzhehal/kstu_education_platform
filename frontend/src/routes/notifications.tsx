import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/notifications")({
  component: () => <PlaceholderTranslated pageKey="tabs.notifications" />,
})

function PlaceholderTranslated({ pageKey }: { pageKey: string }) {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 24 }}>
      <h1>{t(pageKey)}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}

