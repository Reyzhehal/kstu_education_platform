import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { StepPublic, StepType } from "@/client"
import {
  ContentService,
  LanguagesService,
  LessonsService,
  StepsService,
} from "@/client"
import {
  LessonNavigationSidebar,
  RichTextEditor,
  StepsNavigation,
} from "@/components/Common"
import useCustomToast from "@/hooks/useCustomToast"
import usePageTitle from "@/hooks/usePageTitle"
import { LANGUAGES_QUERY_KEY } from "@/routes/_layout"
import { withApiBase } from "@/utils"
import styles from "./index.module.css"

// StepType enum значения
const STEP_TYPE_TEXT: StepType = 0
const STEP_TYPE_VIDEO: StepType = 1

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
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [courseId, setCourseId] = useState<string | null>(null)

  usePageTitle(t("lesson.edit.title"))

  const handleLessonSelect = (newLessonId: string) => {
    navigate({ to: `/lesson/${newLessonId}/edit` } as any)
  }

  return (
    <div className={styles.page}>
      <LessonNavigationSidebar
        courseId={courseId}
        currentLessonId={lessonId}
        onLessonSelect={handleLessonSelect}
        onCourseIdFound={setCourseId}
      />
      <div className={styles.mainContent}>
        <LessonStepsEditor
          key={lessonId}
          lessonId={lessonId}
          courseId={courseId}
        />
      </div>
    </div>
  )
}

type LessonStepsEditorProps = {
  lessonId: string
  courseId: string | null
}

function LessonStepsEditor({ lessonId, courseId }: LessonStepsEditorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [showStepTypeModal, setShowStepTypeModal] = useState(false)
  const [showLessonSettings, setShowLessonSettings] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const { data: lessonData } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => LessonsService.readLesson({ lessonId }),
  })

  const { data: languagesData } = useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: () => LanguagesService.readLanguages(),
    staleTime: Infinity,
  })

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
      showSuccessToast(t("lesson.edit.stepAdded"))
    },
    onError: () => {
      showErrorToast(t("lesson.edit.errorAddingStep"))
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
      showSuccessToast(t("lesson.edit.stepUpdated"))
    },
    onError: () => {
      showErrorToast(t("lesson.edit.errorUpdatingStep"))
    },
  })

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      StepsService.deleteStep({ lessonId, stepId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonSteps", lessonId] })
      showSuccessToast(t("lesson.edit.stepDeleted"))
    },
    onError: () => {
      showErrorToast(t("lesson.edit.errorDeletingStep"))
    },
  })

  const updateLessonMutation = useMutation({
    mutationFn: (data: {
      title?: string
      cover_image?: string | null
      language_id?: number
      allow_comments?: boolean
    }) =>
      LessonsService.updateLesson({
        lessonId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courseModules"] })
      showSuccessToast(t("lesson.edit.settingsUpdated"))
      setShowLessonSettings(false)
    },
    onError: () => {
      showErrorToast(t("lesson.edit.errorUpdatingLesson"))
    },
  })

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!courseId) {
        throw new Error("Course ID not found")
      }

      return LessonsService.uploadLessonCover({
        lessonId,
        formData: { file },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courseModules"] })
      showSuccessToast(t("lesson.edit.coverUploaded"))
    },
    onError: () => {
      showErrorToast(t("lesson.edit.errorUploadingCover"))
    },
  })

  const deleteCoverMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) {
        throw new Error("Course ID not found")
      }

      return LessonsService.deleteLessonCover({
        lessonId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courseModules"] })
      showSuccessToast(t("lesson.edit.coverDeleted"))
    },
    onError: () => {
      showErrorToast(t("lesson.edit.errorDeletingCover"))
    },
  })

  const handleAddStep = () => {
    setShowStepTypeModal(true)
  }

  const handleStepTypeSelect = (stepType: string) => {
    const defaultContent =
      stepType === "text"
        ? {
            text: t("lesson.edit.defaultTextContent"),
          }
        : { url: "" }

    createStepMutation.mutate({
      step_type: stepType === "text" ? STEP_TYPE_TEXT : STEP_TYPE_VIDEO,
      content: defaultContent,
    })
    setShowStepTypeModal(false)
    setActiveStepIndex(steps.length)
  }

  const handleUpdateStep = (stepId: string, data: Partial<StepPublic>) => {
    updateStepMutation.mutate({ stepId, data })
  }

  const handleDeleteStep = (stepId: string) => {
    if (confirm(t("lesson.edit.confirmDeleteStep"))) {
      deleteStepMutation.mutate(stepId)
    }
  }

  const steps = stepsData as StepPublic[]
  const activeStep = steps[activeStepIndex]

  useEffect(() => {
    if (steps.length > 0 && activeStepIndex >= steps.length) {
      setActiveStepIndex(steps.length - 1)
    }
  }, [steps.length, activeStepIndex])

  useEffect(() => {
    setHasUnsavedChanges(false)
  }, [])

  return (
    <div className={styles.stepsEditor}>
      <div className={styles.editorHeader}>
        <h1 className={styles.editorTitle}>{t("lesson.edit.title")}</h1>
        <button
          className={styles.settingsButton}
          onClick={() => setShowLessonSettings(!showLessonSettings)}
        >
          {t("lesson.edit.settingsButton")}
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
      <div className={styles.stepsNavigation}>
        <StepsNavigation
          steps={steps}
          activeStepIndex={activeStepIndex}
          onStepClick={setActiveStepIndex}
          mode="edit"
          onAddStep={handleAddStep}
          addStepLabel={t("lesson.edit.addNewStep")}
        />
      </div>

      {/* Редактор активного шага */}
      {activeStep ? (
        <div className={styles.activeStepEditor}>
          <div className={styles.activeStepHeader}>
            <h2 className={styles.activeStepTitle}>
              {activeStep.step_type === STEP_TYPE_TEXT
                ? t("lesson.edit.stepNumberText", {
                    number: activeStepIndex + 1,
                  })
                : t("lesson.edit.stepNumberVideo", {
                    number: activeStepIndex + 1,
                  })}
            </h2>
          </div>
          {activeStep.step_type === STEP_TYPE_TEXT ? (
            <TextStepEditor
              step={activeStep}
              onUpdate={(content) =>
                handleUpdateStep(activeStep.id, { content })
              }
              onSave={() => setHasUnsavedChanges(false)}
              onHasChanges={setHasUnsavedChanges}
            />
          ) : (
            <VideoStepEditor
              step={activeStep}
              onUpdate={(content) =>
                handleUpdateStep(activeStep.id, { content })
              }
            />
          )}
          <div className={styles.activeStepFooter}>
            <div className={styles.activeStepActions}>
              <button
                className={styles.saveStepButton}
                onClick={() => {
                  if (activeStep.step_type === STEP_TYPE_TEXT) {
                    const saveEvent = new CustomEvent("saveStep", {
                      detail: { stepId: activeStep.id },
                    })
                    window.dispatchEvent(saveEvent)
                  } else {
                    handleUpdateStep(activeStep.id, {})
                  }
                }}
                disabled={!hasUnsavedChanges}
                title={t("lesson.edit.saveStep")}
              >
                {t("lesson.edit.saveStep")}
              </button>
              <button
                className={styles.deleteStepButton}
                onClick={() => {
                  handleDeleteStep(activeStep.id)
                  if (activeStepIndex > 0) {
                    setActiveStepIndex(activeStepIndex - 1)
                  }
                }}
                title={t("lesson.edit.deleteStep")}
              >
                × {t("lesson.edit.deleteStep")}
              </button>
            </div>
            <button
              className={styles.backToViewButton}
              onClick={() => navigate({ to: `/lesson/${lessonId}` } as any)}
              title={t("lesson.edit.backToView")}
            >
              ← {t("lesson.edit.backToView")}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>{t("lesson.edit.noSteps")}</p>
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
  const { t } = useTranslation()

  const stepTypes = [
    {
      key: "text",
      title: t("lesson.edit.stepTypeText"),
      description: t("lesson.edit.stepTypeTextDescription"),
      icon: "☰",
    },
    {
      key: "video",
      title: t("lesson.edit.stepTypeVideo"),
      description: t("lesson.edit.stepTypeVideoDescription"),
      icon: "🎬",
    },
  ]

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {t("lesson.edit.selectStepType")}
          </h2>
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
          {/* TODO: Temporary disabled more types */}
          {/* <div className={styles.moreTypes}>+ ещё 18 типов шага</div> */}
        </div>
      </div>
    </div>
  )
}

type TextStepEditorProps = {
  step: StepPublic
  onUpdate: (content: any) => void
  onSave: () => void
  onHasChanges: (hasChanges: boolean) => void
}

function TextStepEditor({
  step,
  onUpdate,
  onSave,
  onHasChanges,
}: TextStepEditorProps) {
  const { t } = useTranslation()
  const content = (step.content || {}) as TextStepContent
  const [text, setText] = useState(content.text || "")
  const previousImagesRef = useRef<Set<string>>(new Set())

  const extractImageUrls = (html: string): Set<string> => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const images = doc.querySelectorAll("img")
    const urls = new Set<string>()

    images.forEach((img) => {
      const src = img.getAttribute("src")
      if (src?.includes("/static/step_images/")) {
        const url = src.replace(import.meta.env.VITE_API_URL || "", "")
        urls.add(url)
      }
    })

    return urls
  }

  useEffect(() => {
    setText(content.text || "")
    previousImagesRef.current = extractImageUrls(content.text || "")
    onHasChanges(false)
  }, [content.text, onHasChanges, extractImageUrls])

  useEffect(() => {
    const hasChanges = text !== content.text
    onHasChanges(hasChanges)
  }, [text, content.text, onHasChanges])

  const handleSave = async () => {
    if (text !== content.text) {
      onUpdate({ text })

      const currentImages = extractImageUrls(text)
      const deletedImages = Array.from(previousImagesRef.current).filter(
        (url) => !currentImages.has(url),
      )

      for (const imageUrl of deletedImages) {
        try {
          await ContentService.deleteContentImage({
            imageUrl,
          })
          console.log(`Deleted unused image: ${imageUrl}`)
        } catch (error) {
          console.error(`Failed to delete image ${imageUrl}:`, error)
        }
      }

      previousImagesRef.current = currentImages

      onSave()
    }
  }

  useEffect(() => {
    const handleSaveEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.stepId === step.id) {
        handleSave()
      }
    }

    window.addEventListener("saveStep", handleSaveEvent)
    return () => window.removeEventListener("saveStep", handleSaveEvent)
  }, [step.id, handleSave])

  const handleImageUpload = async (file: File): Promise<string> => {
    const result = (await ContentService.uploadContentImage({
      formData: { file },
    })) as { url: string }
    return withApiBase(result.url)
  }

  return (
    <div className={styles.textEditor}>
      <RichTextEditor
        content={text}
        onChange={setText}
        placeholder={t("lesson.edit.textPlaceholder")}
        onImageUpload={handleImageUpload}
      />
    </div>
  )
}

type VideoStepEditorProps = {
  step: StepPublic
  onUpdate: (content: any) => void
}

function VideoStepEditor({ step, onUpdate }: VideoStepEditorProps) {
  const { t } = useTranslation()
  const content = (step.content || {}) as VideoStepContent
  const [url, setUrl] = useState(content.url || "")

  useEffect(() => {
    setUrl(content.url || "")
  }, [content.url])

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
        <label className={styles.label}>{t("lesson.edit.videoUrl")}</label>
        <input
          type="url"
          className={styles.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("lesson.edit.videoUrlPlaceholder")}
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
  const { t } = useTranslation()
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

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert(t("lesson.edit.imageFormatError"))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t("lesson.edit.imageSizeError"))
      return
    }

    setIsUploading(true)
    try {
      await onUploadCover(file)
    } catch (error) {
      console.error("Error uploading cover:", error)
      alert(t("lesson.edit.errorUploadingCover"))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteCover = async () => {
    if (!confirm(t("lesson.edit.confirmDeleteCover"))) return

    setIsUploading(true)
    try {
      await onDeleteCover()
      setCoverImage("")
    } catch (error) {
      console.error("Error deleting cover:", error)
      alert(t("lesson.edit.errorDeletingCover"))
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    setCoverImage(lesson.cover_image || "")
  }, [lesson.cover_image])

  return (
    <div className={styles.lessonSettings}>
      <h2 className={styles.settingsTitle}>{t("lesson.edit.basicSettings")}</h2>

      <div className={styles.formField}>
        <label className={styles.label}>{t("lesson.edit.lessonTitle")}</label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("lesson.edit.lessonTitlePlaceholder")}
          maxLength={64}
        />
        <span className={styles.charCount}>{title.length}/64</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.label}>
          {t("lesson.edit.lessonCover")}
          <span className={styles.hint}> {t("lesson.edit.optional")}</span>
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
            {isUploading
              ? t("lesson.edit.uploading")
              : t("lesson.edit.selectFile")}
          </label>
          {coverImage && (
            <button
              type="button"
              onClick={handleDeleteCover}
              disabled={isUploading}
              className={styles.deleteCoverButton}
              title={t("lesson.edit.deleteCover")}
            >
              ✕
            </button>
          )}
        </div>
        {coverImage && (
          <div className={styles.imagePreview}>
            <img
              src={withApiBase(coverImage)}
              alt="Preview"
              className={styles.previewImage}
            />
          </div>
        )}
      </div>

      <div className={styles.formField}>
        <label className={styles.label}>{t("lesson.edit.language")}</label>
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
          {t("lesson.edit.commentsEnabled")}
        </label>
      </div>

      <div className={styles.editorActions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? t("lesson.edit.saving") : t("common.save")}
        </button>
        <button className={styles.cancelButton} onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  )
}
