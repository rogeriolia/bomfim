"""Túnel SSH opcional para dev local acessar Postgres no VPS (porta 5432 fechada na internet)."""
from __future__ import annotations

import os
import shutil
import socket
import subprocess
import sys
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from subprocess import Popen

_tunnel_proc: Popen[bytes] | None = None
_tunnel_forwarder: object | None = None


def _parse_ssh_target(target: str) -> tuple[str, str]:
    target = target.strip()
    if "@" in target:
        user, _, host = target.partition("@")
        return user.strip() or "root", host.strip()
    return "root", target


def _start_sshtunnel_forwarder(
    ssh_host: str,
    ssh_user: str,
    *,
    local_port: int,
    ssh_password: str = "",
    ssh_key: str = "",
) -> bool:
    """Túnel via sshtunnel (senha/chave no .env, sem prompt interativo)."""
    global _tunnel_forwarder

    try:
        from sshtunnel import SSHTunnelForwarder
    except ImportError:
        print(
            "Erro: instale sshtunnel no venv do projeto: python -m pip install sshtunnel",
            file=sys.stderr,
        )
        return False

    if _tunnel_forwarder is not None:
        try:
            _tunnel_forwarder.stop()  # type: ignore[union-attr]
        except Exception:
            pass
        _tunnel_forwarder = None

    kwargs: dict = {
        "ssh_address_or_host": (ssh_host, 22),
        "ssh_username": ssh_user,
        "remote_bind_address": ("127.0.0.1", 5432),
        "local_bind_address": ("127.0.0.1", local_port),
        "set_keepalive": 30.0,
    }
    if ssh_password:
        kwargs["ssh_password"] = ssh_password
    if ssh_key:
        kwargs["ssh_pkey"] = ssh_key

    try:
        forwarder = SSHTunnelForwarder(**kwargs)
        forwarder.start()
    except Exception as exc:
        print(f"Erro: túnel SSH (sshtunnel): {exc}", file=sys.stderr)
        return False

    _tunnel_forwarder = forwarder
    return True


def _can_connect(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _is_local_host(host: str) -> bool:
    return host.strip().lower() in ("127.0.0.1", "localhost", "::1")


def ensure_db_tunnel_from_env() -> bool:
    """
    Se o Postgres do .env não responde, abre ssh -L local:127.0.0.1:5432 e ajusta DB_HOST/DB_PORT.
    Retorna True se a conexão (direta ou via túnel) estiver disponível.
    """
    global _tunnel_proc

    from bomfim.config import _env_get, load_project_dotenv

    if os.environ.get("BOMFIM_AUTO_SSH_TUNNEL", "1").strip().lower() in ("0", "false", "no"):
        return False

    load_project_dotenv()
    host = _env_get("DB_HOST")
    port = int(_env_get("DB_PORT", "5432") or "5432")

    if host and _can_connect(host, port):
        return True

    ssh_target = (_env_get("BOMFIM_SSH_TUNNEL") or "").strip()
    if not ssh_target and host and not _is_local_host(host):
        user = _env_get("BOMFIM_SSH_USER", "root")
        ssh_target = f"{user}@{host}"

    if not ssh_target:
        return False

    local_port = int(_env_get("BOMFIM_SSH_LOCAL_PORT", "5433") or "5433")
    if _can_connect("127.0.0.1", local_port):
        os.environ["BOMFIM_DB_TUNNEL_ACTIVE"] = "1"
        os.environ["DB_HOST"] = "127.0.0.1"
        os.environ["DB_PORT"] = str(local_port)
        return True

    ssh_password = (_env_get("BOMFIM_SSH_PASSWORD") or "").strip()
    ssh_key_path = (_env_get("BOMFIM_SSH_IDENTITY_FILE") or "").strip()
    ssh_user, ssh_host = _parse_ssh_target(ssh_target)

    if ssh_password or ssh_key_path:
        print(f"Abrindo tunel SSH para Postgres ({ssh_target} -> 127.0.0.1:{local_port})...")
        if not _start_sshtunnel_forwarder(
            ssh_host,
            ssh_user,
            local_port=local_port,
            ssh_password=ssh_password,
            ssh_key=ssh_key_path,
        ):
            return False
    else:
        ssh_bin = shutil.which("ssh")
        if not ssh_bin:
            print(
                "Aviso: defina BOMFIM_SSH_PASSWORD no .env ou instale OpenSSH (ssh no PATH).",
                file=sys.stderr,
            )
            return False
        if _tunnel_proc is not None and _tunnel_proc.poll() is None:
            _tunnel_proc.terminate()

        cmd = [
            ssh_bin,
            "-N",
            "-o",
            "BatchMode=no",
            "-o",
            "ExitOnForwardFailure=yes",
            "-o",
            "ServerAliveInterval=30",
            "-L",
            f"{local_port}:127.0.0.1:5432",
            ssh_target,
        ]
        print(f"Abrindo tunel SSH para Postgres ({ssh_target} -> 127.0.0.1:{local_port})...")
        _tunnel_proc = subprocess.Popen(cmd)

    for _ in range(30):
        if _can_connect("127.0.0.1", local_port):
            os.environ["BOMFIM_DB_TUNNEL_ACTIVE"] = "1"
            os.environ["DB_HOST"] = "127.0.0.1"
            os.environ["DB_PORT"] = str(local_port)
            print(f"Tunel Postgres ativo (DB -> 127.0.0.1:{local_port}).")
            return True
        if _tunnel_proc is not None and _tunnel_proc.poll() is not None:
            print("Erro: túnel SSH encerrou. Confirme login/chave SSH no VPS.", file=sys.stderr)
            return False
        if _tunnel_forwarder is not None and not getattr(_tunnel_forwarder, "is_active", True):
            print("Erro: túnel SSH (sshtunnel) encerrou.", file=sys.stderr)
            return False
        time.sleep(0.25)

    print("Erro: túnel SSH não respondeu a tempo.", file=sys.stderr)
    return False
