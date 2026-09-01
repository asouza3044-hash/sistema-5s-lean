# -*- coding: utf-8 -*-
"""
Gerador do PDF Oficial de Nomeação e Instrução de Trabalho do Clayton
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
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_jpg = os.path.join(base_dir, "logo_impaktto_pdf.jpg")
    pdf_filename = os.path.join(base_dir, "instrucao_trabalho_clayton_5s.pdf")

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

    header_meta_style = ParagraphStyle(
        'HeaderMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#64748b")
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_dark
    )

    body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=text_dark
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceBefore=2,
        spaceAfter=2
    )

    story = []

    # Cabeçalho da Empresa
    header_data = []
    if os.path.exists(logo_jpg):
        logo_img = Image(logo_jpg, width=1.5*inch, height=0.45*inch)
        header_data = [[
            logo_img,
            Paragraph("<b>IMPAK TTO PLÁSTICOS DE ENGENHARIA</b><br/>Programa de Implantação 5S & Ferramentas da Qualidade", header_meta_style),
            Paragraph("<b>DOC:</b> IT-5S-CLAYTON<br/><b>REV:</b> 01 | 2026<br/><b>CONFIDENCIAL</b>", header_meta_style)
        ]]
    else:
        header_data = [[
            Paragraph("<b>IMPAK TTO</b>", title_style),
            Paragraph("<b>Programa de Implantação 5S & Qualidade</b>", header_meta_style),
            Paragraph("<b>DOC:</b> IT-5S-CLAYTON<br/><b>REV:</b> 01 | 2026", header_meta_style)
        ]]

    t_header = Table(header_data, colWidths=[1.8*inch, 3.8*inch, 1.8*inch])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, primary_color),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 10))

    # Título Principal
    story.append(Paragraph("INSTRUÇÃO DE TRABALHO & TERMO DE NOMEAÇÃO", title_style))
    story.append(Paragraph("PAPEL E RESPONSABILIDADES: AUDITOR VOLANTE 5S & SUPLÊNCIA TÉCNICA", subtitle_style))
    story.append(Spacer(1, 10))

    # Tabela de Identificação do Colaborador
    info_colab = [
        [
            Paragraph("<b>Colaborador Designado:</b> Clayton", body_bold),
            Paragraph("<b>Cargo Oficial no 5S:</b> Auditor Volante (Grupo 2)", body_bold)
        ],
        [
            Paragraph("<b>Setor de Origem:</b> Portas / Cortinas", body_style),
            Paragraph("<b>Nível de Governança:</b> Nível 2 (Supervisão & Auditoria)", body_style)
        ],
        [
            Paragraph("<b>Usuário no Sistema:</b> clayton.auditor", body_style),
            Paragraph("<b>Status:</b> Ativo e Homologado no Sistema", body_style)
        ]
    ]
    t_colab = Table(info_colab, colWidths=[3.7*inch, 3.7*inch])
    t_colab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_colab)
    story.append(Spacer(1, 10))

    # 1. OBJETIVO DA FUNÇÃO
    story.append(Paragraph("1. Objetivo e Escopo da Função", section_heading))
    story.append(Paragraph(
        "Garantir a integridade, calibração e continuidade das rotinas de 5S na IMPAK TTO Plásticos de Engenharia. "
        "O Auditor Volante atua com visão sistêmica transversal entre os 5 departamentos da fábrica (Usinagem, Holter, "
        "Armários, Portas/Cortinas e Acabamento), assegurando que os critérios de avaliação sejam justos, imparciais e padronizados.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # 2. RESPONSABILIDADES DIÁRIAS E SEMANAIS
    story.append(Paragraph("2. Principais Responsabilidades e Rotinas de Trabalho", section_heading))
    story.append(Paragraph("<b>a) Votação Diária no Rodízio Cruzado:</b> Realizar diariamente a avaliação de 3 Sensos no setor determinado pelo rodízio matinal (tempo estimado: 3 a 5 minutos).", bullet_style))
    story.append(Paragraph("<b>b) Suplência e Cobertura de Ausências:</b> Caso algum Líder de Setor (Nível 1) esteja ausente ou de férias, o Auditor Volante assume a auditoria daquele setor para que o quadro nunca fique com lacunas.", bullet_style))
    story.append(Paragraph("<b>c) Calibração e Moderação Técnica:</b> Apoiar os líderes na calibração de conceitos (Bom, Regular, Ruim) para evitar notas excessivamente rigorosas ou benevolentes.", bullet_style))
    story.append(Paragraph("<b>d) Auditoria Oficial Mensal (Checklist de 50 Itens):</b> Realizar, em conjunto com os Encarregados (Diego e Filipe) e a Gerência, a inspeção mensal oficial que valida a meta de &ge;90% para a Premiação 5S.", bullet_style))
    story.append(Paragraph("<b>e) Participação no Comitê 5S:</b> Apresentar pontos críticos observados durante a semana para inclusão no Kanban 5W2H ou Matriz GUT.", bullet_style))
    story.append(Spacer(1, 8))

    # 3. MATRIZ DE DELEGAÇÃO E ACESSOS
    story.append(Paragraph("3. Permissões de Acesso no Sistema Web & Mobile", section_heading))
    story.append(Paragraph(
        "Como integrante do <b>Grupo 2 (Nível 2)</b>, o colaborador Clayton possui permissão para:<br/>"
        "&bull; Registrar votos diários em qualquer departamento que necessite de suplência;<br/>"
        "&bull; Acessar e responder ao Checklist Oficial de Auditoria Mensal (50 perguntas);<br/>"
        "&bull; Cadastrar e atualizar Planos de Ação no Kanban 5W2H e Matriz GUT;<br/>"
        "&bull; Moderar/remover lançamentos incorretos no Quadro da Fábrica quando identificado desvio técnico.",
        body_style
    ))
    story.append(Spacer(1, 14))

    # Assinaturas
    story.append(Paragraph("Termo de Ciência e Compromisso", section_heading))
    story.append(Paragraph(
        "Declaro estar ciente das responsabilidades e diretrizes atribuídas à função de Auditor Volante 5S da IMPAK TTO.",
        body_style
    ))
    story.append(Spacer(1, 20))

    sig_data = [
        [
            Paragraph("__________________________________________<br/><b>Clayton</b><br/>Auditor Volante 5S (Grupo 2)", ParagraphStyle('sig1', parent=body_style, alignment=1)),
            Paragraph("__________________________________________<br/><b>Alexandre Souza / Kaio</b><br/>Gerência de Projeto & Diretoria (Grupo 3)", ParagraphStyle('sig2', parent=body_style, alignment=1))
        ]
    ]
    t_sig = Table(sig_data, colWidths=[3.7*inch, 3.7*inch])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_sig)

    doc.build(story)
    print(f"✓ PDF gerado com sucesso em: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
