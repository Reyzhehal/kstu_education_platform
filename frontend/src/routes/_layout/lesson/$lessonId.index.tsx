import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { StepPublic } from "@/client"
import {
  CoursesService,
  LessonsService,
  ModulesService,
  StepsService,
  UsersService,
} from "@/client"
import { LessonNavigationSidebar, StepsNavigation } from "@/components/Common"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./index.module.css"

export const Route = createFileRoute("/_layout/lesson/$lessonId/")({
  component: LessonViewPage,
})

function LessonViewPage() {
  const { lessonId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [courseId, setCourseId] = useState<string | null>(null)

  usePageTitle(t("lesson.view.title"))

  const handleLessonSelect = (newLessonId: string) => {
    navigate({ to: "/lesson/$lessonId", params: { lessonId: newLessonId } })
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
        <LessonStepsViewer
          key={lessonId}
          lessonId={lessonId}
          courseId={courseId}
        />
      </div>
    </div>
  )
}

type LessonStepsViewerProps = {
  lessonId: string
  courseId: string | null
}

function LessonStepsViewer({ lessonId, courseId }: LessonStepsViewerProps) {
  const { t } = useTranslation()
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const queryClient = useQueryClient()
  const markedStepsRef = useRef<Set<string>>(new Set())

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => UsersService.readUserMe(),
    retry: false,
  })

  const { data: stepsData = [] } = useQuery({
    queryKey: ["lessonSteps", lessonId],
    queryFn: () => StepsService.readLessonSteps({ lessonId }),
  })

  const markStepCompleted = useMutation({
    mutationFn: (stepId: string) =>
      StepsService.markStepCompleted({ lessonId, stepId }),
    onSuccess: () => {
      // Обновляем кеш шагов чтобы получить обновленный is_completed
      queryClient.invalidateQueries({
        queryKey: ["lessonSteps", lessonId],
      })
    },
  })

  const { data: lessonData } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => LessonsService.readLesson({ lessonId }),
  })

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () =>
      courseId ? CoursesService.readCourseById({ courseId }) : null,
    enabled: !!courseId,
  })

  const { data: modules } = useQuery({
    queryKey: ["courseModules", courseId],
    queryFn: () =>
      courseId ? ModulesService.readCourseModules({ courseId }) : null,
    enabled: !!courseId,
  })

  const isAuthor = currentUser && course && currentUser.id === course.author_id

  const steps = stepsData as StepPublic[]
  const activeStep = steps[activeStepIndex]

  useEffect(() => {
    markedStepsRef.current.clear()
  }, [])

  useEffect(() => {
    if (activeStep && currentUser) {
      const isAlreadyCompleted = (activeStep as any).is_completed || false
      const alreadyMarked = markedStepsRef.current.has(activeStep.id)

      console.log("Step progress check:", {
        stepId: activeStep.id,
        isAlreadyCompleted,
        alreadyMarked,
        isPending: markStepCompleted.isPending,
      })

      if (
        !isAlreadyCompleted &&
        !alreadyMarked &&
        !markStepCompleted.isPending
      ) {
        console.log("Marking step as completed:", activeStep.id)
        markedStepsRef.current.add(activeStep.id)
        markStepCompleted.mutate(activeStep.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeStep?.id,
    currentUser?.id,
    markStepCompleted,
    currentUser,
    activeStep,
  ])

  const getNextStep = () => {
    if (activeStepIndex < steps.length - 1) {
      return { type: "step", index: activeStepIndex + 1 }
    }

    if (!modules) return null

    let foundCurrentLesson = false
    for (const module of modules as any[]) {
      for (const lesson of module.lessons || []) {
        if (foundCurrentLesson) {
          return { type: "lesson", lessonId: lesson.id }
        }
        if (lesson.id === lessonId) {
          foundCurrentLesson = true
        }
      }
    }

    return null
  }

  const navigate = useNavigate()

  const handleNextStep = () => {
    const nextStep = getNextStep()
    if (nextStep) {
      if (nextStep.type === "step" && "index" in nextStep) {
        setActiveStepIndex(nextStep.index as number)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else if (nextStep.type === "lesson" && "lessonId" in nextStep) {
        navigate({
          to: "/lesson/$lessonId",
          params: { lessonId: nextStep.lessonId as string },
        })
      }
    }
  }

  const nextStep = getNextStep()

  return (
    <div className={styles.stepsViewer}>
      <div className={styles.viewerHeader}>
        <h1 className={styles.viewerTitle}>{lessonData?.title}</h1>
      </div>

      {/* Навигация по шагам */}
      <div className={styles.stepsNavigation}>
        <StepsNavigation
          steps={steps}
          activeStepIndex={activeStepIndex}
          onStepClick={setActiveStepIndex}
          mode="view"
          completedStepIds={steps
            .filter((s) => (s as any).is_completed)
            .map((s) => s.id)}
        />
      </div>

      {/* Контент активного шага */}
      {activeStep ? (
        <div className={styles.activeStepViewer}>
          <div className={styles.stepContent}>
            {activeStep.step_type === 0 ? (
              <TextStepContent step={activeStep} />
            ) : (
              <VideoStepContent step={activeStep} />
            )}
          </div>

          {/* Кнопки навигации */}
          {(isAuthor || nextStep) && (
            <div className={styles.stepFooter}>
              {isAuthor && (
                <Link
                  to="/lesson/$lessonId/edit"
                  params={{ lessonId }}
                  className={styles.editButton}
                >
                  ✏️ {t("lesson.view.editLesson")}
                </Link>
              )}
              {nextStep && (
                <button
                  className={styles.nextStepButton}
                  onClick={handleNextStep}
                >
                  {t("lesson.edit.nextStep")} →
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>{t("lesson.edit.noSteps")}</p>
        </div>
      )}
    </div>
  )
}

type TextStepContent = {
  text?: string
}

type TextStepContentProps = {
  step: StepPublic
}

function TextStepContent({ step }: TextStepContentProps) {
  const content = (step.content || {}) as TextStepContent
  return (
    <div
      className={styles.textContent}
      dangerouslySetInnerHTML={{ __html: content.text || "" }}
    />
  )
}

type VideoStepContent = {
  url?: string
}

type VideoStepContentProps = {
  step: StepPublic
}

function VideoStepContent({ step }: VideoStepContentProps) {
  const { t } = useTranslation()
  const content = (step.content || {}) as VideoStepContent

  if (!content.url) {
    return (
      <div className={styles.emptyState}>
        <p>{t("lesson.view.noVideoUrl")}</p>
      </div>
    )
  }

  const getYouTubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = getYouTubeId(content.url)

  if (!videoId) {
    return (
      <div className={styles.emptyState}>
        <p>{t("lesson.view.invalidVideoUrl")}</p>
      </div>
    )
  }

  return (
    <div className={styles.videoContainer}>
      <iframe
        width="100%"
        height="500"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
