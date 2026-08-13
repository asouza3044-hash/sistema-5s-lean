# 🐘 BANCO DE DADOS NEON POSTGRESQL - PROJETO 5S & QUALIDADE IMPAK TTO

> **Status:** Conectado e operacional via Netlify Functions.
> **Projeto Neon:** `sistema-5s-impaktto` (`red-bread-71891632`), conta `xandosouza1973@gmail.com`.
> **Região:** AWS US East 2 (`aws-us-east-2`)
>
> O projeto anterior (`little-fire-03061120`) foi apagado pelo próprio Alexandre antes desta reconstrução
> e não existe mais — este é um banco novo e independente, criado em 13/08/2026.

---

## 🔑 Conexão

A string de conexão **não fica neste arquivo nem em nenhum arquivo versionado no git** — só existe como variável de ambiente:
- Em produção: variável `DATABASE_URL` nas configurações do site no **Netlify** (já configurada).
- Em desenvolvimento local: arquivo `.env` na raiz do projeto (está no `.gitignore`, nunca é enviado ao GitHub).

Para ver/trocar a senha: [console.neon.tech](https://console.neon.tech), projeto `sistema-5s-impaktto`, aba Settings → Reset password. Depois de trocar, atualize o `.env` local e rode `netlify env:set DATABASE_URL "..."` para atualizar o Netlify também.

---

## 📊 Schema

O schema completo (8 tabelas) vive em [`db/schema.sql`](db/schema.sql) — é a fonte única de verdade, não duplicar aqui. Para aplicar num banco novo do zero:

```bash
node --env-file=.env -e "
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(fs.readFileSync('db/schema.sql', 'utf-8')).then(() => pool.end());
"
```

## 👥 Usuários oficiais

Os 11 integrantes oficiais da IMPAK TTO são cadastrados via [`scripts/seed-official-users.mjs`](scripts/seed-official-users.mjs) — as senhas são gravadas como hash bcrypt na coluna `password` (nunca texto puro). A senha padrão de fábrica continua `5s2026` (`mestre5s` para o `admin`); cada pessoa pode trocar a sua em **Trocar Senha** dentro do portal.

---
*Reconstruído via Claude Code em 13/08/2026, substituindo a sincronia via jsonblob.com público por Netlify Functions autenticadas.*
