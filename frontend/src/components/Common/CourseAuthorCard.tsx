import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { UsersService, type UserPublic } from "@/client"
import { withApiBase } from "@/utils"

type Props = {
  authorId: string
}

export default function CourseAuthorCard({ authorId }: Props) {
  const { data } = useQuery<UserPublic>({
    queryKey: ["user", authorId],
    queryFn: () => UsersService.readUserById({ userId: authorId }),
    enabled: Boolean(authorId),
  })

  const avatar = data?.avatar_image ? withApiBase(data.avatar_image) : undefined
  const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ") || ""

  return (
    <Link to="/profile/$id" params={{ id: authorId }} className="author-card">
      {avatar ? (
        <img className="author-card__avatar" src={avatar} alt={name} />
      ) : (
        <div className="author-card__avatar author-card__avatar--placeholder" aria-hidden="true">
          {name ? name.slice(0, 1).toUpperCase() : "?"}
        </div>
      )}
      <div className="author-card__name" title={name}>{name}</div>
    </Link>
  )
}


