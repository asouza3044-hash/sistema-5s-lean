# -*- coding: utf-8 -*-
"""
Conversor de Logo da Impaktto para Formato JPEG 100% compatível com o ReportLab
"""

from PIL import Image
import os

scratch_dir = r"C:\Users\lasec\.gemini\antigravity\scratch\manual-5s-qualidade"
brain_dir = r"C:\Users\lasec\.gemini\antigravity\brain\c8f26f84-9c35-4516-bb09-a221d2c2091e"

png_path = os.path.join(scratch_dir, "logo_impaktto.png")
jpg_scratch = os.path.join(scratch_dir, "logo_impaktto_pdf.jpg")
jpg_brain = os.path.join(brain_dir, "logo_impaktto_pdf.jpg")

if os.path.exists(png_path):
    im = Image.open(png_path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im_rgba = im.convert('RGBA')
        bg = Image.new('RGB', im_rgba.size, (255, 255, 255))
        bg.paste(im_rgba, mask=im_rgba.split()[3])
        bg.save(jpg_scratch, 'JPEG', quality=100)
        bg.save(jpg_brain, 'JPEG', quality=100)
    else:
        im.convert('RGB').save(jpg_scratch, 'JPEG', quality=100)
        im.convert('RGB').save(jpg_brain, 'JPEG', quality=100)

    print("LOGO CONVERTIDA COM SUCESSO PARA JPEG COMPATÍVEL REPORTLAB!")
else:
    print("ERRO: PNG ORIGINAL NÃO ENCONTRADO")
