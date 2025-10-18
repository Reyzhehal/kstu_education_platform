import { createFileRoute } from "@tanstack/react-router"
import PlaceholderTranslated from "@/components/Common/PlaceholderTranslated"

export const Route = createFileRoute("/classes")({
  component: () => (
    <PlaceholderTranslated pageKey="tabs.classes" titleKey="pages.classes" />
  ),
})
