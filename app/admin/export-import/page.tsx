"use client"
import { useRef, useState } from "react";

export default function ExportImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string>("");

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportedData(reader.result as string);
    };
    reader.readAsText(file);
  }

  function handleExport() {
    const data = importedData || "Exemple de données à exporter";
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.txt";
    a.click();
    setExportStatus("Exportation réussie !");
    setTimeout(() => setExportStatus(""), 2000);
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Import / Export de données</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Importer des données</h2>
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.csv,.json,.pdf"
          onChange={handleImport}
          className="mb-2"
          aria-label="Importer un fichier de données (txt, csv, json, pdf)"
        />
        {importedData && (
          <div className="bg-gray-100 p-2 rounded mb-2">
            <strong>Données importées :</strong>
            <pre className="whitespace-pre-wrap text-sm">{importedData}</pre>
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Exporter des données</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleExport}
          aria-label="Exporter les données"
        >Exporter</button>
        {exportStatus && <div className="mt-2 text-green-700">{exportStatus}</div>}
      </section>
    </main>
  );
}
