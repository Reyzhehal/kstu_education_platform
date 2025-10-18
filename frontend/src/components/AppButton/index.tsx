import type React from "react"
import styles from "./AppButton.module.css"

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
    styles.root,
    variant === "pill" ? styles.pill : styles.ghost,
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
