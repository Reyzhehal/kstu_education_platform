import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { UserPublic } from "@/client"
import { UsersService as Users } from "@/client"
import { withApiBase } from "@/utils"
import { getInitial } from "@/utils/user"
import styles from "./UserAvatar.module.css"

type Props = {
  size?: number
  onClick?: () => void
}

const palette = [
  "#8a8aff",
  "#ff8a8a",
  "#8affc1",
  "#ffd28a",
  "#8ad2ff",
  "#d48aff",
]

export default function UserAvatar({ size = 32, onClick }: Props) {
  const me = useQuery({ queryKey: ["currentUser"], queryFn: Users.readUserMe })
  const user = (me.data as UserPublic) || null
  const [bg] = useState(
    () => palette[Math.floor(Math.random() * palette.length)],
  )
  const initial = useMemo(() => getInitial(user), [user])
  const url = user?.avatar_image ? withApiBase(user.avatar_image) : undefined

  const className = `${styles.avatar} ${onClick ? styles.clickable : styles.default}`

  const style: React.CSSProperties = {
    width: size,
    height: size,
    background: url ? `url(${url}) center/cover no-repeat` : bg,
  }

  return (
    <div
      className={className}
      style={style}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label="User avatar"
    >
      {!user?.avatar_image ? initial : null}
    </div>
  )
}
