# QA — rotas Pack 01

Checklist após `npm run build` e `npm run dev` (ou `npm run preview`).

| URL | Esperado |
|-----|----------|
| `/login` | Formulário de acesso demonstrativo |
| `/overview` | Métricas, funil resumido, atividades (após login) |
| `/cadastro/kanban` | Colunas do funil + drawer ao clicar no card |
| `/clientes` | Tabela de clientes |
| `/admin/usuarios` | Tabela + drawer “Novo usuário” (perfil Administrador) |
| `/design-system` | Showcase de tokens e componentes |

## Perfis

- **Promotor:** sem item “Relatórios”; sem “Administração”; sem editar cliente.
- **Operador / Gestor:** Relatórios OK; admin bloqueado.
- **Administrador:** acesso completo incluindo `/admin/*`.

## Build

```bash
npm run build
```

Deve concluir sem erros TypeScript.
