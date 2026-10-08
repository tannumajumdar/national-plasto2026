"""Generate real 3D models (.glb) for catalogue products with the Meshy
image-to-3D API, and register them in js/catalogue-3d.js (window.NP_MODELS),
which products.html uses to show a 360-degree 3D viewer.

Usage (PowerShell):
    $env:MESHY_API_KEY = "msy_..."
    python tools/make-3d-models.py "National|Admire" "Next|Cellar Wardrobe"
    python tools/make-3d-models.py --limit 5        # first 5 products without a model
    python tools/make-3d-models.py --all            # every product without a model

Each product's first photo is sent to Meshy (about 30 credits per model).
Products that already have a model are skipped, so the script can be re-run.
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE = os.path.join(ROOT, 'js', 'catalogue-2026.js')
REGISTRY = os.path.join(ROOT, 'js', 'catalogue-3d.js')
MODELS_DIR = os.path.join(ROOT, 'models')
API = 'https://api.meshy.ai/openapi/v1/image-to-3d'
HEADER = ('/* Real 3D models for the catalogue Quick View, keyed "Brand|Name".\n'
          ' * Written by tools/make-3d-models.py - edit with care. */\n')


def load_catalogue():
    text = open(CATALOGUE, encoding='utf-8').read()
    return json.loads(text[text.index('['):text.rindex(']') + 1])


def load_registry():
    if not os.path.exists(REGISTRY):
        return {}
    text = open(REGISTRY, encoding='utf-8').read()
    return json.loads(text[text.index('{'):text.rindex('}') + 1])


def save_registry(models):
    body = json.dumps(dict(sorted(models.items())), indent=1, ensure_ascii=False)
    with open(REGISTRY, 'w', encoding='utf-8') as f:
        f.write(HEADER + 'window.NP_MODELS = ' + body + ';\n')


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def call(url, key, data=None):
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + key})
    if data is not None:
        req.data = json.dumps(data).encode()
        req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def png_data_uri(path):
    # Meshy accepts jpg/png only; the catalogue cut-outs are webp
    buf = io.BytesIO()
    Image.open(path).convert('RGBA').save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def make_model(product, key):
    photo = os.path.join(ROOT, product['img'][0]['f'])
    task = call(API, key, {
        'image_url': png_data_uri(photo),
        'should_texture': True,
        'enable_pbr': True,
        'should_remesh': True,
        'target_polycount': 60000,
        'target_formats': ['glb'],
    })
    task_id = task['result']
    while True:
        time.sleep(10)
        t = call(API + '/' + task_id, key)
        print('   ', t['status'], str(t.get('progress', 0)) + '%', flush=True)
        if t['status'] == 'SUCCEEDED':
            break
        if t['status'] in ('FAILED', 'CANCELED'):
            raise RuntimeError((t.get('task_error') or {}).get('message') or t['status'])
    name = slug(product['b'] + '-' + product['n']) + '.glb'
    urllib.request.urlretrieve(t['model_urls']['glb'], os.path.join(MODELS_DIR, name))
    return 'models/' + name


def main(args):
    key = os.environ.get('MESHY_API_KEY')
    if not key:
        sys.exit('Set MESHY_API_KEY first (Meshy dashboard -> API keys).')
    os.makedirs(MODELS_DIR, exist_ok=True)
    products = load_catalogue()
    models = load_registry()
    todo = [p for p in products if p['b'] + '|' + p['n'] not in models]

    if '--all' in args:
        pass
    elif '--limit' in args:
        todo = todo[:int(args[args.index('--limit') + 1])]
    else:
        wanted = set(args)
        todo = [p for p in todo if p['b'] + '|' + p['n'] in wanted]
        if not todo:
            sys.exit('Nothing to do: name products as "Brand|Name", or use --limit N / --all.')

    for n, p in enumerate(todo, 1):
        label = p['b'] + '|' + p['n']
        print('[%d/%d] %s' % (n, len(todo), label), flush=True)
        try:
            models[label] = make_model(p, key)
            save_registry(models)  # save as we go so a stop never loses work
        except Exception as e:
            print('    failed:', e, flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])
