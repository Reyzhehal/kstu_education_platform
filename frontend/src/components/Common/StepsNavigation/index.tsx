import type { StepPublic } from "@/client"
import styles from "./StepsNavigation.module.css"

type StepsNavigationProps = {
  steps: StepPublic[]
  activeStepIndex: number
  onStepClick: (index: number) => void
  mode?: "view" | "edit"
  onAddStep?: () => void
  addStepLabel?: string
  completedStepIds?: string[]
}

const _STEP_TYPE_TEXT = 0
const STEP_TYPE_VIDEO = 1

export default function StepsNavigation({
  steps,
  activeStepIndex,
  onStepClick,
  mode = "view",
  onAddStep,
  addStepLabel,
  completedStepIds = [],
}: StepsNavigationProps) {
  const isStepCompleted = (stepId: string) => {
    return completedStepIds.includes(stepId)
  }

  return (
    <div className={styles.stepsBar}>
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex
        const isCompleted = isStepCompleted(step.id)

        return (
          <button
            key={step.id}
            className={`${styles.stepSquare} ${
              isActive ? styles.stepSquareActive : ""
            } ${isCompleted ? styles.stepSquareCompleted : ""} ${
              step.step_type === STEP_TYPE_VIDEO ? styles.stepSquareVideo : ""
            }`}
            onClick={() => onStepClick(index)}
            title={`Шаг ${index + 1}`}
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
        )
      })}
      {mode === "edit" && onAddStep && (
        <button
          className={`${styles.stepSquare} ${styles.stepSquareAdd}`}
          onClick={onAddStep}
          title={addStepLabel}
        >
          <span className={styles.stepSquarePlus}>+</span>
        </button>
      )}
    </div>
  )
}
