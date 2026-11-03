"""Download HAM10000 from Kaggle.

Needs Kaggle credentials: ~/.kaggle/kaggle.json, or KAGGLE_USERNAME and KAGGLE_KEY.

    python -m skin_ml.download --data-dir data/ham10000
"""

from __future__ import annotations

import argparse
from pathlib import Path

DATASET = "kmader/skin-cancer-mnist-ham10000"


def download(data_dir: Path) -> None:
    if next(data_dir.rglob("HAM10000_metadata.csv"), None) is not None:
        print(f"HAM10000 already present in {data_dir}")
        return
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi

        api = KaggleApi()
        api.authenticate()
    except Exception as exc:  # the kaggle package raises several types when credentials are missing
        raise SystemExit(
            "Could not authenticate with Kaggle. Put kaggle.json in ~/.kaggle/ "
            f"or set KAGGLE_USERNAME and KAGGLE_KEY.\n({exc})"
        ) from exc

    data_dir.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {DATASET} (~5 GB) to {data_dir} ...")
    api.dataset_download_files(DATASET, path=str(data_dir), unzip=True, quiet=False)
    print("Done.")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path("data/ham10000"))
    download(parser.parse_args(argv).data_dir)


if __name__ == "__main__":
    main()
