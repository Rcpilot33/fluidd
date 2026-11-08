#!/usr/bin/env python3
"""Package a built K2 Fluidd UI as an nginx-readable release/test ZIP."""
import argparse
import json
from pathlib import Path
import subprocess
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED


def package(dist, output):
    dist, output = Path(dist), Path(output)
    release = json.loads((dist / 'release_info.json').read_text())
    if (release.get('project_owner') != 'Rcpilot33' or
            release.get('version') != (dist / '.version').read_text().strip() or
            (dist / 'k2-ui-overlay-support.txt').read_text().strip() != '9' or
            (dist / 'k2-device-cards-api.txt').read_text().strip() != '1'):
        raise ValueError('Build Fluidd with the consolidated K2 features first')
    for name in ('index.html', 'sw.js'):
        if not (dist / name).is_file():
            raise ValueError('Missing build file: ' + name)
    repo = Path(__file__).resolve().parents[1]
    def git(*args):
        return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()
    provenance = dict(branch=git('branch', '--show-current'), commit=git('rev-parse', 'HEAD'),
                      modified=bool(git('status', '--porcelain', '--untracked-files=normal')))
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in sorted(p for p in dist.rglob('*') if p.is_file()):
            entry = ZipInfo(path.relative_to(dist).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = ZIP_DEFLATED
            bundle.writestr(entry, path.read_bytes())
        entry = ZipInfo('k2-build.json', date_time=(2026, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        bundle.writestr(entry, json.dumps(provenance, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, default=Path('dist'))
    parser.add_argument('--output', type=Path, default=Path('fluidd.zip'))
    args = parser.parse_args()
    package(args.dist, args.output)
