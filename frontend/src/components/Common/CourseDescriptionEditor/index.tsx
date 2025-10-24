import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { type CoursePublic, CoursesService, LanguagesService } from "@/client"
import { RichTextEditor } from "@/components/Common"
import useCustomToast from "@/hooks/useCustomToast"
import { LANGUAGES_QUERY_KEY } from "@/routes/_layout"
import { withApiBase } from "@/utils"
import styles from "./CourseDescriptionEditor.module.css"

type CourseDescriptionEditorProps = {
  course: CoursePublic
  onCancel: () => void
}

export default function CourseDescriptionEditor({
  course,
  onCancel,
}: CourseDescriptionEditorProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(course.title || "")
  const [coverImage, setCoverImage] = useState(course.cover_image || "")
  const [isUploading, setIsUploading] = useState(false)
  const [shortDescription, setShortDescription] = useState(
    (course as any).short_description || "",
  )
  const [description, setDescription] = useState(course.description || "")
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(
    (course as any).what_you_will_learn || "",
  )
  const [targetAudience, setTargetAudience] = useState(
    (course as any).target_audience || "",
  )
  const [requirements, setRequirements] = useState(
    (course as any).requirements || "",
  )
  const [howItWorks, setHowItWorks] = useState(
    (course as any).how_it_works || "",
  )
  const [whatYouGet, setWhatYouGet] = useState(
    (course as any).what_you_get || "",
  )
  const [languageId, setLanguageId] = useState(course.language_id || 1)
  const [difficultyLevel, setDifficultyLevel] = useState(
    course.difficulty_level || 0,
  )
  const [hoursWeek, setHoursWeek] = useState(
    course.hours_week?.toString() || "",
  )

  useEffect(() => {
    setCoverImage(course.cover_image || "")
  }, [course.cover_image])

  const { data: languagesData } = useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: () => LanguagesService.readLanguages(),
    staleTime: Infinity,
  })

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      return CoursesService.uploadCourseCover({
        courseId: course.id,
        formData: { file },
      })
    },
    onSuccess: (data) => {
      setCoverImage(data.cover_image || "")
      showSuccessToast(t("course.coverUploaded"))
      queryClient.invalidateQueries({ queryKey: ["course", course.id] })
      queryClient.invalidateQueries({ queryKey: ["authorCourses"] })
    },
    onError: (err: any) => {
      const errDetail = err.message || t("common.error")
      showErrorToast(errDetail)
    },
  })

  const deleteCoverMutation = useMutation({
    mutationFn: async () => {
      return CoursesService.deleteCourseCover({
        courseId: course.id,
      })
    },
    onSuccess: () => {
      setCoverImage("")
      showSuccessToast(t("course.coverDeleted"))
      queryClient.invalidateQueries({ queryKey: ["course", course.id] })
      queryClient.invalidateQueries({ queryKey: ["authorCourses"] })
    },
    onError: (err: any) => {
      const errDetail = err.message || t("common.error")
      showErrorToast(errDetail)
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: (data: any) =>
      CoursesService.updateCourse({
        courseId: course.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast(t("course.descriptionSaved"))
      queryClient.invalidateQueries({ queryKey: ["course", course.id] })
      queryClient.invalidateQueries({ queryKey: ["authorCourses"] })
      onCancel()
    },
    onError: (err: any) => {
      const errDetail = err.body?.detail || t("common.error")
      showErrorToast(errDetail)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showErrorToast(t("course.coverImageFormatError"))
      return
    }

    // Check file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast(t("course.coverImageSizeError"))
      return
    }

    setIsUploading(true)
    try {
      await uploadCoverMutation.mutateAsync(file)
    } catch (error) {
      console.error("Error uploading cover:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteCover = async () => {
    if (!confirm(t("course.coverDeleteConfirm"))) return

    setIsUploading(true)
    try {
      await deleteCoverMutation.mutateAsync()
    } catch (error) {
      console.error("Error deleting cover:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = () => {
    // Check minimum short description length
    if (shortDescription && shortDescription.length < 100) {
      showErrorToast(
        t("course.publishErrorShortDesc", { current: shortDescription.length }),
      )
      return
    }

    const data: any = {
      title,
      description,
      short_description: shortDescription || undefined,
      what_you_will_learn: whatYouWillLearn || undefined,
      target_audience: targetAudience || undefined,
      requirements: requirements || undefined,
      how_it_works: howItWorks || undefined,
      what_you_get: whatYouGet || undefined,
      language_id: languageId,
      difficulty_level: difficultyLevel,
    }

    if (hoursWeek) data.hours_week = parseInt(hoursWeek, 10)

    updateCourseMutation.mutate(data)
  }

  return (
    <div className={styles.root}>
      <h1>{t("course.editDescription")}</h1>

      <div className={styles.section}>
        <h2>{t("course.aboutCourse")}</h2>

        {/* Course logo */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.logo")}
            <span className={styles.hint}>{t("course.logoHint")}</span>
          </label>
          <div className={styles.imageUpload}>
            {coverImage ? (
              <img
                src={withApiBase(coverImage)}
                alt="Course cover"
                className={styles.coverPreview}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <span>📷</span>
                <span>{t("course.uploadImage")}</span>
              </div>
            )}
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
                {isUploading ? t("course.uploading") : t("course.selectFile")}
              </label>
              {coverImage && (
                <button
                  type="button"
                  onClick={handleDeleteCover}
                  disabled={isUploading}
                  className={styles.deleteCoverButton}
                  title={t("course.deleteCover")}
                >
                  {t("course.deleteCover")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course title */}
        <div className={styles.field}>
          <label className={styles.label}>{t("course.courseName")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={64}
            className={styles.input}
          />
          <span className={styles.charCount}>{title.length}/64</span>
        </div>

        {/* Short description */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.shortDescription")}
            <span className={styles.hint}>
              {t("course.shortDescriptionHint")}
            </span>
          </label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={512}
            rows={3}
            className={styles.textarea}
            placeholder={t("course.shortDescriptionPlaceholder")}
          />
          <span className={styles.charCount}>
            <span
              style={{
                color: shortDescription.length < 100 ? "red" : "inherit",
              }}
            >
              {shortDescription.length}
            </span>
            /512
          </span>
        </div>

        {/* Language */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>{t("course.language")}</label>
            <select
              value={languageId}
              onChange={(e) => setLanguageId(parseInt(e.target.value, 10))}
              className={styles.select}
            >
              {languagesData?.data.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty level */}
          <div className={styles.field}>
            <label className={styles.label}>
              {t("course.difficultyLevel")}
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(parseInt(e.target.value, 10))}
              className={styles.select}
            >
              <option value={0}>{t("course.difficulty.beginner")}</option>
              <option value={1}>{t("course.difficulty.intermediate")}</option>
              <option value={2}>{t("course.difficulty.advanced")}</option>
            </select>
          </div>
        </div>

        {/* Time to complete */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.timeToComplete")}
            <span className={styles.hint}>
              {t("course.timeToCompleteHint")}
            </span>
          </label>
          <div className={styles.row}>
            <input
              type="number"
              value={hoursWeek}
              onChange={(e) => setHoursWeek(e.target.value)}
              placeholder={t("course.hoursPerWeek")}
              min="1"
              max="40"
              className={styles.inputSmall}
            />
            <span className={styles.separator}>
              {t("course.hoursWeekLabel")}
            </span>
          </div>
        </div>

        {/* What you will learn */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.whatYouWillLearn")}
            <span className={styles.hint}>
              {t("course.whatYouWillLearnHint")}
            </span>
          </label>
          <RichTextEditor
            content={whatYouWillLearn}
            onChange={setWhatYouWillLearn}
            placeholder={t("course.whatYouWillLearnPlaceholder")}
          />
        </div>

        {/* Target audience */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.targetAudience")}
            <span className={styles.hint}>
              {t("course.targetAudienceHint")}
            </span>
          </label>
          <RichTextEditor
            content={targetAudience}
            onChange={setTargetAudience}
            placeholder={t("course.targetAudiencePlaceholder")}
          />
        </div>

        {/* Prerequisites */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.requirements")}
            <span className={styles.hint}>{t("course.requirementsHint")}</span>
          </label>
          <RichTextEditor
            content={requirements}
            onChange={setRequirements}
            placeholder={t("course.requirementsPlaceholder")}
          />
        </div>

        {/* How learning works */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.howItWorks")}
            <span className={styles.hint}>{t("course.howItWorksHint")}</span>
          </label>
          <RichTextEditor
            content={howItWorks}
            onChange={setHowItWorks}
            placeholder={t("course.howItWorksPlaceholder")}
          />
        </div>

        {/* What you get */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.whatYouGet")}
            <span className={styles.hint}>{t("course.whatYouGetHint")}</span>
          </label>
          <RichTextEditor
            content={whatYouGet}
            onChange={setWhatYouGet}
            placeholder={t("course.whatYouGetPlaceholder")}
          />
        </div>

        {/* Full description - About Course */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.fullDescription")}
            <span className={styles.hint}>
              {t("course.fullDescriptionHint")}
            </span>
          </label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder={t("course.aboutCoursePlaceholder")}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          onClick={handleSave}
          disabled={updateCourseMutation.isPending || !title.trim()}
          className={styles.saveButton}
        >
          {updateCourseMutation.isPending
            ? t("common.loading")
            : t("common.save")}
        </button>
        <button onClick={onCancel} className={styles.cancelButton}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  )
}
