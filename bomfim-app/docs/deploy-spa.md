# Deploy — SPA Bomfim

O app usa **React Router** com rotas do cliente. O servidor precisa devolver `index.html` para caminhos desconhecidos (fallback SPA).

## Build

```bash
npm run build
```

Publique o conteúdo de `dist/`.

## Exemplos de fallback

### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Apache (`.htaccess` na raiz do `dist`)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Netlify / Cloudflare Pages

Copie [`public/_redirects`](../public/_redirects) para o deploy (já incluído no build via `public/`).

### IIS

Use URL Rewrite com regra “Rewrite to `/index.html`” para rotas que não são arquivos estáticos.

## Deep links

Após configurar o fallback, estas URLs devem abrir diretamente:

- `/login`
- `/overview`
- `/cadastro/kanban`
- `/clientes`
- `/admin/usuarios`
- `/design-system`
