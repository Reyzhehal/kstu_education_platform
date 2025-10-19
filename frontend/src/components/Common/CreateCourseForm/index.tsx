import { Button, Input, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { CoursesService } from "@/client"
import { Field } from "@/components/ui/field"
import useCustomToast from "@/hooks/useCustomToast"
import styles from "./CreateCourseForm.module.css"

interface CreateCourseFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface CourseCreateForm {
  title: string
}

const CreateCourseForm = ({ onSuccess, onCancel }: CreateCourseFormProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [charCount, setCharCount] = useState(0)
  const maxChars = 64

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CourseCreateForm) =>
      CoursesService.createCourse({ requestBody: data as any }),
    onSuccess: () => {
      showSuccessToast(t("course.createSuccess"))
      queryClient.invalidateQueries({ queryKey: ["authorCourses"] })
      reset()
      setCharCount(0)
      onSuccess?.()
    },
    onError: (err: any) => {
      const errDetail = err.body?.detail || t("common.error")
      showErrorToast(errDetail)
    },
  })

  const onSubmit: SubmitHandler<CourseCreateForm> = async (data) => {
    mutation.mutate(data)
  }

  const handleCancel = () => {
    reset()
    setCharCount(0)
    onCancel?.()
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("course.createTitle")}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Field
          label={t("course.courseName")}
          required
          invalid={!!errors.title}
          errorText={errors.title?.message}
        >
          <Input
            id="title"
            {...register("title", {
              required: t("forms.required")!,
              maxLength: {
                value: maxChars,
                message: t("course.maxLength", { max: maxChars }),
              },
            })}
            placeholder={t("course.courseNamePlaceholder")!}
            type="text"
            onChange={(e) => {
              register("title").onChange(e)
              setCharCount(e.target.value.length)
            }}
          />
          <div className={styles.charCounter}>
            {charCount}/{maxChars}
          </div>
        </Field>

        <div className={styles.infoSection}>
          <Text fontSize="sm" color="gray.600" mb={2}>
            {t("course.draftInfo")}
          </Text>
        </div>

        <div className={styles.actions}>
          <Button
            variant="solid"
            colorPalette="teal"
            type="submit"
            loading={isSubmitting}
          >
            {t("course.createButton")}
          </Button>
          <Button onClick={handleCancel} variant="ghost">
            {t("settings.buttons.cancel")}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateCourseForm
