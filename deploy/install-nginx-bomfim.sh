#!/usr/bin/env bash
# Restaura Nginx para bomfim.4lia.com.br (HTTP bootstrap → Certbot → HTTPS completo).
# Rode NO SERVIDOR: cd /opt/bomfim && sudo bash deploy/install-nginx-bomfim.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${BOMFIM_DOMAIN:-bomfim.4lia.com.br}"
SITE_NAME="${NGINX_SITE_NAME:-bomfim}"
SITE_AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}"
SITE_ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
EMAIL="${CERTBOT_EMAIL:-}"

if [[ "$(id -u)" -ne 0 ]]; then
    echo "Execute com sudo: sudo bash deploy/install-nginx-bomfim.sh" >&2
    exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
    echo "Instale nginx: apt install -y nginx" >&2
    exit 1
fi

echo "==> Domínio: ${DOMAIN}"
echo "==> Site: ${SITE_AVAILABLE}"

if [[ -f "${SITE_AVAILABLE}" ]]; then
    cp -a "${SITE_AVAILABLE}" "${SITE_AVAILABLE}.bak.$(date +%Y%m%d%H%M%S)"
    echo "    Backup do config anterior criado."
fi

install_http() {
    cp "${ROOT}/deploy/nginx.bomfim.4lia.com.br.http.conf" "${SITE_AVAILABLE}"
    ln -sf "${SITE_AVAILABLE}" "${SITE_ENABLED}"
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    nginx -t
    systemctl reload nginx
    echo "==> Nginx HTTP ativo (server_name ${DOMAIN})."
}

install_https() {
    cp "${ROOT}/deploy/nginx.bomfim.4lia.com.br.conf" "${SITE_AVAILABLE}"
    ln -sf "${SITE_AVAILABLE}" "${SITE_ENABLED}"
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    nginx -t
    systemctl reload nginx
    echo "==> Nginx HTTPS ativo."
}

if [[ -f "${CERT}" ]]; then
    install_https
    echo "OK — certificado já existe. Teste: curl -I https://${DOMAIN}/"
    exit 0
fi

install_http

if ! command -v certbot >/dev/null 2>&1; then
    echo "Instale certbot: apt install -y certbot python3-certbot-nginx" >&2
    echo "Depois: certbot --nginx -d ${DOMAIN}" >&2
    exit 0
fi

echo "==> Obtendo certificado Let's Encrypt (Certbot)..."
CERTBOT_ARGS=(--nginx -d "${DOMAIN}" --non-interactive --agree-tos --redirect)
if [[ -n "${EMAIL}" ]]; then
    CERTBOT_ARGS+=(--email "${EMAIL}")
else
    CERTBOT_ARGS+=(--register-unsafely-without-email)
fi

if certbot "${CERTBOT_ARGS[@]}"; then
    if [[ -f "${CERT}" ]]; then
        install_https
        echo "OK — HTTPS configurado. Teste: curl -I https://${DOMAIN}/"
    else
        echo "Certbot terminou mas certificado não encontrado em ${CERT}" >&2
        exit 1
    fi
else
    echo "Certbot falhou. Nginx continua em HTTP com server_name ${DOMAIN}." >&2
    echo "Corrija DNS (A → IP do VPS) e rode de novo:" >&2
    echo "  sudo CERTBOT_EMAIL=seu@email.com bash ${ROOT}/deploy/install-nginx-bomfim.sh" >&2
    exit 1
fi
