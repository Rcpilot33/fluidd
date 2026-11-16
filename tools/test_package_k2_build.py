import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile
from package_k2_build import package


class PackageMarkersTest(unittest.TestCase):
    def test_windows_markers_are_linux_shell_compatible(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dist = root / 'dist'
            dist.mkdir()
            (dist / '.version').write_text('v1.37.5-rc.2')
            (dist / 'release_info.json').write_text(json.dumps({
                'project_owner': 'Rcpilot33', 'version': 'v1.37.5-rc.2'}))
            markers = {'k2-ui-overlay-support.txt': b'8',
                       'k2-settings-api.txt': b'1',
                       'k2-device-cards-api.txt': b'1'}
            for name, value in markers.items():
                (dist / name).write_bytes(value + b'\r\n')
            for name in ('index.html', 'sw.js'):
                (dist / name).write_bytes(b'unchanged\r\n')
            archive = root / 'fluidd.zip'
            package(dist, archive)
            with ZipFile(archive) as bundle:
                for name, value in markers.items():
                    self.assertEqual(bundle.read(name), value + b'\n')
                    # POSIX command substitution strips only trailing LF.
                    self.assertEqual(bundle.read(name).rstrip(b'\n'), value)
                self.assertEqual(bundle.read('index.html'), b'unchanged\r\n')


if __name__ == '__main__':
    unittest.main()
