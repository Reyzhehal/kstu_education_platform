import { createFileRoute } from "@tanstack/react-router"
import { ChangePassword } from "@/components/UserSettings"

export const Route = createFileRoute("/_layout/settings/password")({
  component: ChangePassword,
})
