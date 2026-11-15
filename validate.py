#!/usr/bin/env python3
"""Validate a Receipts world-verdict JSON file against schema.json plus the
rules JSON Schema cannot express:
  - key order matches the schema's generation order (tldr last)
  - every evidence_id cited in claims / access / prior_art exists in evidence
  - a claim marked 'confirmed' cites at least one independent evidence item
Usage: python3 validate.py verdict.json [more.json ...]
Exit code 0 = all valid, 1 = at least one failure.
"""
import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    sys.exit("jsonschema not installed: pip install jsonschema")

HERE = Path(__file__).parent
SCHEMA = json.loads((HERE / "schema.json").read_text())
KEY_ORDER = list(SCHEMA["properties"].keys())


def check(path: str) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(Path(path).read_text())
    except Exception as e:  # noqa: BLE001
        return [f"{path}: not valid JSON ({e})"]

    for err in jsonschema.Draft202012Validator(SCHEMA).iter_errors(data):
        errors.append(f"{path}: schema: {err.message} at {list(err.path)}")

    if list(data.keys()) != KEY_ORDER:
        errors.append(f"{path}: key order {list(data.keys())} != {KEY_ORDER}")

    evidence = {}
    for e in data.get("evidence", []):
        if isinstance(e, dict) and "id" in e:
            evidence[e["id"]] = e
        else:
            errors.append(f"{path}: evidence entry is not an object with an id: {str(e)[:80]!r}")

    def check_refs(owner: str, ids: list[int]) -> None:
        for i in ids:
            if i not in evidence:
                errors.append(f"{path}: {owner} cites missing evidence id {i}")

    for c in data.get("claims", []):
        check_refs(f"claim {c.get('claim', '?')[:40]!r}", c.get("evidence_ids", []))
        if c.get("status") == "confirmed" and not any(
            evidence.get(i, {}).get("independent")
            or evidence.get(i, {}).get("check") == "registry"
            for i in c.get("evidence_ids", [])
        ):
            errors.append(
                f"{path}: claim {c.get('claim', '')[:40]!r} is 'confirmed' but cites "
                "no independent evidence and no registry check (independence rule)"
            )
    check_refs("access", data.get("access", {}).get("evidence_ids", []))
    for p in data.get("prior_art", []):
        check_refs(f"prior_art {p.get('name', '?')!r}", p.get("evidence_ids", []))

    return errors


def main() -> int:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    all_errors: list[str] = []
    for path in sys.argv[1:]:
        all_errors.extend(check(path))
    if all_errors:
        print("\n".join(all_errors))
        return 1
    print(f"OK: {len(sys.argv) - 1} verdict(s) valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
