# Bomfim — Product UI (Pack 01)

Front-end **Vite + React + TypeScript** e API **Flask + PostgreSQL** para login real e dados das telas operacionais.

- UI: [`bomfim-app/`](bomfim-app/)
- API: pacote [`bomfim/`](bomfim/)

## Pré-requisitos

- Python 3.11+ com venv em `.venv`
- PostgreSQL local
- Node.js 20+ (front)

## Banco de dados (PostgreSQL)

1. Crie o banco (se ainda não existir):

```powershell
python scripts/ensure_db.py
```

2. Configure [`.env`](.env) (copie de [`.env.example`](.env.example)):

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/bomfim
```

Se `DATABASE_URL` apontar para `/postgres`, a API usa automaticamente o banco **`bomfim`**.

3. Instale dependências Python e aplique migrações + seed:

```powershell
.\.venv\Scripts\pip install -r requirements.txt
$env:FLASK_APP = "manage.py"
.\.venv\Scripts\flask db upgrade
.\.venv\Scripts\flask seed
```

**Usuários seed** (senha inicial para todos: **`123456789`**):

| E-mail | Perfil |
|--------|--------|
| rogerio+adm@4lia.com.br | Administrador |
| rogerio+gest@4lia.com.br | Gestor |
| rogerio+oper@4lia.com.br | Operador |
| rogerio+prom@4lia.com.br | Promotor |

Troque as senhas após o primeiro acesso em ambiente real.

## Desenvolvimento local

**Um terminal só** (API + front):

```powershell
python run.py
```

Isso sobe a API Flask (`:5001`) e o Vite (`:5173`) juntos. Abra [http://localhost:5173/login](http://localhost:5173/login) — e-mail + senha (sem perfil demonstrativo).

Login seed: `rogerio+adm@4lia.com.br` / `123456789`

Opcional (só API ou só front):

```powershell
python run.py api
python run.py dev --no-api
```

Outros modos:

```powershell
python run.py serve      # build estático :5000
python run.py preview    # preview Vite :4173
python run.py --port 8080 dev
```

Portas padrão: **dev** 5173 · **api** 5001 · **serve** 5000 · **preview** 4173.

### Só front (npm)

```powershell
cd bomfim-app
npm install
npm run dev
```

Requer a API em `http://127.0.0.1:5001` para login e listas.

## Rotas úteis

- `/login` — autenticação real
- `/overview`
- `/cadastro/kanban`
- `/clientes`
- `/admin/usuarios`
- `/design-system`

## API (resumo)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/api/auth/login` | `{ email, password }` → JWT + usuário |
| GET | `/api/users` | Lista usuários |
| POST | `/api/users` | Novo usuário (admin) |
| GET/PATCH/POST | `/api/registrations` | Cadastros / funil |
| GET | `/api/units`, `/api/integrations`, `/api/audit-logs`, … | Dados admin |

## Build de produção (front)

```powershell
cd bomfim-app
npm run build
npm run preview
```

SPA: [`bomfim-app/docs/deploy-spa.md`](bomfim-app/docs/deploy-spa.md).

## Stack

- Untitled UI React, React Router 8
- Flask, SQLAlchemy, Flask-Migrate, PostgreSQL, JWT
