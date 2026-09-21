/**
 * Universal XLSX and CSV parser helper.
 * Uses window.XLSX if loaded from CDN, bundled xlsx if available,
 * and falls back to a clean native CSV parser so Excel/CSV ingestion never crashes or breaks the bundler.
 */

// Simple native CSV parser fallback
function parseCSVNative(text: string): Record<string, any>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const results: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const cleanKey = h.trim();
      const val = values[idx] !== undefined ? values[idx].trim() : '';
      // Infer number if cleanly numeric
      if (val !== '' && !isNaN(Number(val)) && !val.includes('-') && !val.includes('/')) {
        row[cleanKey] = Number(val);
      } else {
        row[cleanKey] = val === '' ? null : val;
      }
    });
    results.push(row);
  }
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Get global or dynamic XLSX instance
export async function getXLSX(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    return (window as any).XLSX;
  }
  try {
    const mod = await import('xlsx');
    return (mod as any).default || mod;
  } catch (err) {
    console.warn('Bundled XLSX unavailable, using window fallback if present:', err);
    if (typeof window !== 'undefined' && (window as any).XLSX) {
      return (window as any).XLSX;
    }
    return null;
  }
}

/**
 * Parses any File (.xlsx, .xls, .csv) reliably without bundler failures
 */
export async function parseExcelOrCsvFile(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase();

  // Try XLSX parser first for .xlsx, .xls, or .csv
  try {
    const xlsx = await getXLSX();
    if (xlsx) {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { cellDates: false, raw: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        return jsonData;
      }
    }
  } catch (err) {
    console.warn('XLSX parsing failed or was bypassed, trying text/csv fallback', err);
  }

  // If CSV or fallback needed, read as text
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    const text = await file.text();
    const rows = parseCSVNative(text);
    if (rows.length > 0) return rows;
  }

  // If we couldn't parse with XLSX and not CSV, read text anyway as attempt
  try {
    const text = await file.text();
    const rows = parseCSVNative(text);
    if (rows.length > 0) return rows;
  } catch (e) {
    // ignore
  }

  throw new Error(`Unable to parse ${file.name}. Please ensure it is a valid .xlsx, .xls, or .csv file.`);
}

/**
 * Downloads a worksheet or CSV directly
 */
export async function exportToCsvDirect(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;

  try {
    const xlsx = await getXLSX();
    if (xlsx) {
      const ws = xlsx.utils.json_to_sheet(data);
      const csv = xlsx.utils.sheet_to_csv(ws);
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
      return;
    }
  } catch (e) {
    console.warn('XLSX export failed, using manual CSV generator:', e);
  }

  // Native CSV fallback generator
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        })
        .join(',')
    ),
  ];
  downloadBlob(new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' }), filename);
}

/**
 * Downloads sample Excel workbook with graceful CSV fallback if XLSX write isn't available
 */
export async function downloadWorkbookOrCsv(rows: Record<string, any>[], filename: string, sheetName = 'Sheet1') {
  try {
    const xlsx = await getXLSX();
    if (xlsx && typeof xlsx.writeFile === 'function') {
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
      xlsx.writeFile(wb, filename);
      return;
    }
  } catch (e) {
    console.warn('Excel write failed, falling back to CSV download:', e);
  }

  // Fallback to CSV
  const csvFilename = filename.replace(/\.xlsx$/i, '.csv');
  await exportToCsvDirect(rows, csvFilename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
