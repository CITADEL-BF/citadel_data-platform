/**
 * parseCsv — enveloppe autour de PapaParse.
 *
 * On parse toujours sans en-tête (`header: false`) et on garde une matrice de
 * chaines brute. La ligne d'en-tete est geree en aval par la config (bascule
 * "1re ligne = en-tetes"), ce qui evite de re-parser le fichier a chaque
 * changement d'option.
 *
 * PapaParse tourne dans son propre worker (`worker: true`) : le fichier peut
 * etre volumineux sans bloquer le thread principal.
 */

import Papa from 'papaparse'

export const MAX_PREVIEW_ROWS = 500

/**
 * @param {File|string} input  Fichier CSV ou texte colle.
 * @returns {Promise<{ rows: string[][], delimiter: string, truncated: boolean,
 *                      totalRows: number, errors: Array }>}
 */
export function parseCsv(input) {
  return new Promise((resolve, reject) => {
    const rows = []
    let delimiter = ','
    let aborted = false

    Papa.parse(input, {
      header: false,
      skipEmptyLines: 'greedy',
      worker: true,
      dynamicTyping: false,
      chunk: (results) => {
        if (results.meta?.delimiter) delimiter = results.meta.delimiter
        for (const row of results.data) {
          rows.push(row.map((cell) => (cell == null ? '' : String(cell))))
        }
      },
      complete: (results) => {
        if (aborted) return
        if (results?.meta?.delimiter) delimiter = results.meta.delimiter
        // Certains navigateurs ne declenchent pas `chunk` : fallback sur data.
        if (rows.length === 0 && Array.isArray(results?.data)) {
          for (const row of results.data) {
            rows.push(row.map((cell) => (cell == null ? '' : String(cell))))
          }
        }
        const totalRows = rows.length
        resolve({
          rows,
          delimiter,
          totalRows,
          truncated: false,
          errors: results?.errors ?? [],
        })
      },
      error: (err) => {
        aborted = true
        reject(err instanceof Error ? err : new Error(String(err?.message || err)))
      },
    })
  })
}

/**
 * Reconstruit un tableau d'objets ligne a partir de la matrice brute et de la
 * definition de colonnes (cle -> nom). N'est utilise que pour l'apercu et le
 * futur moteur de vues.
 */
export function toRecords(rows, columns, hasHeaderRow) {
  const body = hasHeaderRow ? rows.slice(1) : rows
  return body.map((row) => {
    const record = {}
    columns.forEach((col, idx) => {
      record[col.key] = row[idx] ?? ''
    })
    return record
  })
}
