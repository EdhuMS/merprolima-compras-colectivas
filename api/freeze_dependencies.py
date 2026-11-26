"""Freeze the isolated verification environment, including transitive dependencies."""
from importlib.metadata import distributions
from pathlib import Path
import sys

packages = sorted(d.metadata["Name"] + "==" + d.version for d in distributions(path=[sys.argv[1]]))
Path(__file__).with_name("requirements.lock.txt").write_text("\n".join(packages) + "\n", encoding="utf-8")
