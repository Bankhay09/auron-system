# Auron System

Plataforma premium de disciplina, diario estoico, habitos, metricas e IA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Cookies assinados
- PWA pronto para Vercel

## Deploy Vercel

1. Crie um projeto no Supabase e rode `supabase/schema.sql`.
2. Configure as variaveis da `.env.example` na Vercel.
3. Publique o projeto na Vercel.
4. Em Vercel > Domains, adicione `auronsystem.com` e `www.auronsystem.com`.
5. Aponte o DNS do dominio para a Vercel e defina `www.auronsystem.com` como dominio principal.

## Variaveis

- `NEXT_PUBLIC_APP_URL=https://www.auronsystem.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AI_API_KEY`
- `AI_API_URL`

Senhas sao salvas com PBKDF2. A chave `SUPABASE_SERVICE_ROLE_KEY` deve ficar apenas no backend/Vercel.

O backend nao usa armazenamento em disco local. Em producao, cadastro, login, recuperacao de senha, diario, onboarding, IA e registros sociais dependem do Supabase configurado pelas variaveis de ambiente.
