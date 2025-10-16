import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import usePageTitle from "@/hooks/usePageTitle"

export const Route = createFileRoute("/courses/archive")({
  component: () => <PlaceholderTranslated pageKey="tabs.archive" />,
})

function PlaceholderTranslated({ pageKey }: { pageKey: string }) {
  const { t } = useTranslation()
  usePageTitle("pages.archive")
  return (
    <div style={{ padding: 24 }}>
      <h1>{t(pageKey)}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}

