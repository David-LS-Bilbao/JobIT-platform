"use client";

import { useMemo } from "react";

import { qrMatrix } from "@/lib/qrcode";

const QUIET = 4;

function modulesToPath(matrix: boolean[][]): string {
  let d = "";
  const n = matrix.length;
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (matrix[r]![c]) d += `M${c + QUIET},${r + QUIET}h1v1h-1z`;
    }
  }
  return d;
}

function buildSvgString(matrix: boolean[][]): string {
  const total = matrix.length + QUIET * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="512" height="512" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
    `<path d="${modulesToPath(matrix)}" fill="#000000"/></svg>`
  );
}

function QrSvg({ matrix }: { matrix: boolean[][] }) {
  const total = matrix.length + QUIET * 2;
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={200}
      height={200}
      role="img"
      aria-label="Código QR del portfolio público"
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={modulesToPath(matrix)} fill="#000000" />
    </svg>
  );
}

/**
 * Tarjeta de QR del portfolio público. Genera el QR LOCALMENTE (sin servicios ni
 * imágenes externas) a partir de la URL absoluta. Solo QR activo si está publicado.
 */
export function PortfolioQrCard({
  url,
  isPublished,
  slug
}: {
  url: string;
  isPublished: boolean;
  slug: string;
}) {
  const matrix = useMemo(() => {
    if (!isPublished) return null;
    try {
      return qrMatrix(url);
    } catch {
      // Contenido demasiado largo para el QR: se muestra aviso en su lugar.
      return null;
    }
  }, [url, isPublished]);

  function handleDownload() {
    if (!matrix) return;
    try {
      if (typeof URL === "undefined" || typeof document === "undefined" || !URL.createObjectURL) return;
      const blob = new Blob([buildSvgString(matrix)], { type: "image/svg+xml" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `jobit-portfolio-qr-${slug}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      // Descarga no soportada: el QR sigue visible para capturarlo manualmente.
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">QR del portfolio</h2>
      <p className="mt-1 text-xs text-slate-500">Escanea este código para abrir tu portfolio público.</p>

      {isPublished && matrix ? (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <QrSvg matrix={matrix} />
          </div>
          <code className="max-w-full select-all break-all text-center text-xs text-slate-700">{url}</code>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Descargar QR
          </button>
        </div>
      ) : isPublished ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">
            La URL es demasiado larga para generar un QR. Acorta tu slug e inténtalo de nuevo.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">Publica tu portfolio para compartir este QR.</p>
        </div>
      )}
    </section>
  );
}
