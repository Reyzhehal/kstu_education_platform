type HasName = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export function getFullName(
  user?: HasName | null,
  options?: { fallback?: string },
): string {
  const spaceJoined = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
  if (spaceJoined) return spaceJoined
  if (user?.email) return user.email
  return options?.fallback ?? "?"
}

export function getInitial(
  user?: HasName | null,
  options?: { fallback?: string },
): string {
  const name = getFullName(user, options)
  return name.trim().charAt(0).toUpperCase() || (options?.fallback ?? "?")
}
