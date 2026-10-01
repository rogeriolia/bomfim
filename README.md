# Bomfim — Product UI (Pack 01)

Front-end oficial da operação Bomfim: **Vite + React + TypeScript + Tailwind + Untitled UI**.

O código da aplicação fica em [`bomfim-app/`](bomfim-app/).

## Desenvolvimento local

```powershell
cd bomfim-app
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

Rotas úteis para validação:

- `/login`
- `/overview`
- `/cadastro/kanban`
- `/clientes`
- `/admin/usuarios`
- `/design-system`

## Build de produção

```powershell
cd bomfim-app
npm run build
npm run preview
```

Para hospedagem estática (SPA), configure fallback para `index.html` em todas as rotas — veja [`bomfim-app/docs/deploy-spa.md`](bomfim-app/docs/deploy-spa.md).

## Stack

- [Untitled UI React](https://www.untitledui.com/react) (componentes reais, React Aria)
- React Router 8
- `@untitledui/icons`

O legado Flask foi descontinuado neste repositório; use apenas `bomfim-app`.
