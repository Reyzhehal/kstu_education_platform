import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CoursesService, type CoursePublic, type CoursesPublic } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

type CourseCardProps = {
  course: CoursePublic
}

export default function CourseCard({ course }: CourseCardProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isAnimating, setIsAnimating] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL || ""
  const coverImage = course.cover_image ? `${apiUrl}/${course.cover_image}` : "/assets/images/header-img-night.png"
  
  const addToFavorites = useMutation({
    mutationFn: () => CoursesService.addToFavorites({ courseId: course.id }),
    onMutate: async () => {
      // Оптимистически обновляем состояние в кэше для каталогов
      await queryClient.cancelQueries({ queryKey: ["courses"] })
      
      queryClient.setQueriesData<CoursesPublic>(
        { queryKey: ["courses"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: true } : c
            ),
          }
        }
      )

      // Оптимистически обновляем для списка избранных
      await queryClient.cancelQueries({ queryKey: ["favorites"] })
      
      queryClient.setQueryData<CoursesPublic>(
        ["favorites"],
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: true } : c
            ),
          }
        }
      )
    },
    onSuccess: () => {
      showSuccessToast(t("catalog.course.addedToFavorites"))
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      showErrorToast(t("catalog.course.favoriteError"))
    },
  })

  const removeFromFavorites = useMutation({
    mutationFn: () => CoursesService.removeFromFavorites({ courseId: course.id }),
    onMutate: async () => {
      // Оптимистически обновляем состояние в кэше для каталогов
      await queryClient.cancelQueries({ queryKey: ["courses"] })
      
      queryClient.setQueriesData<CoursesPublic>(
        { queryKey: ["courses"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: false } : c
            ),
          }
        }
      )

      // Оптимистически обновляем для списка избранных (не удаляем, а меняем флаг)
      await queryClient.cancelQueries({ queryKey: ["favorites"] })
      
      queryClient.setQueryData<CoursesPublic>(
        ["favorites"],
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === course.id ? { ...c, is_favorite: false } : c
            ),
          }
        }
      )
    },
    onSuccess: () => {
      showSuccessToast(t("catalog.course.removedFromFavorites"))
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
  
  return (
    <div className="course-card">
      <img className="course-card__img" src={coverImage} alt="" />
      <div className="course-card__body">
        <div className="course-card__title">{course.title}</div>
        <div className="course-card__desc">{course.description ?? ""}</div>
        <div className="course-card__meta">{course.hours_total ?? 0} {t("catalog.course.hoursTotal")}</div>
      </div>
      <button 
        className={`course-card__like ${course.is_favorite ? "is-favorite" : ""} ${isAnimating ? "animate" : ""}`}
        title={course.is_favorite ? t("catalog.course.removeFromWishlist") : t("catalog.course.in_favorites")} 
        aria-label={course.is_favorite ? t("catalog.course.removeFromWishlist") : t("catalog.course.in_favorites")}
        onClick={handleFavoriteClick}
        disabled={addToFavorites.isPending || removeFromFavorites.isPending}
      >
        ❤
      </button>
    </div>
  )
}

