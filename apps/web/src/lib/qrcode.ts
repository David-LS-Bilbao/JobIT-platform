/**
 * Generador de QR mínimo y AUTOCONTENIDO (sin dependencias ni servicios externos).
 *
 * - Modo byte (UTF-8), nivel de corrección de errores M.
 * - Versiones 1–10 (suficiente para URLs; hasta ~216 bytes).
 * - Devuelve la matriz de módulos (`boolean[][]`, true = módulo oscuro) SIN zona
 *   de silencio; el render (SVG) añade el margen.
 *
 * Referencia: ISO/IEC 18004. La aritmética GF(256)/Reed–Solomon/BCH está cubierta
 * por tests unitarios (ver `qrcode.test.ts`).
 */

const ECC_LEVEL_BITS = 0b00; // Nivel M en la información de formato.

// --- GF(256) con polinomio primitivo 0x11d -----------------------------------
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255] as number;
})();

export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] as number) + (GF_LOG[b] as number)] as number;
}

// Polinomio generador Reed–Solomon de grado `degree` (mónico, grado descendente).
function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let d = 0; d < degree; d += 1) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let i = 0; i < poly.length; i += 1) {
      next[i] = (next[i] as number) ^ (poly[i] as number);
      next[i + 1] = (next[i + 1] as number) ^ gfMul(poly[i] as number, GF_EXP[d] as number);
    }
    poly = next;
  }
  return poly;
}

// Códigos de corrección (resto de la división) para un bloque de datos.
export function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res = new Array<number>(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ (res[0] as number);
    res.shift();
    res.push(0);
    if (factor !== 0) {
      for (let i = 0; i < ecLen; i += 1) {
        res[i] = (res[i] as number) ^ gfMul(gen[i + 1] as number, factor);
      }
    }
  }
  return res;
}

// --- BCH para información de formato/versión ---------------------------------
function bch(data: number, poly: number, deg: number): number {
  let d = data << deg;
  const polyBits = 32 - Math.clz32(poly);
  while (32 - Math.clz32(d) >= polyBits) {
    d ^= poly << (32 - Math.clz32(d) - polyBits);
  }
  return d;
}

/** Información de formato (15 bits) para nivel M y una máscara dada. */
export function formatInfoBits(mask: number): number {
  const data = (ECC_LEVEL_BITS << 3) | mask; // 5 bits
  const rest = bch(data, 0b10100110111, 10); // BCH(15,5)
  return ((data << 10) | rest) ^ 0b101010000010010;
}

// Información de versión (18 bits), solo v7+.
function versionInfoBits(version: number): number {
  const rest = bch(version, 0b1111100100101, 12); // BCH(18,6)
  return (version << 12) | rest;
}

// --- Tablas por versión (nivel M) --------------------------------------------
// [ecCodewordsPerBlock, [[numBlocks, dataCodewordsPerBlock], ...]]
const EC_BLOCKS_M: Record<number, [number, [number, number][]]> = {
  1: [10, [[1, 16]]],
  2: [16, [[1, 28]]],
  3: [26, [[1, 44]]],
  4: [18, [[2, 32]]],
  5: [24, [[2, 43]]],
  6: [16, [[4, 27]]],
  7: [18, [[4, 31]]],
  8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]],
  10: [26, [[4, 43], [1, 44]]]
};

const ALIGN_POS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50]
};

// Cap en versión 6 (nivel M ≈ 106 bytes): cubre de sobra base + "/u/" + slug (≤60).
// Las versiones 7+ (que añaden información de versión) quedan fuera del MVP.
const MAX_VERSION = 6;

function totalDataCodewords(version: number): number {
  const [, groups] = EC_BLOCKS_M[version] as [number, [number, number][]];
  return groups.reduce((sum, [count, cw]) => sum + count * cw, 0);
}

function charCountBits(version: number): number {
  return version <= 9 ? 8 : 16;
}

// --- Codificación de datos (modo byte) ---------------------------------------
class BitBuffer {
  bits: number[] = [];
  put(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) this.bits.push((value >>> i) & 1);
  }
}

function encodeData(bytes: number[], version: number): number[] {
  const buf = new BitBuffer();
  buf.put(0b0100, 4); // modo byte
  buf.put(bytes.length, charCountBits(version));
  for (const b of bytes) buf.put(b, 8);

  const capacityBits = totalDataCodewords(version) * 8;
  // Terminador (hasta 4 bits).
  const remaining = capacityBits - buf.bits.length;
  buf.put(0, Math.min(4, Math.max(0, remaining)));
  // Relleno hasta byte completo.
  while (buf.bits.length % 8 !== 0) buf.bits.push(0);
  // Bytes de relleno alternos 0xEC / 0x11.
  const pad = [0xec, 0x11];
  let p = 0;
  while (buf.bits.length < capacityBits) {
    buf.put(pad[p % 2] as number, 8);
    p += 1;
  }

  const codewords: number[] = [];
  for (let i = 0; i < buf.bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j += 1) v = (v << 1) | (buf.bits[i + j] as number);
    codewords.push(v);
  }
  return codewords;
}

// Divide en bloques, calcula EC e intercala datos + EC.
function buildCodewords(dataCodewords: number[], version: number): number[] {
  const [ecLen, groups] = EC_BLOCKS_M[version] as [number, [number, number][]];
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const [count, cw] of groups) {
    for (let b = 0; b < count; b += 1) {
      const block = dataCodewords.slice(offset, offset + cw);
      offset += cw;
      dataBlocks.push(block);
      ecBlocks.push(rsEncode(block, ecLen));
    }
  }
  const result: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const block of dataBlocks) if (i < block.length) result.push(block[i] as number);
  }
  for (let i = 0; i < ecLen; i += 1) {
    for (const block of ecBlocks) result.push(block[i] as number);
  }
  return result;
}

// --- Construcción de la matriz -----------------------------------------------
type Grid = (boolean | null)[][];

function chooseVersion(byteLen: number): number {
  for (let v = 1; v <= MAX_VERSION; v += 1) {
    const capacity = totalDataCodewords(v) * 8;
    const needed = 4 + charCountBits(v) + byteLen * 8;
    if (needed <= capacity) return v;
  }
  throw new Error("El contenido es demasiado largo para un QR (máx. versión 10).");
}

function placeFinder(grid: Grid, row: number, col: number): void {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= grid.length || cc < 0 || cc >= grid.length) continue;
      const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const isDark =
        inRing &&
        ((r === 0 || r === 6 || c === 0 || c === 6) || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      grid[rr]![cc] = inRing ? isDark : false;
    }
  }
}

function reserveFormat(grid: Grid): void {
  const n = grid.length;
  // Copia 1 (junto al finder superior-izquierdo): fila 8 cols 0..8 y col 8 filas 0..8.
  for (let i = 0; i <= 8; i += 1) {
    if (grid[8]![i] === null) grid[8]![i] = false;
    if (grid[i]![8] === null) grid[i]![8] = false;
  }
  // Copia 2: fila 8 cols n-8..n-1 y col 8 filas n-8..n-1 (8 celdas cada una).
  for (let i = 0; i < 8; i += 1) {
    if (grid[8]![n - 1 - i] === null) grid[8]![n - 1 - i] = false;
    if (grid[n - 1 - i]![8] === null) grid[n - 1 - i]![8] = false;
  }
}

function buildFunctionPatterns(version: number): { grid: Grid; reserved: boolean[][] } {
  const n = 17 + 4 * version;
  const grid: Grid = Array.from({ length: n }, () => new Array<boolean | null>(n).fill(null));

  placeFinder(grid, 0, 0);
  placeFinder(grid, 0, n - 7);
  placeFinder(grid, n - 7, 0);

  // Patrones de temporización.
  for (let i = 8; i < n - 8; i += 1) {
    const v = i % 2 === 0;
    if (grid[6]![i] === null) grid[6]![i] = v;
    if (grid[i]![6] === null) grid[i]![6] = v;
  }

  // Patrones de alineación.
  const positions = ALIGN_POS[version] as number[];
  for (const r of positions) {
    for (const c of positions) {
      if (grid[r]![c] !== null) continue; // solapa con finder
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          grid[r + dr]![c + dc] = dark;
        }
      }
    }
  }

  // Módulo oscuro fijo.
  grid[n - 8]![8] = true;

  reserveFormat(grid);

  // Información de versión (v7+): reservar áreas.
  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      const a = Math.floor(i / 3);
      const b = (i % 3) + n - 11;
      grid[a]![b] = false;
      grid[b]![a] = false;
    }
  }

  const reserved = grid.map((row) => row.map((cell) => cell !== null));
  return { grid, reserved };
}

function placeData(grid: Grid, reserved: boolean[][], bits: number[]): void {
  const n = grid.length;
  let bitIndex = 0;
  let upward = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1; // saltar columna de temporización
    for (let i = 0; i < n; i += 1) {
      const row = upward ? n - 1 - i : i;
      for (let c = 0; c < 2; c += 1) {
        const cc = col - c;
        if (reserved[row]![cc]) continue;
        grid[row]![cc] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

function applyMask(grid: Grid, reserved: boolean[][], mask: number): boolean[][] {
  const fn = MASKS[mask] as (r: number, c: number) => boolean;
  return grid.map((row, r) =>
    row.map((cell, c) => {
      const v = cell === true;
      return reserved[r]![c] ? v : v !== fn(r, c);
    })
  );
}

function penalty(m: boolean[][]): number {
  const n = m.length;
  let score = 0;
  // Regla 1: líneas de ≥5 del mismo color.
  for (let r = 0; r < n; r += 1) {
    for (const seq of [m[r] as boolean[], m.map((row) => row[r] as boolean)]) {
      let run = 1;
      for (let i = 1; i < n; i += 1) {
        if (seq[i] === seq[i - 1]) {
          run += 1;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
    }
  }
  // Regla 2: bloques 2x2.
  for (let r = 0; r < n - 1; r += 1) {
    for (let c = 0; c < n - 1; c += 1) {
      const v = m[r]![c];
      if (v === m[r]![c + 1] && v === m[r + 1]![c] && v === m[r + 1]![c + 1]) score += 3;
    }
  }
  // Regla 3: patrón 1:1:3:1:1 (finder-like).
  const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c <= n - 11; c += 1) {
      const rowSeg = (m[r] as boolean[]).slice(c, c + 11);
      const colSeg = m.slice(c, c + 11).map((row) => row[r] as boolean);
      if (eq(rowSeg, pat1) || eq(rowSeg, pat2)) score += 40;
      if (eq(colSeg, pat1) || eq(colSeg, pat2)) score += 40;
    }
  }
  // Regla 4: balance de módulos oscuros.
  const dark = m.reduce((s, row) => s + row.filter(Boolean).length, 0);
  const ratio = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  return score;
}

function eq(a: boolean[], b: boolean[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function placeFormat(m: boolean[][], mask: number): void {
  const n = m.length;
  const val = formatInfoBits(mask);
  // La cadena de 15 bits se coloca MSB primero (bit 14 → primera posición).
  const bit = (k: number): boolean => ((val >> (14 - k)) & 1) === 1;

  // Copia 1: recorrido alrededor del finder superior-izquierdo.
  const copy1: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  copy1.forEach(([r, c], k) => {
    m[r]![c] = bit(k);
  });

  // Copia 2: 7 verticales (col 8, filas n-1..n-7) + 8 horizontales (fila 8, cols n-8..n-1).
  // El módulo oscuro (n-8, 8) NO forma parte de la información de formato.
  const copy2: [number, number][] = [];
  for (let i = 0; i < 7; i += 1) copy2.push([n - 1 - i, 8]);
  for (let i = 8; i >= 1; i -= 1) copy2.push([8, n - i]);
  copy2.forEach(([r, c], k) => {
    m[r]![c] = bit(k);
  });
}

function placeVersion(m: boolean[][], version: number): void {
  if (version < 7) return;
  const n = m.length;
  const bits = versionInfoBits(version);
  for (let i = 0; i < 18; i += 1) {
    const bit = ((bits >> i) & 1) === 1;
    const a = Math.floor(i / 3);
    const b = (i % 3) + n - 11;
    m[a]![b] = bit;
    m[b]![a] = bit;
  }
}

function utf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/**
 * Genera la matriz de módulos del QR para `text` (true = oscuro), sin zona de
 * silencio. Lanza si el texto excede la capacidad (versión 10, nivel M).
 */
export function qrMatrix(text: string, forceMask?: number): boolean[][] {
  const bytes = utf8Bytes(text);
  const version = chooseVersion(bytes.length);
  const dataCodewords = encodeData(bytes, version);
  const finalCodewords = buildCodewords(dataCodewords, version);

  const bits: number[] = [];
  for (const cw of finalCodewords) for (let i = 7; i >= 0; i -= 1) bits.push((cw >> i) & 1);

  const { grid, reserved } = buildFunctionPatterns(version);
  placeData(grid, reserved, bits);

  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    if (forceMask !== undefined && mask !== forceMask) continue;
    const masked = applyMask(grid, reserved, mask);
    placeFormat(masked, mask);
    placeVersion(masked, version);
    const score = penalty(masked);
    if (score < bestScore) {
      bestScore = score;
      best = masked;
    }
  }
  return best as boolean[][];
}
