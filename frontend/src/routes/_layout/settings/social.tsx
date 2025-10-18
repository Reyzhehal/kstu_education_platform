import { createFileRoute } from "@tanstack/react-router"
import { SocialLinks } from "@/components/UserSettings"

export const Route = createFileRoute("/_layout/settings/social")({
  component: SocialLinks,
})
