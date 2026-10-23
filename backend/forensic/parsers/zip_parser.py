import os
import zipfile
from pathlib import Path
from typing import List, Tuple

def safe_extract_zip(zip_path: Path, destination_dir: Path) -> Tuple[List[Path], List[str]]:
    """
    Safely extracts a ZIP archive, verifying that every extracted member
    strictly stays within the destination directory (preventing Zip Slip vulnerabilities).
    """
    extracted_files: List[Path] = []
    warnings: List[str] = []

    destination_dir = destination_dir.resolve()
    destination_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            # Check for suspicious attributes or path traversal
            target_path = (destination_dir / member.filename).resolve()

            # Prevent Zip Slip: ensure target_path is within destination_dir
            if not str(target_path).startswith(str(destination_dir)):
                warnings.append(f"Security Alert: Blocked path traversal attempt in archive member '{member.filename}'")
                continue

            if member.is_dir():
                target_path.mkdir(parents=True, exist_ok=True)
                continue

            target_path.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as source, open(target_path, "wb") as target:
                while chunk := source.read(65536):
                    target.write(chunk)

            extracted_files.append(target_path)

    return extracted_files, warnings
