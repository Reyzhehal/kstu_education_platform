import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { type CoursePublic, CoursesService, LanguagesService } from "@/client"
import { RichTextEditor } from "@/components/Common"
import useCustomToast from "@/hooks/useCustomToast"
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

  const [title, setTitle] = useState(course.title || "")
  const [coverImage, setCoverImage] = useState(course.cover_image || "")
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

  // Загружаем языки
  const { data: languagesData } = useQuery({
    queryKey: ["languages"],
    queryFn: () => LanguagesService.readLanguages(),
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

  const handleSave = () => {
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

    if (coverImage) data.cover_image = coverImage
    if (hoursWeek) data.hours_week = parseInt(hoursWeek, 10)

    updateCourseMutation.mutate(data)
  }

  return (
    <div className={styles.root}>
      <h1>{t("course.editDescription")}</h1>

      <div className={styles.section}>
        <h2>{t("course.aboutCourse")}</h2>

        {/* Логотип курса */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.logo")}
            <span className={styles.hint}>{t("course.logoHint")}</span>
          </label>
          <div className={styles.imageUpload}>
            {coverImage ? (
              <img
                src={coverImage}
                alt="Course cover"
                className={styles.coverPreview}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <span>📷</span>
                <span>{t("course.uploadImage")}</span>
              </div>
            )}
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder={t("course.imageUrl")}
              className={styles.input}
            />
          </div>
        </div>

        {/* Название */}
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

        {/* Краткое описание */}
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
            {shortDescription.length}/512
          </span>
        </div>

        {/* Язык */}
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

          {/* Уровень сложности */}
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

        {/* Время прохождения */}
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

        {/* Чему вы научитесь */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.whatYouWillLearn")}
            <span className={styles.hint}>
              {t("course.whatYouWillLearnHint")}
            </span>
          </label>
          <textarea
            value={whatYouWillLearn}
            onChange={(e) => setWhatYouWillLearn(e.target.value)}
            rows={5}
            maxLength={2000}
            className={styles.textarea}
            placeholder={t("course.whatYouWillLearnPlaceholder")}
          />
          <span className={styles.charCount}>
            {whatYouWillLearn.length}/2000
          </span>
        </div>

        {/* Для кого этот курс */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.targetAudience")}
            <span className={styles.hint}>
              {t("course.targetAudienceHint")}
            </span>
          </label>
          <textarea
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            rows={4}
            maxLength={2000}
            className={styles.textarea}
            placeholder={t("course.targetAudiencePlaceholder")}
          />
          <span className={styles.charCount}>{targetAudience.length}/2000</span>
        </div>

        {/* Начальные требования */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.requirements")}
            <span className={styles.hint}>{t("course.requirementsHint")}</span>
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            maxLength={2000}
            className={styles.textarea}
            placeholder={t("course.requirementsPlaceholder")}
          />
          <span className={styles.charCount}>{requirements.length}/2000</span>
        </div>

        {/* Как проходит обучение */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.howItWorks")}
            <span className={styles.hint}>{t("course.howItWorksHint")}</span>
          </label>
          <textarea
            value={howItWorks}
            onChange={(e) => setHowItWorks(e.target.value)}
            rows={4}
            maxLength={2000}
            className={styles.textarea}
            placeholder={t("course.howItWorksPlaceholder")}
          />
          <span className={styles.charCount}>{howItWorks.length}/2000</span>
        </div>

        {/* Что вы получаете */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("course.whatYouGet")}
            <span className={styles.hint}>{t("course.whatYouGetHint")}</span>
          </label>
          <textarea
            value={whatYouGet}
            onChange={(e) => setWhatYouGet(e.target.value)}
            rows={4}
            maxLength={2000}
            className={styles.textarea}
            placeholder={t("course.whatYouGetPlaceholder")}
          />
          <span className={styles.charCount}>{whatYouGet.length}/2000</span>
        </div>

        {/* Полное описание */}
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
            placeholder={t("course.descriptionPlaceholder")}
          />
        </div>
      </div>

      {/* Кнопки действий */}
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
