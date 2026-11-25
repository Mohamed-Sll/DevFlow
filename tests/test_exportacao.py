from datetime import date, datetime

from openpyxl import load_workbook
from pypdf import PdfReader

from database.models import Cliente, Gasto, Projeto, Receita, TempoProjeto
from utils.exportacao import exportar_relatorio_completo, exportar_relatorio_pdf


def _dados_relatorio():
    cliente = Cliente(id=1, nome="Acme Studio")
    projeto = Projeto(
        id=1,
        cliente_id=cliente.id,
        titulo="Portfolio website",
        valor_total=1000,
        valor_pago=400,
        status="em_andamento",
        cliente=cliente,
    )
    gasto = Gasto(
        id=1,
        descricao="Hosting subscription",
        valor=25,
        data=date(2026, 6, 1),
        categoria_nome="Infrastructure",
        metodo="card",
    )
    receita = Receita(
        id=1,
        projeto_id=projeto.id,
        descricao="Project deposit",
        valor=400,
        data=date(2026, 6, 2),
        origem="Acme Studio",
        projeto=projeto,
    )
    sessao = TempoProjeto(
        id=1,
        projeto_id=projeto.id,
        inicio=datetime(2026, 6, 3, 10, 0),
        duracao_min=90,
        descricao="Implementation",
        projeto=projeto,
    )
    return [projeto], [gasto], [receita], [sessao]


def test_relatorio_pdf_consolidado_contem_dados_e_secoes(tmp_path):
    projetos, gastos, receitas, sessoes = _dados_relatorio()
    destino = exportar_relatorio_pdf(
        projetos, gastos, receitas, [], [], sessoes, tmp_path / "relatorio.pdf"
    )

    reader = PdfReader(destino)
    report_text = " ".join(page.extract_text() or "" for page in reader.pages)
    assert "Resumo Financeiro" in report_text
    assert "Portfolio website" in report_text
    assert "Hosting subscription" in report_text
    assert "Project deposit" in report_text
    assert "Sessões de trabalho" in report_text
    assert "Implementation" in report_text
    assert "90" in report_text


def test_relatorio_excel_completo_e_gerado(tmp_path):
    projetos, gastos, receitas, sessoes = _dados_relatorio()
    destino = exportar_relatorio_completo(
        projetos, gastos, receitas, [], [], sessoes, tmp_path / "relatorio.xlsx"
    )

    workbook = load_workbook(destino, read_only=True, data_only=True)
    assert {"Lucro e Prejuízo", "Projetos", "Gastos", "Receitas", "Sessões"}.issubset(
        workbook.sheetnames
    )
    assert workbook["Projetos"]["B2"].value == "Portfolio website"
    assert workbook["Gastos"]["B2"].value == "Hosting subscription"
    assert workbook["Receitas"]["B2"].value == "Project deposit"
    workbook.close()
