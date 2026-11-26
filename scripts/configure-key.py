#!/usr/bin/env python3
"""Run by the owner in Terminal. Never echoes or logs the secret."""
import getpass, os, pathlib, re, subprocess, sys, tempfile
root=pathlib.Path(__file__).resolve().parents[1]
target=root/'.env.local'
if not sys.stdin.isatty():
    raise SystemExit('Откройте этот помощник в Терминале. Ввод ключа через чат не поддерживается.')
if target.is_symlink(): raise SystemExit('Отказ: файл является ссылкой.')
tracked=subprocess.run(['git','ls-files','--error-unmatch','.env.local'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
ignored=subprocess.run(['git','check-ignore','-q','.env.local'],cwd=root).returncode==0
if tracked or not ignored: raise SystemExit('Отказ: файл не защищён исключением Git.')
print('Ключ будет сохранён только на этом компьютере:\n'+str(target))
print('Переменная: OPENAI_API_KEY. Доступ к файлу — только вашему пользователю.')
if input('Сохранить ключ здесь? Напишите да: ').strip().lower()!='да': raise SystemExit('Отменено, ничего не изменено.')
key=getpass.getpass('Вставьте ключ OpenAI (ввод скрыт) и нажмите Enter: ').strip()
if not re.fullmatch(r'sk-[A-Za-z0-9_-]{20,}',key): raise SystemExit('Формат ключа не распознан. Ничего не сохранено.')
old=target.read_text() if target.exists() else ''
lines=[line for line in old.splitlines() if not re.match(r'^\s*(?:export\s+)?OPENAI_API_KEY\s*=',line)]
fd,tmp=tempfile.mkstemp(prefix='.env-key-',dir=root)
try:
    os.fchmod(fd,0o600)
    with os.fdopen(fd,'w') as stream: stream.write('\n'.join(lines+['OPENAI_API_KEY='+key])+'\n')
    os.replace(tmp,target)
finally:
    if os.path.exists(tmp): os.unlink(tmp)
print('Ключ сохранён. Значение не выводится. Перезапустите приложение.')
