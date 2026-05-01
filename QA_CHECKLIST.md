# Auron System - QA Checklist

## Autenticacao

- [ ] Cadastro cria usuario.
- [ ] Cadastro com username repetido mostra: "Esse nome já está sendo usado."
- [ ] Login com senha correta entra.
- [ ] Login com senha incorreta mostra erro amigavel.
- [ ] Usuario deslogado nao acessa dashboard.
- [ ] Usuario sem onboarding vai para `/onboarding`.
- [ ] Logout remove sessao.

## Recuperacao de senha

- [ ] Email dispara codigo de 6 digitos.
- [ ] Codigo expira.
- [ ] Codigo usado nao funciona novamente.
- [ ] Nova senha permite login.

## Onboarding

- [ ] Habitos precisam ser escritos manualmente.
- [ ] Habito invalido e bloqueado no backend.
- [ ] Mensagem exibida: "Esse hábito não é válido para desenvolvimento pessoal."
- [ ] Dashboard so libera depois do onboarding.

## Diario

- [ ] Diario salva data, conteudo, humor e progresso.
- [ ] Historico aparece.
- [ ] Metricas sao recalculadas.
- [ ] Daily Quest nao conclui sem diario.

## Arquiteto

- [ ] Usuario logado consegue conversar.
- [ ] Usuario deslogado recebe 401.
- [ ] Mensagens sao salvas em `ai_messages`.
- [ ] Prompt da IA recebe contexto do usuario.
- [ ] Erro da IA mostra mensagem amigavel.

## Redes sociais

- [ ] Registro manual salva app, minutos e data.
- [ ] Instagram, TikTok e YouTube podem ser registrados.
- [ ] Campo de print opcional nao bloqueia envio.

## Multiusuario

- [ ] Dados do usuario A nao aparecem para usuario B.
- [ ] Diario, chat e social logs filtram por `user_id`.
