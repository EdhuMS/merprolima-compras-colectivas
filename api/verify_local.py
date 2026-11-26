"""Capture repeatable local evidence. External data calls use explicit test fixtures."""
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from fastapi.testclient import TestClient
from api import main
from api.replay import replay

saved = {}
example = json.loads((main.RESULTS / "resultados.json").read_text(encoding="utf-8"))["ejemplo"]
baseline, estimate, status = main.infer(example["entrada"]["producto"],
    [{"features": [example["entrada"][c] for c in main.FIELDS]}])
record = dict(model_sha256=main.ARTIFACT_SHA256, status=status, baseline=baseline, estimate=estimate,
    input_snapshot={"producto": example["entrada"]["producto"], "fields": main.FIELDS,
                    "features": [[example["entrada"][c] for c in main.FIELDS]]})
times = []
for _ in range(20):
    start = time.perf_counter()
    main.infer(example["entrada"]["producto"], [{"features": [example["entrada"][c] for c in main.FIELDS]}])
    times.append((time.perf_counter()-start)*1000)
report = {"captured_at": datetime.now(timezone.utc).isoformat(), "environment": "local",
    "data_origin": "simulated", "remote_e2e_verified": False,
    "model_version": main.VERSION, "model_sha256": main.ARTIFACT_SHA256,
    "example": record, "replay": replay(record),
    "latency": {"scope": "local artifact load and inference; excludes HTTP, Auth, Supabase, Render and Vercel",
                "n": len(times), "median_ms": sorted(times)[len(times)//2], "max_ms": max(times)}}
target = Path(sys.argv[1]); target.parent.mkdir(exist_ok=True, parents=True)
target.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(report["latency"], ensure_ascii=False))
