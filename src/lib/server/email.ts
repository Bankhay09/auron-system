export async function sendPasswordResetCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL || process.env.EMAIL_FROM || "Auron System <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY ausente no backend.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Codigo de recuperacao - Auron System",
      html: `
        <div style="background:#050506;color:#f6efe2;font-family:Arial,sans-serif;padding:32px">
          <div style="max-width:560px;margin:0 auto;border:1px solid #00e5ff55;border-radius:18px;padding:28px;background:#07131a">
            <p style="letter-spacing:4px;color:#75f7ff;text-transform:uppercase;font-size:12px">Auron System</p>
            <h1 style="margin:12px 0;color:#fff">Codigo de recuperacao</h1>
            <p>Use o codigo abaixo para redefinir sua senha. Ele expira em 15 minutos.</p>
            <div style="font-size:36px;letter-spacing:8px;font-weight:800;color:#00e5ff;margin:28px 0">${code}</div>
            <p style="color:#bda889;font-size:13px">Se voce nao pediu esta recuperacao, ignore este email.</p>
          </div>
        </div>
      `
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend falhou (${response.status}): ${body || response.statusText}`);
  }
}
