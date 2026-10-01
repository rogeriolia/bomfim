# Bomfim App

Primeira entrega do **Bomfim Product UI** (Pack 01): login, shell operacional, funil/Kanban, clientes, administração e design system.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # saída em dist/
npm run preview  # preview do build
```

## Acesso demonstrativo

Na tela de login, escolha um perfil (Administrador, Gestor, Operador, Promotor). Qualquer e-mail válido e senha não vazia entram na sessão mockada (localStorage ou sessionStorage).

- **Administrador:** acesso a `/admin/*`
- **Demais perfis:** módulos operacionais; administração bloqueada

## Deploy SPA

Consulte [docs/deploy-spa.md](./docs/deploy-spa.md).

## Untitled UI

Componentes em `src/components/base` e `src/components/application` seguem o starter oficial Untitled UI para Vite. Customização de marca em `src/styles/theme.css` e layout Bomfim em `src/styles/bomfim.css`.
