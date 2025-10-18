import { Box, Button, Flex, Heading, Image, Input, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { type ApiError, type UserPublic, UsersService, type UserUpdateMe } from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { Field } from "@/components/ui/field"

export default function SocialLinks() {
  const { t } = useTranslation("common")
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { register, handleSubmit, formState: { isSubmitting, errors, isDirty }, reset, getValues, setValue, watch } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      website_url: (currentUser as any)?.website_url,
      telegram_url: extractHandle((currentUser as any)?.telegram_url),
      github_url: extractGithubUser((currentUser as any)?.github_url),
      youtube_url: extractYoutubeHandle((currentUser as any)?.youtube_url),
    },
  })

  // При обновлении currentUser (после успешного сохранения или refetch) восстанавливаем форму к «последне сохранённому» состоянию
  useEffect(() => {
    reset({
      website_url: (currentUser as any)?.website_url,
      telegram_url: extractHandle((currentUser as any)?.telegram_url) as any,
      github_url: extractGithubUser((currentUser as any)?.github_url) as any,
      youtube_url: extractYoutubeHandle((currentUser as any)?.youtube_url) as any,
    } as any)
  }, [
    (currentUser as any)?.website_url,
    (currentUser as any)?.telegram_url,
    (currentUser as any)?.github_url,
    (currentUser as any)?.youtube_url,
    reset,
  ])

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) => UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast(t("settings.messages.updateSuccess"))
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    const payload: UserUpdateMe = {
      website_url: sanitizeWebsite(data.website_url as any),
      telegram_url: buildTelegramUrl(extractHandle(data.telegram_url as any)),
      github_url: buildGithubUrl(extractGithubUser(data.github_url as any)),
      youtube_url: buildYoutubeUrl(extractYoutubeHandle(data.youtube_url as any)),
    }
    await mutation.mutateAsync(payload)
    // Локально приводим форму к сохранённому состоянию, чтобы кнопки сразу стали неактивны
    reset({
      website_url: payload.website_url as any,
      telegram_url: extractHandle(payload.telegram_url as any) as any,
      github_url: extractGithubUser(payload.github_url as any) as any,
      youtube_url: extractYoutubeHandle(payload.youtube_url as any) as any,
    } as any)
  }

  if (!currentUser) return null

  const LEFT_COL_WIDTH = "200px" // фиксируем левую колонку, чтобы префиксы не влияли на ширину инпута
  const INPUT_WIDTH = "360px"

  const Row = ({ icon, label, prefix, name, pattern, message, isSegment }: { icon: string; label: string; prefix?: string; name: keyof UserPublic; pattern: RegExp; message: string; isSegment?: boolean }) => (
    <Field mt={4} label={label} invalid={!!(errors as any)[name]} errorText={(errors as any)[name]?.message}>
      <Box display="grid" gridTemplateColumns={`${LEFT_COL_WIDTH} ${INPUT_WIDTH}`} alignItems="center" gap={3} w="fit-content">
        <Flex align="center" gap={2}>
          <Image src={icon} alt="" boxSize="20px" />
          {prefix ? <Text color="var(--muted)">{prefix}</Text> : null}
        </Flex>
        <Input
          {...register(name as any, {
            setValueAs: (v: string) => (isSegment ? extractSegmentGeneric(v) : v?.trim()),
            validate: (v: string | undefined) => !v || pattern.test(v) || message,
            maxLength: 255,
          })}
          type="text"
          size="sm"
          w={INPUT_WIDTH}
        />
      </Box>
    </Field>
  )

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Heading size="sm" py={2}>
        {t("settings.tabs.social", { defaultValue: "Соцсети" })}
      </Heading>
      <VStack align="stretch">
        <Row
          icon="/assets/icons/website.svg"
          label="Website"
          name={"website_url" as any}
          pattern={/^$|^https?:\/\/[^\s]+$/i}
          message={t("validation.urlHttp", { defaultValue: "Ссылка должна начинаться с http:// или https://" })}
        />
        <Row
          icon="/assets/icons/telegram.svg"
          label="Telegram"
          prefix="https://t.me/"
          name={"telegram_url" as any}
          pattern={/^$|^[A-Za-z0-9_]+$/}
          message={t("validation.username", { defaultValue: "Введите только имя пользователя без ссылки" })}
          isSegment
        />
        <Row
          icon="/assets/icons/github.svg"
          label="GitHub"
          prefix="https://github.com/"
          name={"github_url" as any}
          pattern={/^$|^[A-Za-z0-9-]+$/}
          message={t("validation.username", { defaultValue: "Введите только имя пользователя без ссылки" })}
          isSegment
        />
        <Row
          icon="/assets/icons/youtube.svg"
          label="YouTube"
          prefix="https://youtube.com/"
          name={"youtube_url" as any}
          pattern={/^$|^@?[A-Za-z0-9_\-\.]+$/}
          message={t("validation.username", { defaultValue: "Введите только идентификатор без ссылки" })}
          isSegment
        />
      </VStack>
      <Flex mt={4} gap={2} justify="flex-start">
        <Button variant="solid" type="submit" loading={isSubmitting} disabled={!isDirty || isSubmitting || mutation.isPending}>{t("settings.buttons.save")}</Button>
        <Button
          variant="subtle"
          colorPalette="gray"
          type="button"
          disabled={!isDirty || isSubmitting || mutation.isPending}
          onClick={() =>
            reset({
              website_url: (currentUser as any)?.website_url,
              telegram_url: extractHandle((currentUser as any)?.telegram_url) as any,
              github_url: extractGithubUser((currentUser as any)?.github_url) as any,
              youtube_url: extractYoutubeHandle((currentUser as any)?.youtube_url) as any,
            } as any)
          }
        >
          {t("settings.buttons.cancel")}
        </Button>
      </Flex>
    </Box>
  )
}

function extractSegmentGeneric(v?: string | null) {
  if (!v) return v as any
  const s = String(v).trim()
  if (!s) return s as any
  const cleaned = s.replace(/^@+/, "")
  const parts = cleaned.split(/\//).filter(Boolean)
  return parts[parts.length - 1]
}

function extractHandle(url?: string | null) {
  if (!url) return url as any
  const s = String(url).trim().replace(/^@+/, "")
  if (!s) return s as any
  try {
    if (s.startsWith("http")) {
      const u = new URL(s)
      const last = u.pathname.split("/").filter(Boolean).pop()
      return last || s
    }
  } catch {}
  return s
}

function extractGithubUser(url?: string | null) {
  return extractHandle(url)
}

function extractYoutubeHandle(url?: string | null) {
  if (!url) return url as any
  const s = String(url).trim()
  const h = extractHandle(s)
  // В инпуте храним handle БЕЗ '@', чтобы он не появлялся при смене вкладок
  return String(h || "").replace(/^@+/, "") as any
}

function sanitizeWebsite(url?: string | null) {
  if (!url) return url as any
  const s = String(url).trim()
  if (!s) return s as any
  if (!/^https?:\/\//i.test(s)) return `https://${s}`
  return s
}

function buildTelegramUrl(handle?: string | null) {
  if (!handle) return handle as any
  const h = String(handle).replace(/^@+/, "")
  return `https://t.me/${h}`
}

function buildGithubUrl(user?: string | null) {
  if (!user) return user as any
  return `https://github.com/${String(user).replace(/^@+/, "")}`
}

function buildYoutubeUrl(handle?: string | null) {
  if (!handle) return handle as any
  const h = String(handle)
  const clean = h.startsWith("@") ? h : `@${h}`
  return `https://youtube.com/${clean}`
}


