import { useTranslation } from "react-i18next"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation()

  return (
    <div className="pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`page-btn ${p === currentPage ? "is-active" : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      {currentPage < totalPages && (
        <button className="page-btn" onClick={() => onPageChange(currentPage + 1)}>
          {t("catalog.pagination.next")}
        </button>
      )}
    </div>
  )
}

