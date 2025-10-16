import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { UsersService, type UserPublic } from "@/client"

export const Route = createFileRoute("/_layout/profile/$id")({
  component: ProfileByIdPage,
})

function ProfileByIdPage() {
  const { id } = Route.useParams()

  const { data: user, isLoading, isError } = useQuery<UserPublic>({
    queryKey: ["user", id],
    queryFn: () => UsersService.readUserById({ userId: id }),
  })

  if (isLoading) {
    return <div style={{ padding: 24 }}><p>Загрузка профиля…</p></div>
  }
  if (isError || !user) {
    return <div style={{ padding: 24 }}><p>Пользователь не найден</p></div>
  }

  const apiUrl = import.meta.env.VITE_API_URL || ""
  const avatar = user.avatar_image ? `${apiUrl}/${user.avatar_image}` : "/assets/images/avatar.jpg"

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <img src={avatar} alt="" width={64} height={64} style={{ borderRadius: 12, objectFit: "cover" }} />
        <div>
          <h1 style={{ margin: 0 }}>{user.full_name || user.username || "Профиль"}</h1>
          <div style={{ opacity: .8 }}>{user.email}</div>
        </div>
      </div>
      {user.description ? (
        <p style={{ marginTop: 16, maxWidth: 680, opacity: .9 }}>{user.description}</p>
      ) : null}
    </div>
  )
}

