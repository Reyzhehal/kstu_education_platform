import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/courses/")({
  component: () => (
    <PlaceholderTranslated pageKey="tabs.courses" titleKey="pages.catalog" />
  ),
})
