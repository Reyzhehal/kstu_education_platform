import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/classes")({
  component: () => <PlaceholderTranslated pageKey="tabs.classes" />,
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

