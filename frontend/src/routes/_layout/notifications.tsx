import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/_layout/notifications")({
  component: () => (
    <PlaceholderTranslated
      pageKey="tabs.notifications"
      titleKey="tabs.notifications"
    />
  ),
})
