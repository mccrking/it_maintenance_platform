
import jsPDF from "jspdf"


export async function exportTicketsToPDF(tickets: any[], title = "Tickets Report", role?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  // Charge le logo avant de générer le PDF
  let logoLoaded = false
  if (typeof window !== 'undefined') {
    await new Promise<void>((resolve) => {
      const img = new window.Image()
      img.src = window.location.origin + '/logo-it-maintenance.png'
      img.onload = function() {
        doc.addImage(img, 'PNG', margin, 10, 20, 20)
        logoLoaded = true
        resolve()
      }
      img.onerror = function() {
        resolve()
      }
    })
  }
  // Référence unique et date
  const ref = 'REF-' + Math.floor(Math.random() * 1000000)
  const exportDate = new Date().toLocaleDateString()
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Référence : ${ref}`, margin, 36)
  doc.text(`Date d'export : ${exportDate}`, pageWidth - margin, 36, { align: "right" })
  // Title
  doc.setFontSize(22)
  doc.setTextColor(40, 60, 120)
  doc.text(title, pageWidth / 2, 25, { align: "center" })
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  // Table header and rows per role (unique PDF for each role)
  let headers: string[];
  let rows: any[][];
  switch (role) {
    case "admin":
    case "technician":
      headers = ["Email", "Title", "Description", "Status", "Category", "Created At"];
      rows = tickets.map(t => [
        t.creator?.email,
        t.title,
        t.description,
        t.status,
        t.category,
        t.created_at ? formatDateTime(t.created_at) : ""
      ]);
      break;
    case "client":
      headers = ["Title", "Description", "Status", "Category", "Created At"];
      rows = tickets.map(t => [
        t.title,
        t.description,
        t.status,
        t.category,
        t.created_at ? formatDateTime(t.created_at) : ""
      ]);
      break;
    default:
      headers = ["Email", "Title", "Description", "Status", "Category", "Created At"];
      rows = tickets.map(t => [
        t.creator?.email,
        t.title,
        t.description,
        t.status,
        t.category,
        t.created_at ? formatDateTime(t.created_at) : ""
      ]);
  }

  // Helper to format date as YYYY-MM-DD HH:mm
  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  // Calcul dynamique des largeurs de colonnes
  const availableWidth = pageWidth - 2 * margin;
  // Mesurer le texte le plus long pour chaque colonne (titre + contenu)
  let maxColTextWidths = headers.map((h, i) => {
    let maxLen = doc.getTextWidth(h);
    rows.forEach(row => {
      const cellText = String(row[i] || "");
      cellText.split("\n").forEach(line => {
        maxLen = Math.max(maxLen, doc.getTextWidth(line));
      });
    });
    return maxLen + 4; // +4mm de marge interne
  });
  // Calculer le ratio pour que tout tienne dans la page
  const totalTextWidth = maxColTextWidths.reduce((a, b) => a + b, 0);
  let colWidths = maxColTextWidths;
  if (totalTextWidth > availableWidth) {
    // Réduire proportionnellement si trop large, mais Email a min 45mm
    colWidths = maxColTextWidths.map((w, i) => i === 0 ? Math.max(45, w * availableWidth / totalTextWidth) : Math.max(18, w * availableWidth / totalTextWidth));
  } else {
    // Même si tout tient, Email a min 45mm
    colWidths = maxColTextWidths.map((w, i) => i === 0 ? Math.max(45, w) : w);
  }
  let y = 40;
  // Draw header background
  doc.setFillColor(230, 230, 250);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");
  doc.setFont(undefined, "bold");
  let x = margin;
  headers.forEach((h, i) => {
    doc.setFontSize(8);
    doc.text(h, x + 2, y + 7, { align: "left" });
    // Ligne verticale après chaque titre sauf le dernier
    if (i < headers.length - 1) {
      doc.setDrawColor(0, 0, 0); // noir
      doc.line(x + colWidths[i], y, x + colWidths[i], y + 10);
    }
    x += colWidths[i];
  });
  doc.setFont(undefined, "normal");
  y += 12;
  // Helper: wrap text in cell
  function wrapText(text: string, maxWidth: number, doc: jsPDF) {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';
    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = doc.getTextWidth(testLine);
      if (testWidth > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }
  // Table rows
  rows.forEach((row, idx) => {
    let x = margin;
    // Calculer le nombre de lignes max pour wrap
    let cellLinesArr: string[][] = row.map((cell, i) => wrapText(String(cell || ""), colWidths[i], doc));
    let maxLines = Math.max(...cellLinesArr.map(lines => lines.length));
    let rowHeight = 6 * maxLines + 6;
    doc.setFontSize(8); // Police du contenu à 8
    // Afficher chaque cellule, alignée verticalement au top de la ligne
    x = margin;
    row.forEach((cell, i) => {
      let lines = cellLinesArr[i];
      lines.forEach((line, lidx) => {
        doc.text(line, x + 2, y + 6 + lidx * 6, { align: "left" });
      });
      // Ligne verticale entre chaque cellule sauf la dernière
      if (i < row.length - 1) {
        doc.setDrawColor(0, 0, 0);
        doc.line(x + colWidths[i], y, x + colWidths[i], y + rowHeight);
      }
      x += colWidths[i];
    });
    doc.setFontSize(12); // Remettre la police pour le reste
    // Draw row border
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
    // Add new page if needed
    if (y > 270) {
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, 290, { align: "right" });
      doc.addPage();
      y = 40;
      // Redraw header on new page
      doc.setFillColor(230, 230, 250);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");
      doc.setFont(undefined, "bold");
      let xh = margin;
      headers.forEach((h, i) => {
        doc.setFontSize(8);
        doc.text(h, xh + 2, y + 7, { align: "left" });
        // Ligne verticale après chaque titre sauf le dernier
        if (i < headers.length - 1) {
          doc.setDrawColor(0, 0, 0);
          doc.line(xh + colWidths[i], y, xh + colWidths[i], y + 10);
        }
        xh += colWidths[i];
      });
      doc.setFont(undefined, "normal");
      y += 12;
    }
  });
  // Footer on last page
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, 290, { align: "right" })
  // Date
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Exporté le : ${new Date().toLocaleDateString()}`, margin, 290)
  doc.save("tickets-report.pdf")
}

// Import tickets from PDF file (basic text extraction)
export async function importTicketsFromPDF(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer()
  // @ts-ignore
  const pdfjsLib = await import("pdfjs-dist/build/pdf");
  const pdf = await pdfjsLib.default.getDocument({ data: arrayBuffer }).promise
  let text = ""
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(" ") + "\n"
  }
  // Try to parse tickets from extracted text (expecting same format as export)
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean)
  const tickets: any[] = []
  let headers: string[] = []
  for (const line of lines) {
    if (!headers.length && line.includes("ID") && line.includes("Title")) {
      headers = line.split("|").map(h => h.trim())
      continue
    }
    if (headers.length) {
      const values = line.split("|").map(v => v.trim())
      if (values.length === headers.length) {
        const ticket: any = {}
        headers.forEach((h, i) => { ticket[h.toLowerCase().replace(/ /g, "_")] = values[i] })
        tickets.push(ticket)
      }
    }
  }
  return tickets
}
