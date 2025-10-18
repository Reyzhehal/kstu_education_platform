import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/courses/progress")({
  component: () => (
    <PlaceholderTranslated pageKey="tabs.progress" titleKey="pages.progress" />
  ),
})
