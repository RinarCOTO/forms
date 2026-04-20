/**
 * Physical Depreciation Schedule for Buildings
 * Source: RA 7160 / Provincial Assessment Office schedule
 *
 * Columns (index 0–7):
 *   0 → Type V-A
 *   1 → Type V-B
 *   2 → Type IV-A
 *   3 → Type IV-B
 *   4 → Type IV-C
 *   5 → Type III-A, III-B, III-C
 *   6 → Type II-A, Type II-B
 *   7 → Type I
 *
 * null = max depreciation reached for that type at that year
 * Row index 0 = Year 1
 */
const TABLE: (number | null)[][] = [
  /* yr 1  */ [2.75,  2.75,  3.00,  3.50,  4.00,  4.50,  5.00,  6.00],
  /* yr 2  */ [5.50,  5.50,  6.00,  7.00,  8.00,  9.00,  10.00, 12.00],
  /* yr 3  */ [8.25,  8.25,  9.00,  10.50, 12.00, 13.50, 15.00, 18.00],
  /* yr 4  */ [11.00, 11.00, 12.00, 14.00, 16.00, 18.00, 20.00, 24.00],
  /* yr 5  */ [13.75, 13.75, 15.00, 17.50, 20.00, 22.50, 25.00, 30.00],
  /* yr 6  */ [16.50, 16.50, 18.00, 21.00, 23.50, 26.50, 29.50, 35.00],
  /* yr 7  */ [19.25, 19.25, 21.00, 24.50, 27.00, 30.50, 34.00, 40.00],
  /* yr 8  */ [22.00, 22.00, 24.00, 28.00, 30.50, 34.50, 38.50, 45.00],
  /* yr 9  */ [24.75, 24.75, 27.00, 31.50, 34.00, 38.50, 43.00, 50.00],
  /* yr 10 */ [27.50, 27.50, 30.00, 35.00, 37.50, 42.50, 47.50, 55.00],
  /* yr 11 */ [30.00, 30.00, 33.00, 38.50, 41.00, 46.00, 51.50, 59.00],
  /* yr 12 */ [32.50, 32.50, 36.00, 42.00, 44.50, 49.50, 55.50, 63.00],
  /* yr 13 */ [35.00, 35.00, 39.00, 45.50, 48.00, 53.00, 59.50, 67.00],
  /* yr 14 */ [37.50, 37.50, 42.00, 49.00, 51.50, 56.50, 63.50, 71.00],
  /* yr 15 */ [40.00, 40.00, 45.00, 52.50, 55.00, 60.00, 67.50, 75.00],
  /* yr 16 */ [42.00, 42.00, 47.50, 55.50, 58.00, 63.00, 71.00, 78.50],
  /* yr 17 */ [44.00, 44.00, 50.00, 58.50, 61.00, 66.00, 74.50, 82.00],
  /* yr 18 */ [46.00, 46.00, 52.50, 61.50, 64.00, 69.00, 78.00, 85.50],
  /* yr 19 */ [48.00, 48.00, 55.00, 64.50, 67.00, 72.00, 81.50, null],
  /* yr 20 */ [50.00, 50.00, 57.50, 67.50, 70.00, 75.00, 85.00, null],
  /* yr 21 */ [51.00, 51.50, 59.00, 69.00, 71.50, 77.00, null,  null],
  /* yr 22 */ [52.00, 53.00, 60.50, 70.50, 73.00, 79.00, null,  null],
  /* yr 23 */ [53.00, 54.50, 62.00, 72.00, 74.50, 81.00, null,  null],
  /* yr 24 */ [54.00, 56.00, 63.50, 73.50, 76.00, 83.00, null,  null],
  /* yr 25 */ [55.00, 57.50, 65.00, 75.00, 77.50, 85.00, null,  null],
  /* yr 26 */ [56.00, 59.00, 66.50, 76.50, 79.00, null,  null,  null],
  /* yr 27 */ [57.00, 60.50, 68.00, 78.00, 80.50, null,  null,  null],
  /* yr 28 */ [58.00, 62.00, 69.50, 79.50, null,  null,  null,  null],
  /* yr 29 */ [59.00, 63.50, 71.00, null,  null,  null,  null,  null],
  /* yr 30 */ [60.00, 65.00, 72.50, null,  null,  null,  null,  null],
  /* yr 31 */ [61.00, 66.50, 74.00, null,  null,  null,  null,  null],
  /* yr 32 */ [62.00, 68.00, 75.50, null,  null,  null,  null,  null],
  /* yr 33 */ [63.00, 69.50, 77.00, null,  null,  null,  null,  null],
  /* yr 34 */ [64.00, 71.00, 78.50, null,  null,  null,  null,  null],
  /* yr 35 */ [65.00, 72.50, 80.00, null,  null,  null,  null,  null],
  /* yr 36 */ [66.00, 74.00, null,  null,  null,  null,  null,  null],
  /* yr 37 */ [67.00, 75.50, null,  null,  null,  null,  null,  null],
  /* yr 38 */ [68.00, 77.00, null,  null,  null,  null,  null,  null],
  /* yr 39 */ [69.00, 78.50, null,  null,  null,  null,  null,  null],
  /* yr 40 */ [70.00, 80.00, null,  null,  null,  null,  null,  null],
  /* yr 41 */ [71.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 42 */ [72.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 43 */ [73.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 44 */ [74.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 45 */ [75.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 46 */ [76.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 47 */ [77.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 48 */ [78.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 49 */ [79.00, null,  null,  null,  null,  null,  null,  null],
  /* yr 50 */ [80.00, null,  null,  null,  null,  null,  null,  null],
];

/** Maps structural type strings (as stored in DB) to column index */
const TYPE_TO_COL: Record<string, number> = {
  "Type V":    0,
  "Type V-A":  0,
  "Type V-B":  1,
  "Type IV-A": 2,
  "Type IV-B": 3,
  "Type IV-C": 4,
  "Type III-A": 5,
  "Type III-B": 5,
  "Type III-C": 5,
  "Type II-A":  6,
  "Type II-B":  6,
  "Type I":     7,
};

/**
 * Look up the depreciation rate for a building.
 *
 * @param years      - Building age in years (integer ≥ 1)
 * @param structuralType - Structural type string from the form
 * @returns Depreciation percentage (e.g. 27.50 means 27.50%), or null if
 *          the type is unknown or the year is out of the table range.
 */
export function getBuildingDepreciationRate(
  years: number,
  structuralType: string
): number | null {
  const col = TYPE_TO_COL[structuralType];
  if (col === undefined) return null;

  const rowIndex = Math.round(years) - 1; // 0-based

  if (rowIndex < 0) return 0;

  // If year exceeds table, return the last defined value for this column
  if (rowIndex >= TABLE.length) {
    for (let i = TABLE.length - 1; i >= 0; i--) {
      const val = TABLE[i][col];
      if (val !== null) return val;
    }
    return null;
  }

  const val = TABLE[rowIndex][col];

  // null in table = max reached; walk back to find last defined value
  if (val === null) {
    for (let i = rowIndex - 1; i >= 0; i--) {
      const prev = TABLE[i][col];
      if (prev !== null) return prev;
    }
    return null;
  }

  return val;
}
