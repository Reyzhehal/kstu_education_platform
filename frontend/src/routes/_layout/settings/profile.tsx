import { createFileRoute } from "@tanstack/react-router"
import { UserInformation } from "@/components/UserSettings"

export const Route = createFileRoute("/_layout/settings/profile")({
  component: UserInformation,
})
