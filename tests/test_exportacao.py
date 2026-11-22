from utils.exportacao import exportar_relatorio_completo, exportar_relatorio_pdf


def test_relatorio_pdf_consolidado_e_gerado(tmp_path):
    destino = exportar_relatorio_pdf([], [], [], [], [], [], tmp_path / "relatorio.pdf")
    assert destino.read_bytes().startswith(b"%PDF")


def test_relatorio_excel_completo_e_gerado(tmp_path):
    destino = exportar_relatorio_completo([], [], [], [], [], [], tmp_path / "relatorio.xlsx")
    assert destino.stat().st_size > 0
