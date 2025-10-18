import { createFileRoute } from "@tanstack/react-router"
import ChangePassword from "@/components/UserSettings/ChangePassword"

export const Route = createFileRoute("/_layout/settings/password")({
  component: ChangePassword,
})
