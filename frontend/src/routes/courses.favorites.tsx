import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/courses/favorites")({
  component: () => (
    <PlaceholderTranslated
      pageKey="tabs.favorites"
      titleKey="pages.favorites"
    />
  ),
})
