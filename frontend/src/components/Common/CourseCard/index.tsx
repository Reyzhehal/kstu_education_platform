import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type CoursePublic,
  type CoursesPublic,
  CoursesService,
  UsersService,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { withApiBase } from "@/utils"
import { getFullName } from "@/utils/user"
import styles from "./CourseCard.module.css"

type CourseCardProps = {
  course: CoursePublic
  variant?: "default" | "compact"
}

export default function CourseCard({
  course,
  variant = "default",
}: CourseCardProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isAnimating, setIsAnimating] = useState(false)
  const navigate = useNavigate()
  const coverImage = course.cover_image
    ? withApiBase(course.cover_image)
    : "/assets/images/header-img-night.png"

  const { data: owner } = useQuery({
    queryKey: ["user", course.author_id],
    queryFn: () => UsersService.readUserById({ userId: course.author_id }),
    enabled: Boolean(course.author_id),
  })
  const ownerName = getFullName(owner, { fallback: "Неизвестно" })

  const addToFavorites = useMutation({
    mutationFn: () => CoursesService.addToFavorites({ courseId: course.id }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["courses"] })

      queryClient.setQueriesData<CoursesPublic>(
        { queryKey: ["courses"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: true } : c,
            ),
          }
        },
      )

      await queryClient.cancelQueries({ queryKey: ["favorites"] })

      queryClient.setQueryData<CoursesPublic>(["favorites"], (old) => {
        if (!old) {
          return { data: [{ ...course, is_favorite: true }], count: 1 }
        }
        const exists = old.data.some((c) => c.id === course.id)
        const newData = exists
          ? old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: true } : c,
            )
          : [{ ...course, is_favorite: true }, ...old.data]
        return {
          ...old,
          data: newData,
          count: exists ? old.count : old.count + 1,
        }
      })

      await queryClient.cancelQueries({ queryKey: ["progress"] })
      queryClient.setQueryData<CoursesPublic>(["progress"], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((c) =>
            c.id === course.id ? { ...c, is_favorite: true } : c,
          ),
        }
      })
    },
    onSuccess: () => {
      showSuccessToast(t("catalog.course.addedToFavorites"))
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      showErrorToast(t("catalog.course.favoriteError"))
    },
  })

  const removeFromFavorites = useMutation({
    mutationFn: () =>
      CoursesService.removeFromFavorites({ courseId: course.id }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["courses"] })

      queryClient.setQueriesData<CoursesPublic>(
        { queryKey: ["courses"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: false } : c,
            ),
          }
        },
      )

      await queryClient.cancelQueries({ queryKey: ["favorites"] })

      queryClient.setQueryData<CoursesPublic>(["favorites"], (old) => {
        if (!old) return old
        const newData = old.data.filter((c) => c.id !== course.id)
        return { ...old, data: newData, count: Math.max(0, old.count - 1) }
      })

      await queryClient.cancelQueries({ queryKey: ["progress"] })
      queryClient.setQueryData<CoursesPublic>(["progress"], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((c) =>
            c.id === course.id ? { ...c, is_favorite: false } : c,
          ),
        }
      })
    },
    onSuccess: () => {
      showSuccessToast(t("catalog.course.removedFromFavorites"))
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      showErrorToast(t("catalog.course.favoriteError"))
    },
  })

  const handleFavoriteClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 400)

    if (course.is_favorite) {
      removeFromFavorites.mutate()
    } else {
      addToFavorites.mutate()
    }
  }

  const difficultyLabels = {
    0: t("course.difficulty.beginner", { defaultValue: "Начальный" }),
    1: t("course.difficulty.intermediate", { defaultValue: "Средний" }),
    2: t("course.difficulty.advanced", { defaultValue: "Продвинутый" }),
  }

  const difficultyLevel =
    difficultyLabels[
      course.difficulty_level as keyof typeof difficultyLabels
    ] || difficultyLabels[0]

  return (
    <div
      className={`${styles.root} ${variant === "compact" ? styles.compact : ""} ${variant === "default" ? styles.full : ""}`}
      role="link"
      tabIndex={0}
      onClick={() => navigate({ to: `/promo/${course.id}` })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          navigate({ to: `/promo/${course.id}` })
        }
      }}
    >
      <img className={styles.img} src={coverImage} alt="" />
      <div className={styles.body}>
        <div className={styles.title}>{course.title}</div>
        {variant !== "compact" && (
          <>
            <div className={styles.desc}>
              {(course as any).short_description ?? ""}
            </div>
            <div className={styles.owner}>
              {t("course.card.author", { defaultValue: "Автор:" })}{" "}
              <a
                href={`/profile/${owner?.id ?? course.author_id}`}
                className={styles.ownerLink}
                onClick={(e) => e.stopPropagation()}
              >
                {ownerName}
              </a>
            </div>
          </>
        )}
        <div className={styles.badges}>
          <span className={styles.badge}>{difficultyLevel}</span>
          {course.has_certificate && (
            <span className={styles.badge}>
              🎓 {t("course.certificate", { defaultValue: "Сертификат" })}
            </span>
          )}
          {course.is_enrolled && (
            <span className={`${styles.badge} ${styles.enrolledBadge}`}>
              ✓ {t("course.enrolled", { defaultValue: "Записан" })}
            </span>
          )}
        </div>
        <div className={styles.meta}>
          {course.hours_total
            ? `${course.hours_total} ${t("catalog.course.hoursTotal")}`
            : ""}
          {course.hours_week ? ` · ${course.hours_week} ч/нед` : ""}
          {(course.students_count ?? 0) > 0
            ? ` · ${course.students_count} ${t("course.students", { defaultValue: "студентов" })}`
            : ""}
        </div>
      </div>
      <button
        className={`${styles.like} ${course.is_favorite ? styles.favorite : ""} ${isAnimating ? styles.animate : ""}`}
        title={
          course.is_favorite
            ? t("catalog.course.removeFromWishlist")
            : t("catalog.course.in_favorites")
        }
        aria-label={
          course.is_favorite
            ? t("catalog.course.removeFromWishlist")
            : t("catalog.course.in_favorites")
        }
        onClick={(e) => {
          e.stopPropagation()
          handleFavoriteClick()
        }}
        disabled={addToFavorites.isPending || removeFromFavorites.isPending}
      >
        ❤
      </button>
    </div>
  )
}
