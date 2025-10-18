import { Container, Heading, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  const { t } = useTranslation()

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        {t("settings.deleteAccount")}
      </Heading>
      <Text>{t("settings.deleteAccountWarning")}</Text>
      <DeleteConfirmation />
    </Container>
  )
}
export default DeleteAccount
