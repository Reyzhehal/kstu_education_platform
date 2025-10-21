import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import type { StepPublic, StepType } from "@/client"
import {
  CoursesService,
  LanguagesService,
  LessonsService,
  ModulesService,
  StepsService,
} from "@/client"
import { RichTextEditor } from "@/components/Common"
import useCustomToast from "@/hooks/useCustomToast"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./edit.module.css"

// StepType enum значения
const STEP_TYPE_TEXT: StepType = 0
const STEP_TYPE_VIDEO: StepType = 1

// Типы для контента шагов
type TextStepContent = {
  text?: string
}

type VideoStepContent = {
  url?: string
}

export const Route = createFileRoute("/_layout/lesson/$lessonId/edit")({
  component: LessonEditPage,
})

function LessonEditPage() {
  const { lessonId } = Route.useParams()

  // Загружаем курс для проверки прав доступа
  // Будем грузить модули, чтобы найти нужный урок и курс
  const [courseId, setCourseId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string>(lessonId)

  usePageTitle("Редактирование урока")

  return (
    <div className={styles.page}>
      <LessonNavigationSidebar
        courseId={courseId}
        currentLessonId={currentLessonId}
        onLessonSelect={setCurrentLessonId}
        onCourseIdFound={setCourseId}
      />
      <div className={styles.mainContent}>
        <LessonStepsEditor lessonId={currentLessonId} courseId={courseId} />
      </div>
    </div>
  )
}

type LessonNavigationSidebarProps = {
  courseId: string | null
  currentLessonId: string
  onLessonSelect: (lessonId: string) => void
  onCourseIdFound: (courseId: string) => void
}

function LessonNavigationSidebar({
  courseId,
  currentLessonId,
  onLessonSelect,
  onCourseIdFound,
}: LessonNavigationSidebarProps) {
  // Получаем список всех курсов пользователя, чтобы найти нужный
  const { data: coursesData } = useQuery({
    queryKey: ["authorCourses"],
    queryFn: () => CoursesService.readAuthorCourses({ skip: 0, limit: 100 }),
  })

  // Находим курс по lessonId через модули
  const { data: modules } = useQuery({
    queryKey: ["courseModules", courseId],
    queryFn: () =>
      courseId ? ModulesService.readCourseModules({ courseId }) : null,
    enabled: !!courseId,
  })

  // Находим courseId если еще не нашли
  useQuery({
    queryKey: ["findCourseByLesson", currentLessonId],
    queryFn: async () => {
      if (!coursesData?.data) return null
      for (const course of coursesData.data) {
        const mods = await ModulesService.readCourseModules({
          courseId: course.id,
        })
        for (const mod of mods) {
          const lesson = mod.lessons?.find((l: any) => l.id === currentLessonId)
          if (lesson) {
            onCourseIdFound(course.id)
            return course.id
          }
        }
      }
      return null
    },
    enabled: !courseId && !!coursesData,
  })

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Содержание курса</h2>
      </div>
      <div className={styles.modulesList}>
        {modules?.map((module: any, moduleIndex: number) => (
          <div key={module.id} className={styles.module}>
            <div className={styles.moduleTitle}>
              {moduleIndex + 1}. {module.title}
            </div>
            <ul className={styles.lessonsList}>
              {module.lessons?.map((lesson: any, lessonIndex: number) => (
                <li
                  key={lesson.id}
                  className={`${styles.lessonItem} ${
                    lesson.id === currentLessonId ? styles.active : ""
                  }`}
                  onClick={() => onLessonSelect(lesson.id)}
                >
                  <span className={styles.lessonNumber}>
                    {moduleIndex + 1}.{lessonIndex + 1}
                  </span>
                  <span className={styles.lessonTitle}>{lesson.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}

type LessonStepsEditorProps = {
  lessonId: string
  courseId: string | null
}

function LessonStepsEditor({ lessonId, courseId }: LessonStepsEditorProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [showStepTypeModal, setShowStepTypeModal] = useState(false)
  const [showLessonSettings, setShowLessonSettings] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  // Загружаем данные урока
  const { data: lessonData } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => LessonsService.modulesReadLessonById({ lessonId }),
  })

  // Загружаем список языков
  const { data: languagesData } = useQuery({
    queryKey: ["languages"],
    queryFn: () => LanguagesService.readLanguages(),
  })

  // Загружаем шаги урока
  const { data: stepsData = [] } = useQuery({
    queryKey: ["lessonSteps", lessonId],
    queryFn: () => StepsService.readLessonSteps({ lessonId }),
  })

  const createStepMutation = useMutation({
    mutationFn: (data: {
      step_type: StepType
      title?: string | null
      content: any
    }) =>
      StepsService.createStep({
        lessonId,
        requestBody: {
          step_type: data.step_type,
          title: data.title || null,
          position: stepsData.length,
          content: data.content,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonSteps", lessonId] })
      showSuccessToast("Шаг добавлен")
    },
    onError: () => {
      showErrorToast("Ошибка при добавлении шага")
    },
  })

  const updateStepMutation = useMutation({
    mutationFn: ({
      stepId,
      data,
    }: {
      stepId: string
      data: Partial<StepPublic>
    }) =>
      StepsService.updateStep({
        lessonId,
        stepId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonSteps", lessonId] })
      showSuccessToast("Шаг обновлен")
    },
    onError: () => {
      showErrorToast("Ошибка при обновлении шага")
    },
  })

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      StepsService.deleteStep({ lessonId, stepId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonSteps", lessonId] })
      showSuccessToast("Шаг удален")
    },
    onError: () => {
      showErrorToast("Ошибка при удалении шага")
    },
  })

  const updateLessonMutation = useMutation({
    mutationFn: (data: {
      title?: string
      cover_image?: string | null
      language_id?: number
      allow_comments?: boolean
    }) =>
      LessonsService.modulesUpdateLessonById({
        lessonId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courseModules"] })
      showSuccessToast("Настройки урока обновлены")
      setShowLessonSettings(false)
    },
    onError: () => {
      showErrorToast("Ошибка при обновлении урока")
    },
  })

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!courseId) {
        throw new Error("Course ID not found")
      }

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/modules/lessons/${lessonId}/cover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error("Failed to upload cover")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courseModules"] })
      showSuccessToast("Обложка загружена")
    },
    onError: () => {
      showErrorToast("Ошибка при загрузке обложки")
    },
  })

  const deleteCoverMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) {
        throw new Error("Course ID not found")
      }

      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/modules/lessons/${lessonId}/cover`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to delete cover")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courseModules"] })
      showSuccessToast("Обложка удалена")
    },
    onError: () => {
      showErrorToast("Ошибка при удалении обложки")
    },
  })

  const handleAddStep = () => {
    setShowStepTypeModal(true)
  }

  const handleStepTypeSelect = (stepType: string) => {
    const defaultContent =
      stepType === "text"
        ? {
            text: "Вы можете добавить в этот шаг текст, а также изображения, математические формулы, примеры кода и многое другое.",
          }
        : { url: "" }

    createStepMutation.mutate({
      step_type: stepType === "text" ? STEP_TYPE_TEXT : STEP_TYPE_VIDEO,
      content: defaultContent,
    })
    setShowStepTypeModal(false)
    // Активируем новый шаг после создания
    setActiveStepIndex(steps.length)
  }

  const handleUpdateStep = (stepId: string, data: Partial<StepPublic>) => {
    updateStepMutation.mutate({ stepId, data })
  }

  const handleDeleteStep = (stepId: string) => {
    if (confirm("Вы уверены, что хотите удалить этот шаг?")) {
      deleteStepMutation.mutate(stepId)
    }
  }

  const steps = stepsData as StepPublic[]
  const activeStep = steps[activeStepIndex]

  // Корректируем activeStepIndex если он больше количества шагов
  useEffect(() => {
    if (steps.length > 0 && activeStepIndex >= steps.length) {
      setActiveStepIndex(steps.length - 1)
    }
  }, [steps.length, activeStepIndex])

  return (
    <div className={styles.stepsEditor}>
      <div className={styles.editorHeader}>
        <h1 className={styles.editorTitle}>Редактирование урока</h1>
        <button
          className={styles.settingsButton}
          onClick={() => setShowLessonSettings(!showLessonSettings)}
        >
          ⚙️ Настройки урока
        </button>
      </div>

      {showLessonSettings && lessonData && (
        <LessonSettingsCard
          lesson={lessonData}
          languages={languagesData?.data || []}
          onSave={(data) => updateLessonMutation.mutate(data)}
          onCancel={() => setShowLessonSettings(false)}
          isLoading={updateLessonMutation.isPending}
          onUploadCover={async (file) => {
            await uploadCoverMutation.mutateAsync(file)
          }}
          onDeleteCover={async () => {
            await deleteCoverMutation.mutateAsync()
          }}
        />
      )}

      {/* Горизонтальная панель шагов */}
      <div className={styles.stepsBar}>
        {steps.map((step: StepPublic, index: number) => (
          <div key={step.id} className={styles.stepContainer}>
            <span className={styles.stepLabel}>{index + 1}</span>
            <button
              className={`${styles.stepSquare} ${
                index === activeStepIndex ? styles.stepSquareActive : ""
              } ${step.step_type === STEP_TYPE_VIDEO ? styles.stepSquareVideo : ""}`}
              onClick={() => setActiveStepIndex(index)}
              title={`Шаг ${index + 1}: ${step.step_type === STEP_TYPE_TEXT ? "Текст" : "Видео"}`}
            >
              {step.step_type === STEP_TYPE_VIDEO ? (
                <svg
                  className={styles.stepSquareIcon}
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              ) : (
                <svg
                  className={styles.stepSquareIcon}
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
        ))}
        <div className={styles.stepContainer}>
          <span className={styles.stepLabel}>&nbsp;</span>
          <button
            className={`${styles.stepSquare} ${styles.stepSquareAdd}`}
            onClick={handleAddStep}
            title="Добавить новый шаг"
          >
            <span className={styles.stepSquarePlus}>+</span>
          </button>
        </div>
      </div>

      {/* Редактор активного шага */}
      {activeStep ? (
        <div className={styles.activeStepEditor}>
          <div className={styles.activeStepHeader}>
            <h2 className={styles.activeStepTitle}>
              Шаг {activeStepIndex + 1}:{" "}
              {activeStep.step_type === STEP_TYPE_TEXT ? "Текст" : "Видео"}
            </h2>
            <button
              className={styles.deleteStepButton}
              onClick={() => {
                handleDeleteStep(activeStep.id)
                if (activeStepIndex > 0) {
                  setActiveStepIndex(activeStepIndex - 1)
                }
              }}
              title="Удалить шаг"
            >
              × Удалить
            </button>
          </div>
          {activeStep.step_type === STEP_TYPE_TEXT ? (
            <TextStepEditor
              step={activeStep}
              onUpdate={(content) =>
                handleUpdateStep(activeStep.id, { content })
              }
            />
          ) : (
            <VideoStepEditor
              step={activeStep}
              onUpdate={(content) =>
                handleUpdateStep(activeStep.id, { content })
              }
            />
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Шагов пока нет. Добавьте первый шаг.</p>
        </div>
      )}

      {showStepTypeModal && (
        <StepTypeModal
          onClose={() => setShowStepTypeModal(false)}
          onSelect={handleStepTypeSelect}
        />
      )}
    </div>
  )
}

type StepTypeModalProps = {
  onClose: () => void
  onSelect: (stepType: string) => void
}

function StepTypeModal({ onClose, onSelect }: StepTypeModalProps) {
  const stepTypes = [
    {
      key: "text",
      title: "Текст",
      description: "Текст с форматированием, изображениями, формулами",
      icon: "☰",
    },
    {
      key: "video",
      title: "Видео",
      description: "Загружайте видео",
      icon: "🎬",
    },
  ]

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Выберите тип шага</h2>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.stepTypeGrid}>
            {stepTypes.map((type) => (
              <button
                key={type.key}
                className={styles.stepTypeCard}
                onClick={() => onSelect(type.key)}
              >
                <div className={styles.stepTypeIcon}>{type.icon}</div>
                <div className={styles.stepTypeInfo}>
                  <div className={styles.stepTypeTitle}>{type.title}</div>
                  <div className={styles.stepTypeDescription}>
                    {type.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className={styles.moreTypes}>+ ещё 18 типов шага</div>
        </div>
      </div>
    </div>
  )
}

type TextStepEditorProps = {
  step: StepPublic
  onUpdate: (content: any) => void
}

function TextStepEditor({ step, onUpdate }: TextStepEditorProps) {
  const content = (step.content || {}) as TextStepContent
  const [text, setText] = useState(content.text || "")

  // Синхронизируем текст при смене шага
  useEffect(() => {
    setText(content.text || "")
  }, [content.text])

  // Автосохранение с задержкой
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== content.text) {
        onUpdate({ text })
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [text, content.text, onUpdate])

  return (
    <div className={styles.textEditor}>
      <RichTextEditor
        content={text}
        onChange={setText}
        placeholder="Введите текст шага..."
      />
    </div>
  )
}

type VideoStepEditorProps = {
  step: StepPublic
  onUpdate: (content: any) => void
}

function VideoStepEditor({ step, onUpdate }: VideoStepEditorProps) {
  const content = (step.content || {}) as VideoStepContent
  const [url, setUrl] = useState(content.url || "")

  // Синхронизируем URL при смене шага
  useEffect(() => {
    setUrl(content.url || "")
  }, [content.url])

  // Автосохранение с задержкой
  useEffect(() => {
    const timer = setTimeout(() => {
      if (url !== content.url) {
        onUpdate({ url })
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [url, content.url, onUpdate])

  return (
    <div className={styles.videoEditor}>
      <div className={styles.formField}>
        <label className={styles.label}>URL видео (YouTube)</label>
        <input
          type="url"
          className={styles.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
      {url?.includes("youtube.com") && (
        <div className={styles.videoPreview}>
          <div className={styles.videoEmbed}>
            <iframe
              width="100%"
              height="400"
              src={url.replace("watch?v=", "embed/")}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}

type LessonSettingsCardProps = {
  lesson: any
  languages: any[]
  onSave: (data: any) => void
  onCancel: () => void
  isLoading: boolean
  onUploadCover: (file: File) => Promise<void>
  onDeleteCover: () => Promise<void>
}

function LessonSettingsCard({
  lesson,
  languages,
  onSave,
  onCancel,
  isLoading,
  onUploadCover,
  onDeleteCover,
}: LessonSettingsCardProps) {
  const [title, setTitle] = useState(lesson.title || "")
  const [coverImage, setCoverImage] = useState(lesson.cover_image || "")
  const [languageId, setLanguageId] = useState(lesson.language_id || 1)
  const [allowComments, setAllowComments] = useState(
    lesson.allow_comments ?? true,
  )
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    onSave({
      title,
      language_id: languageId,
      allow_comments: allowComments,
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert("Пожалуйста, выберите изображение в формате JPEG, PNG или WEBP")
      return
    }

    // Проверяем размер файла (5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5 МБ")
      return
    }

    setIsUploading(true)
    try {
      await onUploadCover(file)
      // URL обновится через рефреш данных
    } catch (error) {
      console.error("Error uploading cover:", error)
      alert("Ошибка при загрузке обложки")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteCover = async () => {
    if (!confirm("Удалить обложку урока?")) return

    setIsUploading(true)
    try {
      await onDeleteCover()
      setCoverImage("")
    } catch (error) {
      console.error("Error deleting cover:", error)
      alert("Ошибка при удалении обложки")
    } finally {
      setIsUploading(false)
    }
  }

  // Обновляем локальное состояние при изменении lesson.cover_image
  useEffect(() => {
    setCoverImage(lesson.cover_image || "")
  }, [lesson.cover_image])

  return (
    <div className={styles.lessonSettings}>
      <h2 className={styles.settingsTitle}>Основные настройки</h2>

      <div className={styles.formField}>
        <label className={styles.label}>Название урока</label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите название урока"
          maxLength={64}
        />
        <span className={styles.charCount}>{title.length}/64</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.label}>
          Обложка урока
          <span className={styles.hint}> (необязательно)</span>
        </label>
        <div className={styles.fileUploadWrapper}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className={styles.fileInput}
            id="cover-upload"
          />
          <label htmlFor="cover-upload" className={styles.fileInputLabel}>
            {isUploading ? "Загрузка..." : "Выбрать файл"}
          </label>
          {coverImage && (
            <button
              type="button"
              onClick={handleDeleteCover}
              disabled={isUploading}
              className={styles.deleteCoverButton}
              title="Удалить обложку"
            >
              ✕
            </button>
          )}
        </div>
        {coverImage && (
          <div className={styles.imagePreview}>
            <img
              src={
                coverImage.startsWith("/")
                  ? `http://localhost:8000${coverImage}`
                  : coverImage
              }
              alt="Preview"
              className={styles.previewImage}
            />
          </div>
        )}
      </div>

      <div className={styles.formField}>
        <label className={styles.label}>Язык</label>
        <select
          className={styles.select}
          value={languageId}
          onChange={(e) => setLanguageId(parseInt(e.target.value, 10))}
        >
          {languages.map((lang: any) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            className={styles.checkbox}
          />
          Комментарии включены
        </label>
      </div>

      <div className={styles.editorActions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? "Сохранение..." : "Сохранить"}
        </button>
        <button className={styles.cancelButton} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  )
}
