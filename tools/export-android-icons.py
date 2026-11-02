"""Export compatibility sizes from the unchanged approved 180px artwork.

No AI enhancement, cropping, recoloring, padding or invented detail.
Pillow LANCZOS resampling changes pixel dimensions, not source resolution.
"""
from pathlib import Path
import hashlib
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'favicon.png'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '346c65e94ce77fae2a620c72af66331821ae1d73cd92b87674e232ca30e02194'
with Image.open(source) as original:
    assert original.size == (180, 180)
    assert original.mode == 'RGB'
    for size in (192, 512):
        original.resize((size, size), Image.Resampling.LANCZOS).save(
            root / f'android-chrome-{size}.png', format='PNG', optimize=True)
