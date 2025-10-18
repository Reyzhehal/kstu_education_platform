import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/courses/archive")({
  component: () => (
    <PlaceholderTranslated pageKey="tabs.archive" titleKey="pages.archive" />
  ),
})
