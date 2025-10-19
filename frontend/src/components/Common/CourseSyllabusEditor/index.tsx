import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ModulesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import styles from "./CourseSyllabusEditor.module.css"

type CourseSyllabusEditorProps = {
  courseId: string
  onCancel: () => void
}

type Module = {
  id?: string
  title: string
  description: string
  position: number
  lessons: Lesson[]
  isExpanded?: boolean
  course_id?: string
}

type Lesson = {
  id?: string
  title: string
  position: number
  module_id?: string
  allow_comments?: boolean
}

export default function CourseSyllabusEditor({
  courseId,
  onCancel,
}: CourseSyllabusEditorProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Загружаем модули из API
  const { data: loadedModules } = useQuery({
    queryKey: ["courseModules", courseId],
    queryFn: () => ModulesService.readCourseModules({ courseId }),
  })

  const [modules, setModules] = useState<Module[]>([
    {
      id: `temp-${crypto.randomUUID()}`,
      title: t("course.syllabus.newModule"),
      description: "",
      position: 0,
      lessons: [],
      isExpanded: true,
    },
  ])

  // Обновляем modules при загрузке данных
  useEffect(() => {
    if (loadedModules && loadedModules.length > 0) {
      setModules(loadedModules.map((m: any) => ({ ...m, isExpanded: true })))
    } else if (loadedModules) {
      // Если модулей нет, показываем один пустой
      setModules([
        {
          id: `temp-${crypto.randomUUID()}`,
          title: t("course.syllabus.newModule"),
          description: "",
          position: 0,
          lessons: [],
          isExpanded: true,
        },
      ])
    }
  }, [loadedModules, t])

  const [newLessonTitle, setNewLessonTitle] = useState<{
    [key: number]: string
  }>({})

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        id: `temp-${crypto.randomUUID()}`,
        title: t("course.syllabus.newModule"),
        description: "",
        position: modules.length,
        lessons: [],
        isExpanded: true,
      },
    ])
  }

  const handleUpdateModule = (
    index: number,
    field: keyof Module,
    value: any,
  ) => {
    const updatedModules = [...modules]
    updatedModules[index] = {
      ...updatedModules[index],
      [field]: value,
    }
    setModules(updatedModules)
  }

  const handleDeleteModule = async (index: number) => {
    const module = modules[index]

    // Если модуль уже сохранен в БД, удаляем через API
    if (module.id && !module.id.startsWith("temp-")) {
      try {
        await ModulesService.deleteModule({
          courseId,
          moduleId: module.id,
        })
      } catch (error) {
        console.error("Error deleting module:", error)
        showErrorToast(t("common.error"))
        return
      }
    }

    setModules(modules.filter((_, i) => i !== index))
  }

  const handleToggleModule = (index: number) => {
    handleUpdateModule(index, "isExpanded", !modules[index].isExpanded)
  }

  const handleAddLesson = (moduleIndex: number) => {
    const lessonTitle = newLessonTitle[moduleIndex] || ""
    if (!lessonTitle.trim()) {
      showErrorToast(t("course.syllabus.lessonTitleRequired"))
      return
    }

    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons.push({
      id: `temp-${crypto.randomUUID()}`,
      title: lessonTitle,
      position: updatedModules[moduleIndex].lessons.length,
    })
    setModules(updatedModules)
    setNewLessonTitle({ ...newLessonTitle, [moduleIndex]: "" })
  }

  const handleUpdateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: any,
  ) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      [field]: value,
    }
    setModules(updatedModules)
  }

  const handleDeleteLesson = async (
    moduleIndex: number,
    lessonIndex: number,
  ) => {
    const module = modules[moduleIndex]
    const lesson = module.lessons[lessonIndex]

    // Если урок уже сохранен в БД, удаляем через API
    if (
      lesson.id &&
      !lesson.id.startsWith("temp-") &&
      module.id &&
      !module.id.startsWith("temp-")
    ) {
      try {
        await ModulesService.deleteLesson({
          courseId,
          moduleId: module.id,
          lessonId: lesson.id,
        })
      } catch (error) {
        console.error("Error deleting lesson:", error)
        showErrorToast(t("common.error"))
        return
      }
    }

    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons = updatedModules[
      moduleIndex
    ].lessons.filter((_, i) => i !== lessonIndex)
    setModules(updatedModules)
  }

  const handleSave = async () => {
    try {
      // Обрабатываем каждый модуль
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i]

        let moduleId = module.id

        // Если модуль новый (нет id или id начинается с temp-)
        if (!moduleId || moduleId.startsWith("temp-")) {
          // Создаем новый модуль
          const createdModule = await ModulesService.createModule({
            courseId,
            requestBody: {
              title: module.title,
              description: module.description || undefined,
              position: i,
            },
          })
          moduleId = createdModule.id
        } else {
          // Обновляем существующий модуль
          await ModulesService.updateModule({
            courseId,
            moduleId,
            requestBody: {
              title: module.title,
              description: module.description || undefined,
              position: i,
            },
          })
        }

        // Обрабатываем уроки модуля
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j]

          if (!lesson.id || lesson.id.startsWith("temp-")) {
            // Создаем новый урок
            await ModulesService.createLesson({
              courseId,
              moduleId,
              requestBody: {
                title: lesson.title,
                position: j,
                allow_comments: true,
              },
            })
          } else {
            // Обновляем существующий урок
            await ModulesService.updateLesson({
              courseId,
              moduleId,
              lessonId: lesson.id,
              requestBody: {
                title: lesson.title,
                position: j,
              },
            })
          }
        }
      }

      // Инвалидируем кеш для перезагрузки данных
      queryClient.invalidateQueries({ queryKey: ["courseModules", courseId] })

      showSuccessToast(t("course.syllabus.saveSuccess"))
      onCancel()
    } catch (error) {
      console.error("Error saving modules:", error)
      showErrorToast(t("common.error"))
    }
  }

  return (
    <div className={styles.root}>
      <h2>{t("course.syllabus.editTitle")}</h2>

      <div className={styles.modulesList}>
        {modules.map((module, moduleIndex) => (
          <div key={moduleIndex} className={styles.module}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleHeaderTop}>
                <button
                  className={styles.toggleButton}
                  onClick={() => handleToggleModule(moduleIndex)}
                >
                  {module.isExpanded ? "▼" : "▶"}
                </button>
                <span className={styles.moduleNumber}>{moduleIndex + 1}.</span>
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) =>
                    handleUpdateModule(moduleIndex, "title", e.target.value)
                  }
                  placeholder={t("course.syllabus.moduleTitlePlaceholder")}
                  className={styles.moduleTitleInput}
                />
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteModule(moduleIndex)}
                  title={t("common.delete")}
                >
                  ×
                </button>
              </div>

              {module.isExpanded && (
                <input
                  type="text"
                  value={module.description}
                  onChange={(e) =>
                    handleUpdateModule(
                      moduleIndex,
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder={t(
                    "course.syllabus.moduleDescriptionPlaceholder",
                  )}
                  className={styles.moduleDescriptionInput}
                />
              )}
            </div>

            {module.isExpanded && (
              <div className={styles.lessonsContainer}>
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lessonIndex} className={styles.lesson}>
                    <span className={styles.dragHandle}>⋮⋮</span>
                    <span className={styles.lessonIcon}>📄</span>
                    <span className={styles.lessonNumber}>
                      {moduleIndex + 1}.{lessonIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) =>
                        handleUpdateLesson(
                          moduleIndex,
                          lessonIndex,
                          "title",
                          e.target.value,
                        )
                      }
                      className={styles.lessonTitleInput}
                    />
                    <button
                      className={styles.editLessonButton}
                      title={t("common.edit")}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteLessonButton}
                      onClick={() =>
                        handleDeleteLesson(moduleIndex, lessonIndex)
                      }
                      title={t("common.delete")}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className={styles.addLesson}>
                  <span className={styles.lessonIcon}>📄</span>
                  <input
                    type="text"
                    value={newLessonTitle[moduleIndex] || ""}
                    onChange={(e) =>
                      setNewLessonTitle({
                        ...newLessonTitle,
                        [moduleIndex]: e.target.value,
                      })
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddLesson(moduleIndex)
                      }
                    }}
                    placeholder={t("course.syllabus.addLessonPlaceholder")}
                    className={styles.addLessonInput}
                  />
                  <button
                    className={styles.addLessonButton}
                    onClick={() => handleAddLesson(moduleIndex)}
                  >
                    + {t("course.syllabus.addLesson")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className={styles.addModuleButton} onClick={handleAddModule}>
        + {t("course.syllabus.addModule")}
      </button>

      <div className={styles.actions}>
        <button className={styles.saveButton} onClick={handleSave}>
          {t("common.save")}
        </button>
        <button className={styles.cancelButton} onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  )
}
