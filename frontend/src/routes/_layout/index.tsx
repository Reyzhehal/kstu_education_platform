import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/")({
  beforeLoad: async () => {
    throw redirect({
      to: "/main",
    })
  },
})
