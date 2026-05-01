export async function sendPasswordResetCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Auron System <noreply@auronsystem.com>";

  if (!apiKey) {
    console.info(`[Auron System] Codigo de recuperacao para ${email}: ${code}`);
    return;
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
      html: `<p>Seu codigo de recuperacao e:</p><h1>${code}</h1><p>Ele expira em 15 minutos.</p>`
    })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel enviar o email de recuperacao.");
  }
}
