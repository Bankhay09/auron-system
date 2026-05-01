import { AuthFrame } from "@/components/auth/AuthFrame";
import { PasswordResetFlow } from "@/components/auth/PasswordResetFlow";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame title="Recuperar senha" subtitle="Informe seu email, valide o codigo e defina uma nova senha.">
      <PasswordResetFlow />
    </AuthFrame>
  );
}
