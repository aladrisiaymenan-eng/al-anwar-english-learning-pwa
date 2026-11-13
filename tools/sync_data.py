#!/usr/bin/env python3
"""Synchronize independent course JSON files into browser runtime files.

Usage from the project root:
    python3 tools/sync_data.py

Edit data/courses/A1.json ... data/courses/C2.json first. This script updates:
- data/courses/<level>.js
- data/curriculum.json
- data/curriculum.js
- the embedded fallback inside index.html for Android content:// opening
"""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
COURSES=DATA/'courses'
LEVELS=['A1','A2','B1','B2','C1','C2','X1','X2','X3']
levels=[]
for code in LEVELS:
    path=COURSES/f'{code}.json'
    if not path.exists():
        raise SystemExit(f'Missing course file: {path}')
    course=json.loads(path.read_text(encoding='utf-8'))
    if course.get('level')!=code:
        raise SystemExit(f'Wrong level in {path}: expected {code}')
    course['course_file']=f'data/courses/{code}.json'
    levels.append(course)
    runtime='window.COURSES=window.COURSES||{};window.COURSES['+json.dumps(code)+']='+json.dumps(course,ensure_ascii=False,separators=(',',':'))+';'
    (COURSES/f'{code}.js').write_text(runtime,encoding='utf-8')

curriculum={'version':'2026.11.04','institute':'معهد الأنوار','levels':levels}
(DATA/'curriculum.json').write_text(json.dumps(curriculum,ensure_ascii=False,indent=2),encoding='utf-8')
(DATA/'curriculum.js').write_text('window.CURRICULUM='+json.dumps(curriculum,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')

index=ROOT/'index.html'
html=index.read_text(encoding='utf-8')
start=html.index('<script id="embedded-curriculum-fallback">')
end=html.index('</script>',start)+len('</script>')
fallback='<script id="embedded-curriculum-fallback">'+(DATA/'curriculum.js').read_text(encoding='utf-8')+'</script>'
html=html[:start]+fallback+html[end:]
index.write_text(html,encoding='utf-8')
print('Synchronized:', ', '.join(LEVELS))
