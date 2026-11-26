#!/bin/zsh
cd -- "${0:A:h}"
python3 scripts/configure-key.py
read -k 1 '?Нажмите любую клавишу, чтобы закрыть окно.'
