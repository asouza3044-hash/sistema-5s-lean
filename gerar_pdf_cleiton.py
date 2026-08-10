# -*- coding: utf-8 -*-
"""
Gerador do PDF Oficial de Nomeação e Instrução de Trabalho do Cleiton
Empresa: IMPAK TTO Plásticos de Engenharia
Projeto: Implantação 5S & Qualidade (SENAI)
"""

import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf():
    scratch_dir = r"C:\Users\lasec\.gemini\antigravity\scratch\manual-5s-qualidade"
    brain_dir = r"C:\Users\lasec\.gemini\antigravity\brain\c8f26f84-9c35-4516-bb09-a221d2c2091e"

    logo_jpg_scratch = os.path.join(scratch_dir, "logo_impaktto_pdf.jpg")
    logo_jpg_brain = os.path.join(brain_dir, "logo_impaktto_pdf.jpg")

    pdf_filename = os.path.join(scratch_dir, "instrucao_trabalho_cleiton_5s.pdf")
    artifacts_pdf = os.path.join(brain_dir, "instrucao_trabalho_cleiton_5s.pdf")

    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#6366f1")
    dark_header_bg = colors.HexColor("#0f172a")
    text_dark = colors.HexColor("#1e293b")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=primary_color,
        alignment=1
    )

    heading2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark
    )

    highlight_style = ParagraphStyle(
        'HighlightCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#047857")
    )

    header_right_style = ParagraphStyle(
        'HRight',
        parent=styles['Normal'],
        alignment=2,
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.white
    )

    story = []

    # 1. CABEÇALHO COM A LOGO DA IMPAK TTO
    if os.path.exists(logo_jpg_scratch):
        img = Image(logo_jpg_scratch, width=2.4*inch, height=0.87*inch)
        
        header_text = Paragraph(
            "<b>IMPAK TTO PLÁSTICOS DE ENGENHARIA</b><br/>"
            "<font color='#06b6d4' size='8'>PROGRAMA MESTRE LEAN & QUALIDADE 5S</font><br/>"
            "<font color='#94a3b8' size='7.5'>PARCERIA ESTRATÉGICA SENAI</font>",
            header_right_style
        )

        header_table = Table([[img, header_text]], colWidths=[2.6*inch, 4.4*inch])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), dark_header_bg),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(header_table)

    story.append(Spacer(1, 8))

    # 2. TÍTULO DO DOCUMENTO
    story.append(Paragraph("TERMO DE NOMEAÇÃO & INSTRUÇÃO DE TRABALHO", title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("FUNÇÃO ESPECIAL: AUDITOR VOLANTE / CORINGA DE QUALIDADE 5S (GRUPO 2)", subtitle_style))
    story.append(Spacer(1, 8))

    # 3. TEXTO OFICIAL SOLICITADO PELO CONSULTOR XANDINHO
    exaltation_text = """
    <b>Prezado Cleiton,</b><br/><br/>
    É com imenso orgulho e confiança que a <b>IMPAK TTO Plásticos de Engenharia</b> e a Consultoria Mestre convidam você para a função estratégica de <b>AUDITOR VOLANTE / CORINGA 5S (GRUPO 2)</b>.<br/><br/>
    A sua atuação é a chave para o sucesso do nosso programa. Por não estar restrito a um único departamento de produção, você representa o olhar neutro, técnico e imparcial da qualidade. Sua função é fundamental para garantir a integridade dos dados, apoiar os líderes de setor e manter nossa fábrica em alto padrão de excelência visual para a conquista das nossas metas!
    """
    
    exalt_table = Table([[Paragraph(exaltation_text, body_style)]], colWidths=[7.0*inch])
    exalt_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0f9ff")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#bae6fd")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(exalt_table)
    story.append(Spacer(1, 8))

    # 4. CREDENCIAIS DE ACESSO AO PORTAL
    story.append(Paragraph("🔑 SUAS CREDENCIAIS DE ACESSO AO PORTAL DIGITAL", heading2_style))
    
    cred_data = [
        [Paragraph("<b>Usuário de Acesso:</b>", body_style), Paragraph("<font color='#0284c7'><b>cleiton.auditor</b></font> (ou apenas <i>cleiton</i>)", body_style)],
        [Paragraph("<b>Senha Padrão:</b>", body_style), Paragraph("<b>5s2026</b>", body_style)],
        [Paragraph("<b>Nível de Governança:</b>", body_style), Paragraph("<b>Grupo 2</b> (Auditor Volante / Encarregados de Fábrica)", body_style)],
        [Paragraph("<b>Permissões no Sistema:</b>", body_style), Paragraph("Visualização dos 7 Setores + Checklist + Suplência + Calibração", body_style)]
    ]
    
    cred_table = Table(cred_data, colWidths=[2.2*inch, 4.8*inch])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 8))

    # 5. AS 3 ATRIBUIÇÕES PRINCIPAIS DO CLEITON
    story.append(Paragraph("⚙️ SUAS 3 PRINCIPAIS TAREFAS DE CAMPO", heading2_style))

    tasks_data = [
        [
            Paragraph("<b>1. SUPLÊNCIA EM FALTAS</b>", highlight_style),
            Paragraph("Caso algum Líder do Grupo 1 faltar no dia, você realiza a ronda de 3 minutos no setor ausente no lugar dele, garantindo 100% de cobertura diária no painel.", body_style)
        ],
        [
            Paragraph("<b>2. CALIBRAÇÃO DE NOTAS</b>", highlight_style),
            Paragraph("Durante sua ronda de campo, se notar que um setor recebeu '🟢 Bom' mas apresenta desorganização física real, você ajusta para '🟡 Regular' ou '🔴 Ruim' com imparcialidade.", body_style)
        ],
        [
            Paragraph("<b>3. RONDA DE CAMPO RÁPIDA</b>", highlight_style),
            Paragraph("Fazer uma varredura visual de 10 a 15 minutos entre Terça e Quinta-Feira, atuando em parceria direta com o Encarregado da Fábrica (Diego) antes da revisão semanal.", body_style)
        ]
    ]

    tasks_table = Table(tasks_data, colWidths=[2.2*inch, 4.8*inch])
    tasks_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ffffff")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(tasks_table)
    story.append(Spacer(1, 14))

    # 6. ASSINATURAS OFICIAIS DE NOMEAÇÃO
    story.append(Paragraph("<b>ASSINATURAS OFICIAIS DE NOMEAÇÃO E COMPROMISSO COM A QUALIDADE</b>", ParagraphStyle('SignTitle', parent=styles['Normal'], alignment=1, fontSize=8.5, fontName='Helvetica-Bold', textColor=text_dark)))
    story.append(Spacer(1, 16))

    signatures_data = [
        [
            Paragraph("_____________________________<br/><b>Cleiton</b><br/><font size='7.5' color='#64748b'>Auditor Volante 5S (Grupo 2)</font>", ParagraphStyle('Sig1', parent=styles['Normal'], alignment=1)),
            Paragraph("_____________________________<br/><b>Diego</b><br/><font size='7.5' color='#64748b'>Encarregado de Fábrica (Grupo 2)</font>", ParagraphStyle('Sig2', parent=styles['Normal'], alignment=1))
        ],
        [
            Paragraph("<br/><br/>_____________________________<br/><b>Alexandre Souza</b><br/><font size='7.5' color='#64748b'>Consultor Mestre & Gerente de Projeto</font>", ParagraphStyle('Sig3', parent=styles['Normal'], alignment=1)),
            Paragraph("<br/><br/>_____________________________<br/><b>Kaio</b><br/><font size='7.5' color='#64748b'>Diretor (Impaktto Plásticos)</font>", ParagraphStyle('Sig4', parent=styles['Normal'], alignment=1))
        ]
    ]

    sig_table = Table(signatures_data, colWidths=[3.5*inch, 3.5*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(sig_table)

    # Build Document
    doc.build(story)
    
    with open(pdf_filename, 'rb') as f_src:
        pdf_bytes = f_src.read()
    with open(artifacts_pdf, 'wb') as f_dst:
        f_dst.write(pdf_bytes)

    print("PDF RECOMPILADO COM O TEXTO EXATO SOLICITADO PELO XANDINHO!")

if __name__ == "__main__":
    build_pdf()
