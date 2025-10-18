import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { type UserPublic, UsersService } from "@/client"
import { withApiBase } from "@/utils"
import { getFullName } from "@/utils/user"
import styles from "./CourseAuthorCard.module.css"

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
  const name = getFullName(data, { fallback: "" })

  return (
    <Link to="/profile/$id" params={{ id: authorId }} className={styles.root}>
      {avatar ? (
        <img className={styles.avatar} src={avatar} alt={name} />
      ) : (
        <div
          className={`${styles.avatar} ${styles.avatarPlaceholder}`}
          aria-hidden="true"
        >
          {name ? name.slice(0, 1).toUpperCase() : "?"}
        </div>
      )}
      <div className={styles.name} title={name}>
        {name}
      </div>
    </Link>
  )
}
