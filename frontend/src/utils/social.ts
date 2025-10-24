export function extractSegmentGeneric(
  value?: string | null,
): string | null | undefined {
  if (!value) return value as any
  const trimmed = String(value).trim()
  if (!trimmed) return trimmed as any
  const cleaned = trimmed.replace(/^@+/, "")
  const parts = cleaned.split(/\//).filter(Boolean)
  return parts[parts.length - 1]
}

export function extractHandle(url?: string | null): string | null | undefined {
  if (!url) return url as any
  const s = String(url).trim().replace(/^@+/, "")
  if (!s) return s as any
  try {
    if (s.startsWith("http")) {
      const u = new URL(s)
      const last = u.pathname.split("/").filter(Boolean).pop()
      return last || s
    }
  } catch {}
  return s
}

export const extractGithubUser = extractHandle

export function extractYoutubeHandle(
  url?: string | null,
): string | null | undefined {
  if (!url) return url as any
  const s = String(url).trim()
  const handle = extractHandle(s)
  return String(handle || "").replace(/^@+/, "") as any
}

export function sanitizeWebsite(
  url?: string | null,
): string | null | undefined {
  if (!url) return url as any
  const s = String(url).trim()
  if (!s) return s as any
  if (!/^https?:\/\//i.test(s)) return `https://${s}`
  return s
}

export function buildTelegramUrl(
  handle?: string | null,
): string | null | undefined {
  if (!handle) return handle as any
  const h = String(handle).replace(/^@+/, "")
  return `https://t.me/${h}`
}

export function buildGithubUrl(
  user?: string | null,
): string | null | undefined {
  if (!user) return user as any
  return `https://github.com/${String(user).replace(/^@+/, "")}`
}

export function buildYoutubeUrl(
  handle?: string | null,
): string | null | undefined {
  if (!handle) return handle as any
  const h = String(handle)
  const clean = h.startsWith("@") ? h : `@${h}`
  return `https://youtube.com/${clean}`
}

export function extractLastSegment(url: string): string {
  try {
    const u = new URL(url)
    const seg = u.pathname.split("/").filter(Boolean).pop() || ""
    return seg || url
  } catch {
    return url
  }
}

export function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
