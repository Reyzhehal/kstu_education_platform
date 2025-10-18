import { createFileRoute } from "@tanstack/react-router"
import { DeleteAccount } from "@/components/UserSettings"

export const Route = createFileRoute("/_layout/settings/danger")({
  component: DeleteAccount,
})
