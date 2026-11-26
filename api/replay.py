"""Replay an authorized private log export without database access or retraining."""
import json
import sys
from pathlib import Path
from api.main import ARTIFACT_SHA256, LEGACY_SHA256, FIELDS, infer

def replay(record):
    snapshot = record["input_snapshot"]
    digest = record["model_sha256"]
    if digest not in (ARTIFACT_SHA256, LEGACY_SHA256) or snapshot["fields"] != FIELDS:
        raise ValueError("Versión o contrato incompatibles")
    baseline, estimate, status = infer(snapshot["producto"], [{"features": f} for f in snapshot["features"]],
                                       legacy=digest == LEGACY_SHA256)
    if record["status"] != "candidate":
        raise ValueError("Un fallback documenta una indisponibilidad; no es una inferencia reproducible")
    assert status == "candidate" and baseline == float(record["baseline"])
    assert abs(estimate - float(record["estimate"])) <= 1e-6
    return {"baseline": baseline, "estimate": estimate, "verified": True}

if __name__ == "__main__":
    print(json.dumps(replay(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))))
