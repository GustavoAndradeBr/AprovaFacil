# 📚 AprovaFácil

**Um tracker de estudos gamificado, construído pra treinar junto com os amigos pro mesmo concurso.**

Comecei esse projeto pra organizar minha própria preparação pro concurso da **GCM Limeira** (Guarda Civil Municipal), e ele cresceu pra virar uma plataforma que uso com um grupo de amigos que estuda comigo — cada um acompanha o próprio progresso, revisa no tempo certo, e todo mundo compete de forma saudável num ranking.

> 🎯 Não é só uma to-do list. É edital, TAF, simulados, revisão espaçada e competição — tudo no mesmo lugar.

---

## ✨ Funcionalidades

- **📅 Calendário de estudos** — visualização mensal com check verde / X nos dias estudados ou não
- **📖 Progresso do edital** — cada assunto rastreado em 4 etapas (aula, resumo, questões, revisão), com % de conclusão por matéria
- **🔁 Revisão espaçada** — quando você conclui um assunto, o sistema agenda sozinho a próxima revisão (7 → 15 → 30 dias), pra você não esquecer o que já estudou
- **🏃 TAF (Teste de Aptidão Física)** — registro diário com metas configuráveis e indicador visual de "bateu a meta"
- **📝 Simulados** — histórico de notas e % de acertos, com destaque automático pro melhor resultado
- **📈 Evolução** — gráficos de linha (SVG puro, sem lib externa) mostrando horas estudadas e desempenho em simulados ao longo do tempo
- **👤 Perfil** — avatar, cidade, cargo pretendido, bio e estatísticas resumidas (streak, horas totais, % edital)
- **🏆 Leaderboard** — ranking entre os amigos do grupo, com pontuação baseada em _consistência_ (dias concluídos, simulados feitos, metas batidas) — não em quem estuda mais horas, pra ninguém se sentir mal comparando

---

## 🛠️ Tecnologias

| Camada          | Stack                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| Frontend        | [Next.js](https://nextjs.org/) (App Router) + React                        |
| Estilo          | [Tailwind CSS](https://tailwindcss.com/)                                   |
| Backend / Banco | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security) |
| Gráficos        | SVG customizado (sem biblioteca de charts)                                 |
| Deploy          | [Vercel](https://vercel.com/)                                              |

---

## 🏗️ Decisões técnicas que valem destacar

- **Row Level Security de ponta a ponta** — cada tabela restringe leitura/escrita ao `auth.uid()` do próprio usuário. Nenhum dado de um usuário é acessível por outro via consulta direta.
- **Leaderboard com função `SECURITY DEFINER`** pra ranquear os amigos sem abrir RLS pra leitura cruzada, o ranking é calculado por uma função Postgres que roda com permissão elevada só pra agregar totais (pontos), nunca expondo linha crua de dado de outro usuário.
- **Revisão espaçada com agendamento automático**ao completar um assunto, o código insere o próximo ciclo de revisão numa tabela separada, com intervalos crescentes (modelo clássico de repetição espaçada).
- **Semana de planejamento calculada por data, não hardcoded** o "planejamento da semana" é derivado da diferença entre a data de início do plano e hoje, então avança sozinho, sem precisar de alguém trocando um número manualmente toda semana.
- **Gráficos SVG feitos do zero**pra manter o bundle leve, os gráficos de evolução são construídos calculando coordenadas na mão em vez de importar uma lib pesada de charts.

---

## 🚀 Rodando localmente

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

> ⚠️ Cada pessoa que roda o projeto usa o **próprio** banco Supabase. As chaves do projeto original não estão no repositório (o `.env.local` fica fora do Git) — isso protege os dados reais dos usuários que já usam a versão em produção.

Rode as migrações SQL (na pasta `/migrations` ou no SQL Editor do Supabase, na ordem que foram criadas) pra montar as tabelas, policies de RLS e a função do leaderboard.

```bash
npm run dev
```

---

## 🗺️ Roadmap

- [ ] Metas semanais de horas com barra de progresso
- [ ] Recuperação de senha no login
- [ ] Upload de avatar via Supabase Storage (hoje é só link de imagem)
- [ ] Notificações/lembretes de revisão pendente

---

## 💭 Por que esse projeto

Preparar pra um concurso sozinho é difícil de manter consistente. Esse projeto nasceu de uma necessidade real — organizar o edital do GCM Limeira e virou desculpa pra praticar arquitetura de aplicação multiusuário de verdade: autenticação, RLS, agregação segura de dados entre usuários, e um sisteminha de gamificação pensado pra motivar sem estressar quem está no processo.

---

<p align="center">Feito por Gustavo Andrade</p>
