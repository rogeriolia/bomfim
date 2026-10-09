#!/usr/bin/env python3
"""Remove espaços antes dos nomes das variáveis de integração no .env (uso no servidor)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / ".env"
PREFIXES = ("PYPEFY_", "PIPEFY_", "MOSKIT_", "ZAPIER_", "CLICKSIGN_", "RECEITAWS_")


def main() -> int:
    if not ENV.is_file():
        print(f"Arquivo não encontrado: {ENV}", file=sys.stderr)
        return 1
    lines = ENV.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    changed = 0
    for line in lines:
        m = re.match(r"^(\s*)([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
        if m and any(m.group(2).startswith(p) for p in PREFIXES):
            if m.group(1):
                changed += 1
            out.append(f"{m.group(2)}={m.group(3)}")
        else:
            out.append(line)
    if changed:
        ENV.write_text("\n".join(out) + ("\n" if out else ""), encoding="utf-8")
        print(f"Corrigidas {changed} linha(s) em {ENV}")
    else:
        print("Nenhuma linha de integração precisou de correção.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
