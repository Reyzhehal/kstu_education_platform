import { useTranslation } from "react-i18next"
import styles from "./Pagination.module.css"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation()
  return (
    <div className={styles.root}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`${styles.btn} ${p === currentPage ? styles.active : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      {currentPage < totalPages && (
        <button
          className={styles.btn}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t("catalog.pagination.next")}
        </button>
      )}
    </div>
  )
}
