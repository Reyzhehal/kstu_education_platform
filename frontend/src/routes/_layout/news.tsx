import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/_layout/news")({
  component: () => (
    <PlaceholderTranslated pageKey="menu.whatsNew" titleKey="menu.whatsNew" />
  ),
})
