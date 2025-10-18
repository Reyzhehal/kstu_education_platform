import { createFileRoute } from "@tanstack/react-router"
import { Appearance } from "@/components/UserSettings"

export const Route = createFileRoute("/_layout/settings/appearance")({
  component: Appearance,
})
