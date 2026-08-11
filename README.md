# AprovaFácil

**Um tracker de estudos gamificado, construído pra treinar junto com os amigos pro mesmo concurso.**

Comecei esse projeto pra organizar minha própria preparação pro concurso da **GCM Limeira** (Guarda Civil Municipal), e ele cresceu pra virar uma plataforma que uso com um grupo de amigos que estuda comigo cada um acompanha o próprio progresso, revisa no tempo certo, e todo mundo compete de forma saudável num ranking.

> Não é só uma to-do list. É edital, TAF, simulados, revisão espaçada, mural de avisos e competição — tudo no mesmo lugar.

---

## Funcionalidades

- **Autenticação completa** login, cadastro e recuperação de senha via email (Supabase Auth), com cada usuário isolado dos dados dos outros
- **Calendário de estudos** visualização mensal com check dourado / X nos dias estudados ou não
- **Progresso do edital** cada assunto rastreado em 4 etapas (aula, resumo, questões, revisão), com % de conclusão por matéria
- **Revisão espaçada** quando você conclui um assunto, o sistema agenda sozinho a próxima revisão (7 → 15 → 30 dias), pra você não esquecer o que já estudou
- **TAF (Teste de Aptidão Física)** registro diário com metas configuráveis e indicador visual de "bateu a meta"
- **Simulados** histórico de notas e % de acertos, com destaque automático pro melhor resultado e exclusão de registros
- **Evolução** gráficos de linha (SVG puro, sem lib externa) mostrando horas estudadas e desempenho em simulados ao longo do tempo
- **Perfil** avatar, cidade, cargo pretendido, bio e estatísticas resumidas (streak, horas totais, % edital)
- **Leaderboard** ranking entre os amigos do grupo, com pontuação baseada em _consistência_ (dias concluídos, simulados feitos, metas batidas) não em quem estuda mais horas, pra ninguém se sentir mal comparando
- **Mural** quadro de avisos onde o admin publica textos e links, e o grupo comenta e reage com emoji
- **Planejamento semanal** checklist da semana atual, calculada automaticamente pela data de início do plano

---

## Tecnologias

| Camada          | Stack                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| Frontend        | [Next.js](https://nextjs.org/) (App Router) + React                        |
| Estilo          | [Tailwind CSS](https://tailwindcss.com/)                                   |
| Tipografia      | Oswald (títulos) + Geist Sans (corpo) + Geist Mono (números e dados)       |
| Backend / Banco | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security) |
| Gráficos        | SVG customizado (sem biblioteca de charts)                                 |
| Deploy          | [Vercel](https://vercel.com/)                                              |

---

## Decisões técnicas que valem destacar

- **Row Level Security de ponta a ponta** cada tabela restringe leitura/escrita ao `auth.uid()` do próprio usuário. Nenhum dado de um usuário é acessível por outro via consulta direta.
- **Leaderboard com função `SECURITY DEFINER`** pra ranquear os amigos sem abrir RLS pra leitura cruzada, o ranking é calculado por uma função Postgres que roda com permissão elevada só pra agregar totais (pontos), nunca expondo linha crua de dado de outro usuário.
- **Mural com controle de permissão via flag `is_admin`** só o usuário marcado como admin no perfil consegue publicar; qualquer usuário logado pode comentar e reagir. Tudo garantido nas policies de RLS, não só na interface.
- **Revisão espaçada com agendamento automático** ao completar um assunto, o código insere o próximo ciclo de revisão numa tabela separada, com intervalos crescentes (modelo clássico de repetição espaçada).
- **Semana de planejamento calculada por data, não hardcoded**o "planejamento da semana" é derivado da diferença entre a data de início do plano e hoje, então avança sozinho, sem precisar de alguém trocando um número manualmente toda semana.

- **Recuperação de senha completa** fluxo padrão do Supabase Auth (email com link → sessão temporária → nova senha), com tratamento de link expirado/já usado.

---

## Rodando localmente

> Essa seção é pra quem quer rodar o código, não pra quem só vai usar o app — pra isso, é só acessar o link de produção.

```bash
git clone https://github.com/seu-usuario/aprovafacil.git
cd aprovafacil
npm install
```

Crie seu próprio projeto gratuito em [supabase.com](https://supabase.com), copie `.env.example` pra `.env.local` e preencha com **as suas próprias chaves** (Project Settings > API no painel do Supabase):

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

```bash
npm run dev
```

## Por que esse projeto

Preparar pra um concurso sozinho é difícil de manter consistente. Esse projeto nasceu de uma necessidade real organizar o edital do GCM e virou desculpa pra praticar arquitetura de aplicação multiusuário de verdade: autenticação, RLS, agregação segura de dados entre usuários, controle de permissão por papel (admin vs usuário comum), e um sisteminha de gamificação pensado pra motivar sem estressar quem está no processo.

---

<p align="center">Feito por Gustavo Andrade</p>
