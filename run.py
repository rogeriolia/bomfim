"""
Bomfim — ponto de entrada local em Python.

Portas padrão por modo (se não houver PORT / .env / --port):
  dev      → 5173  (Vite, hot reload) — padrão ao rodar python run.py
  preview  → 4173  (Vite preview do build)
  serve    → 5000  (Python + dist/, teste pré-deploy)
  api      → 5001  (Flask + PostgreSQL)

Prioridade da porta: --port  >  PORT (ambiente)  >  .env  >  padrão do modo

Modos:
  python run.py              dev — um terminal: API Flask :5001 + Vite :5173 (login via /api)
  python run.py dev          idem
  python run.py serve        build estático via Python (:5000)
  python run.py preview      build + vite preview (:4173)

Exemplos:
  python run.py
  python run.py serve
  python run.py --port 8080 dev
"""
from __future__ import annotations

import argparse
import http.server
import os
import re
import shutil
import socket
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "bomfim-app"
DIST = APP / "dist"

# Portas padrão locais (sobrescreva com PORT, .env ou --port).
DEFAULT_PORT_BY_MODE = {"dev": 5173, "preview": 4173, "serve": 5000, "api": 5001}


def _read_port_from_dotenv() -> int | None:
    env_file = ROOT / ".env"
    if not env_file.is_file():
        return None
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("PORT"):
            match = re.match(r"^PORT\s*[=:]\s*(\d+)", line, re.IGNORECASE)
            if match:
                return int(match.group(1))
    return None


def resolve_port(cli_port: int | None, mode: str) -> int:
    if cli_port is not None:
        return cli_port
    env_port = os.environ.get("PORT")
    if env_port:
        try:
            return int(env_port)
        except ValueError:
            print(f"Aviso: PORT={env_port!r} inválido; usando fallback.", file=sys.stderr)
    dotenv_port = _read_port_from_dotenv()
    if dotenv_port is not None:
        return dotenv_port
    return DEFAULT_PORT_BY_MODE[mode]


def _banner(mode: str, port: int, extra: str = "") -> None:
    print("=" * 60)
    print(f"Bomfim — {mode}")
    print("=" * 60)
    print(f"Porta local: {port}")
    print(f"Acesse:      http://localhost:{port}")
    if extra:
        print(extra)
    print("=" * 60)


DEFAULT_API_PORT = DEFAULT_PORT_BY_MODE["api"]


def _port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((host, port)) == 0


def _pids_listening_on_port(port: int) -> list[int]:
    """PIDs com socket LISTEN na porta (Windows netstat / Unix ss)."""
    pids: set[int] = set()
    if sys.platform == "win32":
        result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, check=False)
        needle = f":{port}"
        for line in result.stdout.splitlines():
            if needle not in line or "LISTENING" not in line.upper():
                continue
            parts = line.split()
            if parts:
                try:
                    pids.add(int(parts[-1]))
                except ValueError:
                    pass
    else:
        result = subprocess.run(["ss", "-ltnp"], capture_output=True, text=True, check=False)
        if result.returncode != 0:
            result = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True, check=False)
            for part in result.stdout.split():
                try:
                    pids.add(int(part))
                except ValueError:
                    pass
            return sorted(pids)
        needle = f":{port}"
        for line in result.stdout.splitlines():
            if needle not in line:
                continue
            match = re.search(r"pid=(\d+)", line)
            if match:
                pids.add(int(match.group(1)))
    return sorted(pids)


def _terminate_pid(pid: int) -> None:
    if pid == os.getpid():
        return
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True, check=False)
    else:
        subprocess.run(["kill", "-TERM", str(pid)], capture_output=True, check=False)


def _free_port(api_port: int) -> bool:
    pids = _pids_listening_on_port(api_port)
    if not pids:
        return not _port_in_use("127.0.0.1", api_port)
    print(f"Encerrando processo(s) antigo(s) na porta {api_port}: {', '.join(map(str, pids))}")
    for pid in pids:
        _terminate_pid(pid)
    for _ in range(25):
        if not _port_in_use("127.0.0.1", api_port):
            return True
        time.sleep(0.2)
    return not _port_in_use("127.0.0.1", api_port)


def _run_flask_api(api_port: int) -> None:
    os.environ["API_PORT"] = str(api_port)
    from manage import app

    app.run(host="127.0.0.1", port=api_port, debug=False, use_reloader=False, threaded=True)


def _api_patch_users_available(api_port: int) -> bool:
    """True se PATCH /api/users existe (401/405/400 ok; 404 = API antiga)."""
    import urllib.error
    import urllib.request

    req = urllib.request.Request(
        f"http://127.0.0.1:{api_port}/api/users/0",
        method="PATCH",
        headers={"Content-Type": "application/json"},
        data=b"{}",
    )
    try:
        urllib.request.urlopen(req)
        return True
    except urllib.error.HTTPError as e:
        return e.code != 404
    except OSError:
        return False


def _ensure_api(api_port: int = DEFAULT_API_PORT) -> bool:
    """Sobe a API no mesmo processo (thread) se a porta estiver livre."""
    if _port_in_use("127.0.0.1", api_port):
        if _api_patch_users_available(api_port):
            print(f"API Flask já ativa em http://127.0.0.1:{api_port}")
            return True
        print(f"API desatualizada em http://127.0.0.1:{api_port}; reiniciando…", file=sys.stderr)
        if not _free_port(api_port):
            print(f"Erro: não foi possível liberar a porta {api_port}.", file=sys.stderr)
            return False
    print(f"Iniciando API Flask em http://127.0.0.1:{api_port} …")
    thread = threading.Thread(target=_run_flask_api, args=(api_port,), name="bomfim-api", daemon=True)
    thread.start()
    for _ in range(50):
        if _port_in_use("127.0.0.1", api_port):
            print("API pronta — login em http://localhost:5173/login")
            return True
        if not thread.is_alive():
            print("Erro: a API Flask não iniciou. Verifique PostgreSQL e .env (DATABASE_URL).", file=sys.stderr)
            return False
        time.sleep(0.2)
    print("Aviso: API demorou; tente o login em alguns segundos.", file=sys.stderr)
    return True


def _npm(*args: str) -> None:
    npm = shutil.which("npm")
    if not npm:
        print("Erro: npm não encontrado. Instale Node.js 20+ e execute npm install em bomfim-app/.", file=sys.stderr)
        sys.exit(1)
    subprocess.run([npm, *args], cwd=APP, check=True)


def cmd_dev(port: int, *, with_api: bool = True, api_port: int = DEFAULT_API_PORT) -> None:
    if with_api and not _ensure_api(api_port):
        sys.exit(1)
    if not (APP / "node_modules").is_dir():
        print("Instalando dependências (npm install)...")
        _npm("install")
    extra = "Hot reload ativo.\nLogin seed: rogerio+adm@4lia.com.br / 123456789"
    if with_api:
        extra += f"\nAPI: http://127.0.0.1:{api_port} (proxy Vite /api)"
    _banner("modo desenvolvimento (Vite + API)", port, extra)
    _npm("run", "dev", "--", "--port", str(port), "--strictPort")


def cmd_preview(port: int) -> None:
    if not (APP / "node_modules").is_dir():
        print("Instalando dependências (npm install)...")
        _npm("install")
    print("Gerando build de produção...")
    _npm("run", "build")
    _banner("preview do build (Vite)", port)
    _npm("run", "preview", "--", "--port", str(port), "--strictPort")


class SpaStaticHandler(http.server.SimpleHTTPRequestHandler):
    """Arquivos estáticos + index.html para rotas do React Router."""

    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stdout.write("%s - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), fmt % args))

    def do_GET(self) -> None:
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            index = os.path.join(path, "index.html")
            if os.path.isfile(index):
                self.path = self.path.rstrip("/") + "/index.html"
        elif not os.path.exists(path):
            self.path = "/index.html"
        return http.server.SimpleHTTPRequestHandler.do_GET(self)


def cmd_api(port: int) -> None:
    os.environ.setdefault("API_PORT", str(port))
    os.environ.setdefault("FLASK_APP", "manage.py")
    use_reloader = os.environ.get("FLASK_DEBUG", "1") not in ("0", "false", "False")
    _banner("API Flask (PostgreSQL)", port, "Endpoints em /api/*\nCtrl+C para encerrar.")
    from manage import app

    app.run(host="127.0.0.1", port=port, debug=use_reloader, use_reloader=use_reloader)


def cmd_serve(port: int) -> None:
    if not DIST.is_dir() or not (DIST / "index.html").is_file():
        print("Erro: bomfim-app/dist não encontrado.", file=sys.stderr)
        print("Execute antes: cd bomfim-app && npm install && npm run build", file=sys.stderr)
        print("Ou use: python run.py preview", file=sys.stderr)
        sys.exit(1)

    os.chdir(DIST)
    handler = lambda *args, **kwargs: SpaStaticHandler(*args, directory=str(DIST), **kwargs)

    _banner("servindo build estático (SPA)", port, f"Pasta: {DIST}\nCtrl+C para encerrar.")

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Executar Bomfim localmente",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Portas padrão: dev=5173, preview=4173, serve=5000. Use PORT, .env ou --port.",
    )
    parser.add_argument(
        "mode",
        nargs="?",
        choices=("dev", "preview", "serve", "api"),
        default="dev",
        help="dev=Vite :5173 (padrão); api=Flask :5001; serve=Python+dist :5000; preview=build+Vite",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        metavar="N",
        help="porta HTTP (sobrescreve PORT, .env e o padrão do modo)",
    )
    parser.add_argument(
        "--no-api",
        action="store_true",
        help="modo dev: não iniciar Flask :5001 (use se já rodar python run.py api)",
    )
    parser.add_argument(
        "--api-port",
        type=int,
        default=DEFAULT_API_PORT,
        metavar="N",
        help=f"modo dev: porta da API Flask (padrão {DEFAULT_API_PORT})",
    )
    args = parser.parse_args()
    port = resolve_port(args.port, args.mode)

    if args.mode == "dev":
        cmd_dev(port, with_api=not args.no_api, api_port=args.api_port)
    elif args.mode == "preview":
        cmd_preview(port)
    elif args.mode == "api":
        cmd_api(port)
    else:
        cmd_serve(port)


if __name__ == "__main__":
    main()
