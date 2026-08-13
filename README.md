# Manual & Sistema Interativo de 5S e Ferramentas da Qualidade

Projeto desenvolvido para padronização e automação da implantação do **Programa 5S e Ferramentas Lean da Qualidade**.

---

## 📁 Estrutura dos Arquivos

- `manual_implementacao_5s_qualidade.md`: Manual Corporativo completo em formato Markdown (pronto para leitura, exportação e impressão).
- `index.html`: Aplicação Web Interativa (Dashboard, Formulário com 50 perguntas oficiais de auditoria, Matriz GUT, Kanban 5W2H, Ishikawa e 5 Porquês).
- `styles.css`: Estilos visuais modernos com tema Dark Glassmorphism, responsividade e suporte a impressão.
- `app.js`: Lógica interativa da interface — autenticação e persistência de dados são feitas pelo backend (ver abaixo), não mais por `localStorage` sozinho.
- `netlify/functions/`: Backend (Netlify Functions) que fala com o banco Neon Postgres — autenticação, votos do quadro de fábrica, checklist de auditoria, GUT, Kanban e Ishikawa.
- `db/schema.sql`: Schema do banco Neon. Rode uma vez no console do Neon antes do primeiro uso.
- `scripts/migrate-jsonblob-to-neon.mjs`: Migração única dos dados do antigo documento jsonblob.com para o Neon.

---

## 🚀 Como Executar e Utilizar

### 1. Aplicação Web Interativa (com backend)
Este projeto agora precisa do backend para funcionar (login, votos, etc. não funcionam mais abrindo só o `index.html` puro):
1. `npm install`
2. Configure `DATABASE_URL` e `JWT_SECRET` num arquivo `.env` local (veja `netlify/functions/_lib/db.js` e `_lib/auth.js`).
3. Rode o schema em `db/schema.sql` no console do Neon (uma vez só).
4. `npm run dev` (ou `netlify dev`) — sobe o site e as functions juntos.

### 2. Manual em Documento Markdown
Para abrir e ler o manual corporativo:
- Abra o arquivo `manual_implementacao_5s_qualidade.md` no seu editor ou visualizador Markdown de preferência.
