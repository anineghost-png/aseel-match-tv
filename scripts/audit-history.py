#!/usr/bin/env python3
"""Check reachable Git blobs and staged text without printing credential values."""
import json,re,subprocess
from pathlib import Path
patterns=[r'sk-proj-[A-Za-z0-9_-]{20,}',r'gh[pousr]_[A-Za-z0-9]{25,}',r'github_pat_[A-Za-z0-9_]{30,}',r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----',r'https?://[^\s/]+:[^\s/@]+@']
objects=subprocess.check_output(['git','rev-list','--objects','--all'],text=True).splitlines()
objects+=subprocess.check_output(['git','ls-files','--stage'],text=True).splitlines()
findings=[];seen=set()
for line in objects:
    if '\t' in line:
        meta,name=line.split('\t',1);sha=meta.split()[1]
    else:
        parts=line.split(' ',1);sha=parts[0];name=parts[1] if len(parts)>1 else ''
    if sha in seen:continue
    if subprocess.check_output(['git','cat-file','-t',sha],text=True).strip()!='blob':continue
    seen.add(sha)
    value=subprocess.check_output(['git','cat-file','blob',sha]).decode('utf-8','replace')
    if name.endswith(('.m3u','.m3u8','.xmltv','.sqlite','.db','.pem','.key')) or (Path(name).name.startswith('.env') and Path(name).name!='.env.example'):
        findings.append({'path':name,'reason':'sensitive filename'})
    for pattern in patterns:
        if re.search(pattern,value):findings.append({'path':name,'reason':'credential pattern'})
print(json.dumps({'scanned_blobs':len(seen),'findings':findings},indent=2))
raise SystemExit(bool(findings))
