import { AuthFrame } from "@/components/auth/AuthFrame";
import { AuthForm } from "@/components/auth/AuthForm";

export default function ResetPasswordPage() {
  return (
    <AuthFrame title="Nova senha" subtitle="Valide seu codigo e defina uma nova senha.">
      <AuthForm mode="reset" />
    </AuthFrame>
  );
}
