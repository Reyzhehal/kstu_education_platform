import type React from "react"

type AppButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  ariaLabel?: string
  className?: string
  variant?: "pill" | "ghost"
  type?: "button" | "submit" | "reset"
}

export function AppButton({
  children,
  onClick,
  ariaLabel,
  className,
  variant = "pill",
  type = "button",
}: AppButtonProps) {
  const classes = [
    "btn",
    variant === "pill" ? "btn-pill" : "btn-ghost",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </button>
  )
}

export default AppButton
