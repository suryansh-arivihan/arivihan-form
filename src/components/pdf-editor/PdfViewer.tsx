"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";

interface PdfViewerProps {
  pdfUrl: string;
  scale: number;
  onPageRender: (pageNumber: number, canvas: HTMLCanvasElement) => void;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: () => void;
  canvasRefs: React.MutableRefObject<{ [key: number]: HTMLCanvasElement | null }>;
  children: (pageNumber: number) => React.ReactNode;
}

export default function PdfViewer({
  pdfUrl,
  scale,
  onPageRender,
  onLoadSuccess,
  onLoadError,
  canvasRefs,
  children,
}: PdfViewerProps) {
  const [ReactPdf, setReactPdf] = useState<typeof import("react-pdf") | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Dynamically import react-pdf only on the client
    import("react-pdf").then((mod) => {
      // Configure worker for pdfjs-dist v3
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.js`;
      setReactPdf(mod);
    }).catch((err) => {
      console.error("Failed to load react-pdf:", err);
      setError(true);
      onLoadError();
    });
  }, []);

  if (error) {
    return (
      <div className="text-center text-red-400 p-8">
        Failed to load PDF viewer. Please try again.
      </div>
    );
  }

  if (!ReactPdf) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  const { Document, Page } = ReactPdf;

  return (
    <Document
      file={pdfUrl}
      onLoadSuccess={({ numPages: pages }) => {
        setNumPages(pages);
        setLoading(false);
        onLoadSuccess(pages);
      }}
      onLoadError={() => {
        setError(true);
        onLoadError();
      }}
      loading={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white">Loading PDF...</p>
          </div>
        </div>
      }
      error={
        <div className="text-center text-red-400 p-8">
          Failed to load PDF. Please try again.
        </div>
      }
    >
      {Array.from(new Array(numPages), (_, index) => {
        const pageNumber = index + 1;
        return (
          <div
            key={`page_${pageNumber}`}
            className="relative mb-4 mx-auto shadow-lg"
            style={{ width: "fit-content" }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              // Limit pixel ratio on mobile to reduce memory usage
              devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
              onRenderSuccess={() => {
                const parent = canvasRefs.current[pageNumber]?.parentElement;
                if (parent) {
                  const pageCanvas = parent.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
                  if (pageCanvas) {
                    onPageRender(pageNumber, pageCanvas);
                  }
                }
              }}
              onRenderError={(error) => {
                console.error(`Error rendering page ${pageNumber}:`, error);
              }}
            />
            {children(pageNumber)}
          </div>
        );
      })}
    </Document>
  );
}
