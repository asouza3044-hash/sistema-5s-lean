# -*- coding: utf-8 -*-
"""
Conversor de Logo da Impaktto para Formato JPEG 100% compatível com o ReportLab
"""

from PIL import Image
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
png_path = os.path.join(BASE_DIR, "logo_impaktto.png")
jpg_path = os.path.join(BASE_DIR, "logo_impaktto_pdf.jpg")

if os.path.exists(png_path):
    im = Image.open(png_path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im_rgba = im.convert('RGBA')
        bg = Image.new('RGB', im_rgba.size, (255, 255, 255))
        bg.paste(im_rgba, mask=im_rgba.split()[3])
        bg.save(jpg_path, 'JPEG', quality=100)
    else:
        im.convert('RGB').save(jpg_path, 'JPEG', quality=100)

    print(f"✓ Logo convertida com sucesso para: {jpg_path}")
else:
    print(f"Erro: Arquivo {png_path} não encontrado.")
