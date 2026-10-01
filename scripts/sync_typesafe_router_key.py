"""Copy TYPESAFE_ROUTER_API_KEY from CentralComm aicentralv2 .env into Bomfim .env."""

from __future__ import annotations

from pathlib import Path

ENV_KEY = "TYPESAFE_ROUTER_API_KEY"
SRC = Path.home() / "VSCodeTestes" / "aicentralv2" / ".env"
DST = Path(__file__).resolve().parents[1] / ".env"


def _read_key(path: Path) -> str | None:
    if not path.is_file():
        return None
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if stripped.startswith(f"{ENV_KEY}="):
            value = stripped.split("=", 1)[1].strip()
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]
            return value or None
    return None


def main() -> None:
    key = _read_key(SRC)
    if not key:
        raise SystemExit(f"{ENV_KEY} not found in {SRC}")

    text = DST.read_text(encoding="utf-8-sig") if DST.is_file() else ""
    lines = text.splitlines()
    out: list[str] = []
    replaced = False
    for line in lines:
        if line.strip().startswith(f"{ENV_KEY}="):
            out.append(f"{ENV_KEY}={key}")
            replaced = True
        else:
            out.append(line)
    if not replaced:
        if out and out[-1].strip():
            out.append("")
        out.append("# TypeSafe (CentralComm) — roteador Cursor")
        out.append(f"{ENV_KEY}={key}")
    DST.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")
    print("ok", "replaced" if replaced else "appended")


if __name__ == "__main__":
    main()
