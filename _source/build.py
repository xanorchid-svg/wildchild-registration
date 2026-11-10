import re, os, glob, shutil
import pathlib; SRC = str(pathlib.Path(__file__).parent); OUT = str(pathlib.Path(__file__).parent.parent / 'site-build')
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)

def src(i, w):
    return f"https://static.wixstatic.com/media/{i}/v1/fit/w_{w},h_{w*2},q_85,enc_auto/{i}"
def img(m):
    i, w, alt, extra = m.group(1), int(m.group(2)), m.group(3), m.group(4) or ''
    lazy = '' if 'loading=' in extra else ' loading="lazy"'
    return f'<img src="{src(i,w)}" srcset="{src(i,w//2)} {w//2}w, {src(i,w)} {w}w" alt="{alt}"{lazy} decoding="async"{extra}>'
def macros(s):
    s = re.sub(r"\{\{IMG ([^|]+)\|(\d+)\|([^|}]*)(?:\|([^}]*))?\}\}", img, s)
    return re.sub(r"\{\{URL ([^|]+)\|(\d+)\}\}", lambda m: src(m.group(1), int(m.group(2))), s)

import hashlib
VER = hashlib.md5((open(f'{SRC}/styles.css').read()+open(f'{SRC}/main.js').read()).encode()).hexdigest()[:8]
header = open(f'{SRC}/_header.html').read(); footer = open(f'{SRC}/_footer.html').read()
LOGO = 'b80b05_b468f9ac18b44924a95eabf5101283b5~mv2.png'
for p in sorted(glob.glob(f'{SRC}/pages/*.html')):
    body = open(p).read()
    title = re.search(r'<!--title: (.*?)-->', body).group(1)
    desc = re.search(r'<!--desc: (.*?)-->', body).group(1)
    ogm = re.search(r'<!--og: (.*?)-->', body)
    og = ogm.group(1) if ogm else 'b80b05_70d9104ec0664b67a9f6fc4a614490cb~mv2.jpg'
    name = os.path.basename(p)
    slug = '' if name == 'index.html' else name[:-5]
    doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://www.wildchildnosara.com/{slug}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{{{{URL {og}|1600}}}}">
<link rel="icon" href="{{{{URL {LOGO}|64}}}}">
<link rel="preconnect" href="https://static.wixstatic.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css?v={VER}">
</head>
<body class="page-{slug or 'home'}">
{header}
<main>
{body}
</main>
{footer}
<a class="wa" href="https://wa.me/50661640827" aria-label="Message us on WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.6-.8-2.4-1.9-.6-.8-.4-.8.3-1.8.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.4z"/></svg></a>
<script src="/main.js?v={VER}" defer></script>
</body>
</html>
'''
    open(f'{OUT}/{name}', 'w').write(macros(doc))
shutil.copy(f'{SRC}/styles.css', OUT); shutil.copy(f'{SRC}/main.js', OUT)
open(f'{OUT}/vercel.json','w').write('''{
  "cleanUrls": true,
  "trailingSlash": false,
  "redirects": [
    {"source": "/copy-of-our-team", "destination": "/our-story", "permanent": true},
    {"source": "/home", "destination": "/", "permanent": true}
  ],
  "headers": [
    {"source": "/(styles.css|main.js)", "headers": [{"key": "Cache-Control", "value": "public, max-age=86400"}]}
  ]
}
''')
print(sorted(os.listdir(OUT)))
