import { AuthFrame } from "@/components/auth/AuthFrame";
import { AuthForm } from "@/components/auth/AuthForm";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame title="Recuperar senha" subtitle="Enviaremos um codigo temporario para seu email.">
      <AuthForm mode="forgot" />
    </AuthFrame>
  );
}
