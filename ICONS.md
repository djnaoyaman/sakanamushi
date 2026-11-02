# Android icon exports

`android-chrome-192.png` and `android-chrome-512.png` are compatibility-size
exports of the approved `favicon.png` / embedded Apple icon. The source is
180 × 180 pixels (SHA-256
`346c65e94ce77fae2a620c72af66331821ae1d73cd92b87674e232ca30e02194`).

The exports use deterministic Pillow 13.0.0 LANCZOS resampling of the complete
RGB image. No crop, recoloring, padding, AI enhancement or new artwork is used.
The 512-pixel file does **not** contain additional original detail; the source
remains 180 pixels. Existing favicon and Apple icon bytes are unchanged.

Run `python tools/export-android-icons.py` with Pillow installed to reproduce.
The manifest declares each actual PNG dimension with `purpose: any`, not
`maskable`; full artwork is preserved rather than asserting a new safe-zone
composition. Browser decode, URLs, MIME, sizes and small-size appearance are
checked by `tests/icons-browser.cjs`. This is not physical Android installation
verification or a promise that existing home-screen shortcuts refresh.
