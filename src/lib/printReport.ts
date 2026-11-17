export function printReport(title: string, period: string, columns: string[], rows: string[][]) {
  const preview = window.open("", "_blank");
  if (!preview) throw new Error("Permite las ventanas emergentes para abrir el reporte.");
  preview.opener = null;
  const doc = preview.document;
  doc.title = title;
  doc.documentElement.lang = "es";
  const style = doc.createElement("style");
  style.textContent = "body{font:15px/1.5 system-ui,sans-serif;color:#173c32;margin:36px}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{text-align:left;padding:9px;border-bottom:1px solid #ccd9d0}thead{display:table-header-group}tr{break-inside:avoid}button{padding:10px 16px}@media print{button{display:none}body{margin:12px}}";
  doc.head.append(style);
  function render(parent: HTMLElement, tag: string, value: string) {
    const element = doc.createElement(tag);
    element.textContent = value;
    parent.append(element);
    return element;
  }
  render(doc.body, "p", "Sumabasto · Merprolima");
  render(doc.body, "h1", title);
  render(doc.body, "p", period);
  const print = render(doc.body, "button", "Imprimir o guardar como PDF");
  print.addEventListener("click", () => preview.print());
  if (!rows.length) {
    render(doc.body, "p", "No hay registros para este período.");
    return;
  }
  const table = doc.createElement("table");
  doc.body.append(table);
  const header = table.createTHead().insertRow();
  columns.forEach(column => render(header, "th", column));
  const tbody = table.createTBody();
  rows.forEach(row => {
    const tr = tbody.insertRow();
    row.forEach(value => render(tr, "td", value));
  });
}
