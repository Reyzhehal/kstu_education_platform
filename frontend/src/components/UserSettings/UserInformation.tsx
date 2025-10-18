import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import { useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  type ApiError,
  type UserPublic,
  UsersService,
  type UserUpdateMe,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"
import { renderMarkdown } from "@/utils/markdown"
import { getFullName } from "@/utils/user"
import { Field } from "../ui/field"

const UserInformation = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser?.avatar_image
      ? `${import.meta.env.VITE_API_URL}${currentUser.avatar_image}`
      : null,
  )
  const [coverPreview, setCoverPreview] = useState<string | null>(
    currentUser?.cover_image
      ? `${import.meta.env.VITE_API_URL}${currentUser.cover_image}`
      : null,
  )
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      first_name: currentUser?.first_name as any,
      last_name: currentUser?.last_name as any,
      email: currentUser?.email,
      city: currentUser?.city,
      description: currentUser?.description,
      description_short: currentUser?.description_short,
      website_url: (currentUser as any)?.website_url,
      telegram_url: (currentUser as any)?.telegram_url,
      github_url: (currentUser as any)?.github_url,
      youtube_url: (currentUser as any)?.youtube_url,
    },
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
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

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      return UsersService.uploadAvatarMe({ formData: { file } })
    },
    onSuccess: (data) => {
      showSuccessToast(t("settings.avatar.uploadSuccess"))
      setAvatarPreview(`${import.meta.env.VITE_API_URL}${data.avatar_image}`)
      queryClient.invalidateQueries()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const deleteAvatarMutation = useMutation({
    mutationFn: () => UsersService.deleteAvatarMe(),
    onSuccess: () => {
      showSuccessToast(t("settings.avatar.deleteSuccess"))
      setAvatarPreview(null)
      queryClient.invalidateQueries()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => {
      return UsersService.uploadCoverMe({ formData: { file } })
    },
    onSuccess: (data) => {
      showSuccessToast(t("settings.cover.uploadSuccess"))
      setCoverPreview(`${import.meta.env.VITE_API_URL}${data.cover_image}`)
      queryClient.invalidateQueries()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const deleteCoverMutation = useMutation({
    mutationFn: () => UsersService.deleteCoverMe(),
    onSuccess: () => {
      showSuccessToast(t("settings.cover.deleteSuccess"))
      setCoverPreview(null)
      queryClient.invalidateQueries()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showErrorToast(t("settings.avatar.uploadError"))
      return
    }

    uploadAvatarMutation.mutate(file)
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showErrorToast(t("settings.cover.uploadError"))
      return
    }

    uploadCoverMutation.mutate(file)
  }

  const handleAvatarDelete = () => {
    deleteAvatarMutation.mutate()
  }

  const handleCoverDelete = () => {
    deleteCoverMutation.mutate()
  }

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        {t("settings.userInformation")}
      </Heading>
      <VStack align="stretch" gap={6}>
        <Box
          id="profile"
          w={{ sm: "full", md: "xl" }}
          as="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Field label={t("settings.fields.fullName")}>
            {editMode ? (
              <Flex gap={2}>
                <Input
                  {...register("first_name", { maxLength: 255 })}
                  type="text"
                  size="md"
                  placeholder={t("settings.fields.firstName")!}
                />
                <Input
                  {...register("last_name", { maxLength: 255 })}
                  type="text"
                  size="md"
                  placeholder={t("settings.fields.lastName")!}
                />
              </Flex>
            ) : (
              <Text
                fontSize="md"
                py={2}
                color={
                  !currentUser?.first_name && !currentUser?.last_name
                    ? "gray"
                    : "inherit"
                }
                truncate
                maxW="sm"
              >
                {getFullName(currentUser, {
                  fallback: t("settings.validation.notAvailable")!,
                })}
              </Text>
            )}
          </Field>
          {/* Соцсети перенесены в отдельную вкладку */}
          <Field
            mt={4}
            label={t("settings.fields.email")}
            invalid={!!errors.email}
            errorText={errors.email?.message}
          >
            {editMode ? (
              <Input
                {...register("email", {
                  required: t("settings.messages.emailRequired"),
                  pattern: emailPattern,
                })}
                type="email"
                size="md"
              />
            ) : (
              <Text fontSize="md" py={2} truncate maxW="sm">
                {currentUser?.email}
              </Text>
            )}
          </Field>
          <Field mt={4} label={t("settings.fields.city")}>
            {editMode ? (
              <Input
                {...register("city", { maxLength: 30 })}
                type="text"
                size="md"
              />
            ) : (
              <Text fontSize="md" py={2} truncate maxW="sm">
                {currentUser?.city || t("settings.validation.notAvailable")}
              </Text>
            )}
          </Field>
          <Field mt={4} label={t("settings.fields.descriptionShort")}>
            {editMode ? (
              <Input
                {...register("description_short", { maxLength: 255 })}
                type="text"
                size="md"
                placeholder={t("settings.placeholders.descriptionShort")!}
              />
            ) : (
              <Text
                fontSize="md"
                py={2}
                color={!currentUser?.description_short ? "gray" : "inherit"}
                truncate
                maxW="sm"
              >
                {currentUser?.description_short ||
                  t("settings.validation.notAvailable")}
              </Text>
            )}
          </Field>
          <Field mt={4} label={t("settings.fields.description")}>
            {editMode ? (
              <Textarea
                {...register("description", { maxLength: 2000 })}
                size="md"
                placeholder={t("settings.placeholders.description")!}
                rows={4}
              />
            ) : currentUser?.description ? (
              <Box py={2}>
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(currentUser.description),
                  }}
                />
              </Box>
            ) : (
              <Text fontSize="md" py={2} color="gray" maxW="sm">
                {t("settings.validation.notAvailable")}
              </Text>
            )}
          </Field>
          <Flex mt={4} gap={3}>
            <Button
              variant="solid"
              onClick={toggleEditMode}
              type={editMode ? "button" : "submit"}
              loading={editMode ? isSubmitting : false}
              disabled={editMode ? !isDirty || !getValues("email") : false}
            >
              {editMode
                ? t("settings.buttons.save")
                : t("settings.buttons.edit")}
            </Button>
            {editMode && (
              <Button
                variant="subtle"
                colorPalette="gray"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t("settings.buttons.cancel")}
              </Button>
            )}
          </Flex>
        </Box>

        {/* Avatar Section */}
        <Box id="avatar">
          <Heading size="xs" mb={2}>
            {t("settings.avatar.title")}
          </Heading>
          {avatarPreview && (
            <Image
              src={avatarPreview}
              alt="Avatar"
              boxSize="150px"
              objectFit="cover"
              borderRadius="md"
              mb={2}
            />
          )}
          {!avatarPreview && (
            <Box
              width="150px"
              height="150px"
              bg="gray.200"
              borderRadius="md"
              mb={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.500">{t("settings.avatar.noImage")}</Text>
            </Box>
          )}
          <input
            type="file"
            accept="image/*"
            ref={avatarInputRef}
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
          <Flex gap={2}>
            <Button
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              loading={uploadAvatarMutation.isPending}
            >
              {t("settings.buttons.upload")}
            </Button>
            {avatarPreview && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={handleAvatarDelete}
                loading={deleteAvatarMutation.isPending}
              >
                {t("settings.buttons.remove")}
              </Button>
            )}
          </Flex>
        </Box>

        {/* Cover Section - Only for teachers */}
        {currentUser?.is_teacher && (
          <Box id="cover">
            <Heading size="xs" mb={2}>
              {t("settings.cover.title")}
            </Heading>
            {coverPreview && (
              <Image
                src={coverPreview}
                alt="Cover"
                width="100%"
                maxW="500px"
                height="150px"
                objectFit="cover"
                borderRadius="md"
                mb={2}
              />
            )}
            {!coverPreview && (
              <Box
                width="100%"
                maxW="500px"
                height="150px"
                bg="gray.200"
                borderRadius="md"
                mb={2}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="gray.500">{t("settings.cover.noImage")}</Text>
              </Box>
            )}
            <input
              type="file"
              accept="image/*"
              ref={coverInputRef}
              style={{ display: "none" }}
              onChange={handleCoverUpload}
            />
            <Flex gap={2}>
              <Button
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                loading={uploadCoverMutation.isPending}
              >
                {t("settings.buttons.upload")}
              </Button>
              {coverPreview && (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  onClick={handleCoverDelete}
                  loading={deleteCoverMutation.isPending}
                >
                  {t("settings.buttons.remove")}
                </Button>
              )}
            </Flex>
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export default UserInformation
