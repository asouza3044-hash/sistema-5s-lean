# -*- coding: utf-8 -*-
"""
Gerador do PDF Oficial de Nomeação e Instrução de Trabalho do Cleiton
Empresa: IMPAK TTO Plásticos de Engenharia
Projeto: Implantação 5S & Qualidade (SENAI)
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf():
    pdf_filename = r"C:\Users\lasec\.gemini\antigravity\scratch\manual-5s-qualidade\instrucao_trabalho_cleiton_5s.pdf"
    artifacts_pdf = r"C:\Users\lasec\.gemini\antigravity\brain\c8f26f84-9c35-4516-bb09-a221d2c2091e\instrucao_trabalho_cleiton_5s.pdf"

    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Estilos customizados elegantes
    primary_color = colors.HexColor("#6366f1")
    dark_bg = colors.HexColor("#0f172a")
    accent_cyan = colors.HexColor("#06b6d4")
    gold_color = colors.HexColor("#d97706")
    text_dark = colors.HexColor("#1e293b")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=primary_color,
        alignment=1 # Center
    )

    heading2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_dark
    )

    highlight_style = ParagraphStyle(
        'HighlightCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#047857")
    )

    story = []

    # 1. CABEÇALHO COM LOGOTIPO
    logo_path = r"C:\Users\lasec\.gemini\antigravity\scratch\manual-5s-qualidade\logo_impaktto.png"
    if os.path.exists(logo_path):
        img = Image(logo_path, width=2.2*inch, height=0.6*inch)
        header_table = Table([
            [img, Paragraph("<b>PROGRAMA LEAN & QUALIDADE 5S</b><br/><font color='#64748b' size='8'>PARCERIA SENAI & IMPAK TTO PLÁSTICOS DE ENGENHARIA</font>", ParagraphStyle('HRight', parent=styles['Normal'], alignment=2))]
        ], colWidths=[2.5*inch, 4.5*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(header_table)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=2, spaceAfter=10))

    # 2. TÍTULO DO DOCUMENTO
    story.append(Paragraph("TERMO DE NOMEAÇÃO & INSTRUÇÃO DE TRABALHO", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("FUNÇÃO ESPECIAL: AUDITOR VOLANTE / CORINGA DE QUALIDADE 5S (GRUPO 2)", subtitle_style))
    story.append(Spacer(1, 12))

    # 3. TEXTO DE EXALTAÇÃO DA FUNÇÃO DO CLEITON
    exaltation_text = """
    <b>Prezado Cleiton,</b><br/><br/>
    É com imenso orgulho e confiança que a Diretoria da <b>IMPAK TTO Plásticos de Engenharia</b> e a Consultoria Mestre de Qualidade e 5S nomeiam você para a função estratégica de <b>AUDITOR VOLANTE / CORINGA 5S (GRUPO 2)</b>.<br/><br/>
    A sua atuação é a chave para o sucesso do nosso programa. Por não estar restrito a um único departamento de produção, você representa o <b>olhar neutro, técnico e imparcial da qualidade</b>. Sua função é fundamental para garantir a integridade dos dados, apoiar os líderes de setor e manter nossa fábrica em alto padrão de excelência visual para a conquista das nossas metas!
    """
    
    exalt_table = Table([[Paragraph(exaltation_text, body_style)]], colWidths=[7.0*inch])
    exalt_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0f9ff")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#bae6fd")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(exalt_table)
    story.append(Spacer(1, 12))

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
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 12))

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
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(tasks_table)
    story.append(Spacer(1, 20))

    # 6. ASSINATURAS OFICIAIS DE NOMEAÇÃO
    story.append(Paragraph("<b>ASSINATURAS OFICIAIS DE NOMEAÇÃO E COMPROMISSO COM A QUALIDADE</b>", ParagraphStyle('SignTitle', parent=styles['Normal'], alignment=1, fontSize=9, fontName='Helvetica-Bold', textColor=text_dark)))
    story.append(Spacer(1, 25))

    signatures_data = [
        [
            Paragraph("_____________________________<br/><b>Cleiton</b><br/><font size='8' color='#64748b'>Auditor Volante 5S (Grupo 2)</font>", ParagraphStyle('Sig1', parent=styles['Normal'], alignment=1)),
            Paragraph("_____________________________<br/><b>Diego</b><br/><font size='8' color='#64748b'>Encarregado de Fábrica (Grupo 2)</font>", ParagraphStyle('Sig2', parent=styles['Normal'], alignment=1))
        ],
        [
            Paragraph("<br/><br/>_____________________________<br/><b>Alexandre Souza</b><br/><font size='8' color='#64748b'>Consultor Mestre & Gerente de Projeto</font>", ParagraphStyle('Sig3', parent=styles['Normal'], alignment=1)),
            Paragraph("<br/><br/>_____________________________<br/><b>Kaio</b><br/><font size='8' color='#64748b'>Diretor (Impaktto Plásticos)</font>", ParagraphStyle('Sig4', parent=styles['Normal'], alignment=1))
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
    
    # Copiar também para o diretório de artefatos
    with open(pdf_filename, 'rb') as f_src:
        pdf_bytes = f_src.read()
    with open(artifacts_pdf, 'wb') as f_dst:
        f_dst.write(pdf_bytes)

    print("PDF GERADO COM SUCESSO EM AMBOS OS DIRETÓRIOS!")

if __name__ == "__main__":
    build_pdf()
