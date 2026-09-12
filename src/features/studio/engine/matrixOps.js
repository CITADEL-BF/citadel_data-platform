/**
 * matrixOps — operations sur la matrice brute de donnees (rows: string[][]),
 * utilisees par l'etape "Verifier" (transposer, ajouter une colonne, editer
 * une cellule, renommer une colonne).
 */

/** Transpose lignes/colonnes ; complete les lignes courtes avec des cellules vides. */
export function transposeRows(rows) {
  if (!rows.length) return []
  const width = rows.reduce((max, r) => Math.max(max, r.length), 0)
  const transposed = []
  for (let col = 0; col < width; col += 1) {
    const newRow = new Array(rows.length)
    for (let row = 0; row < rows.length; row += 1) {
      newRow[row] = rows[row][col] ?? ''
    }
    transposed.push(newRow)
  }
  return transposed
}

/** Ajoute une colonne vide a la fin de chaque ligne (nommee dans l'en-tete si presente). */
export function appendColumn(rows, hasHeaderRow, headerName) {
  return rows.map((row, idx) => {
    const next = row.slice()
    next.push(idx === 0 && hasHeaderRow ? headerName : '')
    return next
  })
}

/** Remplace la valeur d'une cellule (indices absolus dans la matrice). */
export function setCell(rows, rowIndex, colIndex, value) {
  if (rowIndex < 0 || rowIndex >= rows.length) return rows
  const next = rows.slice()
  const row = (next[rowIndex] || []).slice()
  row[colIndex] = value
  next[rowIndex] = row
  return next
}

/** Renomme une colonne : ecrit dans la ligne d'en-tete si elle existe. */
export function renameHeaderCell(rows, colIndex, name) {
  if (!rows.length) return rows
  return setCell(rows, 0, colIndex, name)
}
