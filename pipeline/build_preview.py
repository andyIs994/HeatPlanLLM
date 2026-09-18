"""Build the standalone chat preview from current UI sources and recipe data."""
import json
import re
from pathlib import Path


def build_preview(root):
    root = Path(root)
    template = (root / 'templates/preview.html').read_text(encoding='utf-8')
    template = template.replace('__STYLES__', (root / 'ui/chat.css').read_text(encoding='utf-8'))
    for token, name in [('__RULES__', 'recommendation.mjs'), ('__ENGINE__', 'chat-engine.mjs'), ('__UI__', 'chat-ui.mjs')]:
        source = (root / 'pipeline' / name).read_text(encoding='utf-8')
        (root / 'ui' / name).write_text(source, encoding='utf-8', newline='\n')
        template = template.replace(token, re.sub(r'^import .*?;\s*$', '', source, flags=re.M))
    rows = json.loads((root / 'data/recipes.json').read_text(encoding='utf-8'))
    template = template.replace('__RECIPES__', json.dumps(rows, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'))
    assert not re.search(r'__(STYLES|RULES|ENGINE|UI|RECIPES)__', template)
    (root / 'ui/preview.html').write_text(template, encoding='utf-8', newline='\n')


if __name__ == '__main__':
    build_preview(Path(__file__).resolve().parents[1])
    print('Built current standalone preview.')
