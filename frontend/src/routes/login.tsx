import { Container, Image, Input, Text } from "@chakra-ui/react"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import usePageTitle from "@/hooks/usePageTitle"
import { useTranslation } from "react-i18next"
import LanguageSwitcherInline from "@/components/Common/LanguageSwitcherInline"
import { FiLock, FiMail } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"
import { emailPattern, passwordRules } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
  usePageTitle("pages.login")
  const { t } = useTranslation("common")
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <Container
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      h="100vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      <Image
        src={Logo}
        alt="FastAPI logo"
        height="auto"
        maxW="2xs"
        alignSelf="center"
        mb={4}
      />
      <LanguageSwitcherInline />
      <Field
        invalid={!!errors.username}
        errorText={errors.username?.message || !!error}
      >
        <InputGroup w="100%" startElement={<FiMail />}>
          <Input
            {...register("username", {
              required: t("forms.required") || "Required",
              pattern: emailPattern,
            })}
            placeholder={t("forms.email") || "Email"}
            type="email"
          />
        </InputGroup>
      </Field>
      <PasswordInput
        type="password"
        startElement={<FiLock />}
        {...register("password", passwordRules())}
        placeholder={t("forms.password") || "Password"}
        errors={errors}
      />
      <RouterLink to="/recover-password" className="main-link">
        {t("forms.forgotPassword") || "Forgot Password?"}
      </RouterLink>
      <Button variant="solid" type="submit" loading={isSubmitting} size="md">
        {t("forms.login") || "Log In"}
      </Button>
      <Text>
        {t("forms.noAccount") || "Don't have an account?"}{" "}
        <RouterLink to="/signup" className="main-link">
          {t("forms.signUp") || "Sign Up"}
        </RouterLink>
      </Text>
    </Container>
  )
}
