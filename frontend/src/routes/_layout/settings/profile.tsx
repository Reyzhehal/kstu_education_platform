import { createFileRoute } from "@tanstack/react-router"
import UserInformation from "@/components/UserSettings/UserInformation"

export const Route = createFileRoute("/_layout/settings/profile")({
  component: UserInformation,
})
