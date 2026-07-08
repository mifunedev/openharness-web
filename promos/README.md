# Promotion artifacts

Reviewable, non-published artifacts for promoting Open Harness content on external channels.

These files are not Docusaurus routes. They hold draft copy, target URLs, asset references, and posting checklists for humans to review before publishing.

## Deterministic banner workflow

Use banner recipes when a promo post needs a visual. The recipe is the source of truth; rendered images are outputs. The renderer uses a browserless HTML/CSS-like layout engine (`satori`) and Sharp, so alignment comes from flexbox-style layout rather than hand-positioned SVG text or a heavyweight Chromium screenshot.

1. Create or edit a JSON recipe under `promos/banner-recipes/`.
2. Keep visual decisions in explicit slots: headline lines, proof path, CTA, source screenshot, crop/slot, layout/theme tokens, output paths, and review checklist.
3. Render the card:

   ```bash
   pnpm run render:blog-banner -- promos/banner-recipes/<recipe>.json
   ```

4. Review the generated SVG/JPG before attaching to Post Bridge or posting manually.
5. Commit the recipe plus rendered outputs together so the banner can be reproduced later.

This is intentionally Canva-like but source-controlled: no AI image generation, no hidden edits, no one-off screenshots pasted into a design tool, and no browser/Chromium dependency for rendering.
