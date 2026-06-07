"""PyInstaller build script for the DocuScan extraction sidecar.

Produces a single-file binary in src-tauri/binaries/ with the Tauri
target-triple suffix required by tauri.conf.json's externalBin field.

Usage:
    python sidecar/build.py              # auto-detects platform
    python sidecar/build.py --platform linux
    python sidecar/build.py --platform windows
"""

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "src-tauri" / "binaries"

PLATFORM_TRIPLES = {
    "linux": "x86_64-unknown-linux-gnu",
    "windows": "x86_64-pc-windows-msvc",
}


def detect_platform() -> str:
    system = platform.system().lower()
    if system == "linux":
        return "linux"
    elif system == "windows":
        return "windows"
    else:
        print(f"Unsupported platform: {system}", file=sys.stderr)
        sys.exit(1)


def build_sidecar(target_platform: str) -> None:
    triple = PLATFORM_TRIPLES[target_platform]
    binary_ext = ".exe" if target_platform == "windows" else ""
    output_name = f"sidecar-{triple}{binary_ext}"
    output_path = OUTPUT_DIR / output_name

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Building sidecar for {target_platform} ({triple})...")
    print(f"Output: {output_path}")

    dist_dir = SCRIPT_DIR / "dist"
    build_dir = SCRIPT_DIR / "build"

    pyinstaller_args = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--onefile",
        "--clean",
        "--noconfirm",
        f"--distpath={dist_dir}",
        f"--workpath={build_dir}",
        "--name=sidecar",
        "--hidden-import=langchain_community.llms.huggingface_hub",
        "--hidden-import=langchain_openai",
        "--hidden-import=langchain_google_genai",
        "--hidden-import=pytesseract",
        "--hidden-import=PIL._tkinter_finder",
        str(SCRIPT_DIR / "main.py"),
    ]

    result = subprocess.run(pyinstaller_args, cwd=SCRIPT_DIR)
    if result.returncode != 0:
        print("PyInstaller build failed", file=sys.stderr)
        sys.exit(result.returncode)

    built_binary = dist_dir / f"sidecar{binary_ext}"
    if not built_binary.exists():
        print(f"Built binary not found at {built_binary}", file=sys.stderr)
        sys.exit(1)

    shutil.copy2(built_binary, output_path)

    if target_platform == "linux":
        output_path.chmod(0o755)

    print(f"\nSidecar built successfully: {output_path}")
    print(f"Size: {output_path.stat().st_size / 1_048_576:.1f} MB")

    shutil.rmtree(dist_dir, ignore_errors=True)
    shutil.rmtree(build_dir, ignore_errors=True)

    spec_files = list(SCRIPT_DIR.glob("*.spec"))
    for spec in spec_files:
        spec.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(description="Build DocuScan extraction sidecar")
    parser.add_argument(
        "--platform",
        choices=["linux", "windows"],
        default=None,
        help="Target platform (default: auto-detect)",
    )
    args = parser.parse_args()

    target = args.platform or detect_platform()
    build_sidecar(target)


if __name__ == "__main__":
    main()
