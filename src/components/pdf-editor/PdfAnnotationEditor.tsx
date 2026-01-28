"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import PdfViewer from "./PdfViewer";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

interface PageAnnotations {
  [pageNumber: number]: Stroke[];
}

interface PageDimensions {
  width: number;
  height: number;
}

interface PdfAnnotationEditorProps {
  pdfUrl: string;
  onSave: (pdfBlob: Blob) => Promise<void>;
  onClose: () => void;
}

export default function PdfAnnotationEditor({
  pdfUrl,
  onSave,
  onClose,
}: PdfAnnotationEditorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#e53935");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState<PageAnnotations>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{ [key: number]: PageDimensions }>({});
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch PDF bytes for later saving
  useEffect(() => {
    fetch(pdfUrl)
      .then((res) => res.arrayBuffer())
      .then((bytes) => setPdfBytes(bytes))
      .catch((err) => console.error("Error fetching PDF:", err));
  }, [pdfUrl]);

  const getCanvasCoordinates = (
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement
  ): Point => {
    const rect = canvas.getBoundingClientRect();

    // Return normalized coordinates (0-1 range) so they're scale-independent
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startDrawing = (
    clientX: number,
    clientY: number,
    pageNumber: number
  ) => {
    const canvas = canvasRefs.current[pageNumber];
    if (!canvas) return;

    const point = getCanvasCoordinates(clientX, clientY, canvas);
    setIsDrawing(true);
    setCurrentStroke({
      points: [point],
      color: tool === "eraser" ? "#FFFFFF" : color,
      width: tool === "eraser" ? strokeWidth * 3 : strokeWidth,
      tool,
    });
  };

  const draw = (
    clientX: number,
    clientY: number,
    pageNumber: number
  ) => {
    if (!isDrawing || !currentStroke) return;

    const canvas = canvasRefs.current[pageNumber];
    if (!canvas) return;

    const point = getCanvasCoordinates(clientX, clientY, canvas);
    const newStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point],
    };
    setCurrentStroke(newStroke);

    // Draw on canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = newStroke.points;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = newStroke.color;
    // Scale line width based on canvas size (use smaller dimension as reference)
    ctx.lineWidth = newStroke.width * Math.min(canvas.width, canvas.height) / 500;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (newStroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    const lastPoint = points[points.length - 2];
    const currentPoint = points[points.length - 1];
    // Convert normalized coordinates to canvas pixels
    ctx.moveTo(lastPoint.x * canvas.width, lastPoint.y * canvas.height);
    ctx.lineTo(currentPoint.x * canvas.width, currentPoint.y * canvas.height);
    ctx.stroke();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, pageNumber: number) => {
    startDrawing(e.clientX, e.clientY, pageNumber);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, pageNumber: number) => {
    draw(e.clientX, e.clientY, pageNumber);
    setCursorPos({ x: e.clientX, y: e.clientY, visible: true });
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>, pageNumber: number) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY, pageNumber);
    setCursorPos({ x: touch.clientX, y: touch.clientY, visible: true });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>, pageNumber: number) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY, pageNumber);
    setCursorPos({ x: touch.clientX, y: touch.clientY, visible: true });
  };

  const handleTouchEnd = (pageNumber: number) => {
    stopDrawing(pageNumber);
    setCursorPos((prev) => ({ ...prev, visible: false }));
  };

  const stopDrawing = (pageNumber: number) => {
    if (!isDrawing || !currentStroke) return;

    if (currentStroke.points.length > 1) {
      setAnnotations((prev) => ({
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), currentStroke],
      }));
    }

    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const redrawCanvas = useCallback(
    (pageNumber: number) => {
      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const strokes = annotations[pageNumber] || [];
      strokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        // Scale line width based on canvas size (use smaller dimension as reference)
        ctx.lineWidth = stroke.width * Math.min(canvas.width, canvas.height) / 500;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation =
          stroke.tool === "eraser" ? "destination-out" : "source-over";

        // Convert normalized coordinates to canvas pixels
        ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
        }
        ctx.stroke();
      });
    },
    [annotations]
  );

  // Redraw all pages when annotations change
  useEffect(() => {
    Object.keys(annotations).forEach((pageNum) => {
      redrawCanvas(parseInt(pageNum));
    });
  }, [annotations, redrawCanvas]);

  const clearPage = (pageNumber: number) => {
    setAnnotations((prev) => ({
      ...prev,
      [pageNumber]: [],
    }));
    const canvas = canvasRefs.current[pageNumber];
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const clearAll = () => {
    setAnnotations({});
    Object.keys(canvasRefs.current).forEach((key) => {
      const canvas = canvasRefs.current[parseInt(key)];
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  };

  const undoLast = () => {
    // Find the last page with annotations and remove the last stroke
    const pageNumbers = Object.keys(annotations)
      .map(Number)
      .filter((p) => annotations[p]?.length > 0);

    if (pageNumbers.length === 0) return;

    const lastPage = Math.max(...pageNumbers);
    setAnnotations((prev) => ({
      ...prev,
      [lastPage]: prev[lastPage].slice(0, -1),
    }));
  };

  const getTotalAnnotations = () => {
    return Object.values(annotations).reduce(
      (sum, strokes) => sum + strokes.length,
      0
    );
  };

  const handleSave = async () => {
    if (!pdfBytes) {
      alert("PDF not loaded yet. Please wait.");
      return;
    }

    try {
      setSaving(true);

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // Draw annotations on each page
      for (const [pageNumStr, strokes] of Object.entries(annotations)) {
        const pageIndex = parseInt(pageNumStr) - 1;
        const pageNumber = parseInt(pageNumStr);
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        for (const stroke of strokes) {
          if (stroke.points.length < 2 || stroke.tool === "eraser") continue;

          // Convert color from hex to RGB
          const hexColor = stroke.color.replace("#", "");
          const r = parseInt(hexColor.substring(0, 2), 16) / 255;
          const g = parseInt(hexColor.substring(2, 4), 16) / 255;
          const b = parseInt(hexColor.substring(4, 6), 16) / 255;

          // Draw the stroke as a series of lines
          for (let i = 1; i < stroke.points.length; i++) {
            const start = stroke.points[i - 1];
            const end = stroke.points[i];

            // Convert normalized coordinates (0-1) to PDF coordinates
            // PDF coordinates have origin at bottom-left, canvas has origin at top-left
            page.drawLine({
              start: { x: start.x * pdfWidth, y: pdfHeight - start.y * pdfHeight },
              end: { x: end.x * pdfWidth, y: pdfHeight - end.y * pdfHeight },
              // Scale line width based on PDF size (use smaller dimension as reference)
              thickness: stroke.width * Math.min(pdfWidth, pdfHeight) / 500,
              color: rgb(r, g, b),
            });
          }
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes as BlobPart], { type: "application/pdf" });

      await onSave(blob);
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const colors = [
    { name: "Red", value: "#e53935" },
    { name: "Green", value: "#43a047" },
    { name: "Blue", value: "#1e88e5" },
    { name: "Black", value: "#212121" },
    { name: "Orange", value: "#fb8c00" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Toolbar - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        {/* Top Row - Main Actions */}
        <div className="px-2 sm:px-4 py-2 flex items-center justify-between">
          {/* Left: Close & Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="h-6 w-px bg-gray-300 hidden sm:block" />

            {/* Pen Tool */}
            <button
              onClick={() => setTool("pen")}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-md flex items-center gap-1 sm:gap-2 ${
                tool === "pen" ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
              }`}
              title="Pen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm hidden sm:inline">Pen</span>
            </button>

            {/* Eraser Tool */}
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-md flex items-center gap-1 sm:gap-2 ${
                tool === "eraser" ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
              }`}
              title="Eraser"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm hidden sm:inline">Eraser</span>
            </button>

            <div className="h-6 w-px bg-gray-300 hidden sm:block" />

            {/* Undo */}
            <button
              onClick={undoLast}
              disabled={getTotalAnnotations() === 0}
              className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
              title="Undo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            {/* Clear All */}
            <button
              onClick={clearAll}
              disabled={getTotalAnnotations() === 0}
              className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 text-red-600"
              title="Clear All"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Right: Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 sm:px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Save & Upload</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom Row - Colors, Width, Zoom */}
        <div className="px-2 sm:px-4 py-2 flex items-center justify-between border-t border-gray-100 gap-2 overflow-x-auto">
          {/* Colors */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setColor(c.value);
                  setTool("pen");
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform flex-shrink-0 ${
                  color === c.value && tool === "pen"
                    ? "border-gray-800 scale-110"
                    : "border-gray-200 hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500 hidden sm:inline">Width:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-16 sm:w-20"
            />
            <span className="text-xs sm:text-sm text-gray-600 w-4">{strokeWidth}</span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
              className="p-1.5 sm:p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs sm:text-sm w-10 sm:w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="p-1.5 sm:p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-700 p-4 relative"
      >
        <PdfViewer
          pdfUrl={pdfUrl}
          scale={scale}
          canvasRefs={canvasRefs}
          onLoadSuccess={(pages) => setNumPages(pages)}
          onLoadError={() => {}}
          onPageRender={(pageNumber, pageCanvas) => {
            const canvas = canvasRefs.current[pageNumber];
            if (canvas) {
              canvas.width = pageCanvas.width;
              canvas.height = pageCanvas.height;
              setPageDimensions((prev) => ({
                ...prev,
                [pageNumber]: { width: pageCanvas.width, height: pageCanvas.height },
              }));
              redrawCanvas(pageNumber);
            }
          }}
        >
          {(pageNumber) => (
            <canvas
              ref={(el) => {
                canvasRefs.current[pageNumber] = el;
              }}
              className="absolute top-0 left-0 touch-none"
              style={{
                width: "100%",
                height: "100%",
                cursor: "none",
              }}
              // Mouse events
              onMouseDown={(e) => handleMouseDown(e, pageNumber)}
              onMouseMove={(e) => handleMouseMove(e, pageNumber)}
              onMouseUp={() => stopDrawing(pageNumber)}
              onMouseLeave={() => {
                stopDrawing(pageNumber);
                setCursorPos((prev) => ({ ...prev, visible: false }));
              }}
              onMouseEnter={(e) => {
                setCursorPos({ x: e.clientX, y: e.clientY, visible: true });
              }}
              // Touch events for mobile
              onTouchStart={(e) => handleTouchStart(e, pageNumber)}
              onTouchMove={(e) => handleTouchMove(e, pageNumber)}
              onTouchEnd={() => handleTouchEnd(pageNumber)}
              onTouchCancel={() => handleTouchEnd(pageNumber)}
            />
          )}
        </PdfViewer>

        {/* Brush Preview Cursor */}
        {cursorPos.visible && (() => {
          // Calculate preview size based on stroke width and scale
          const baseSize = tool === "eraser" ? strokeWidth * 3 : strokeWidth;
          const previewSize = Math.max(8, baseSize * scale * 1.5);
          return (
            <div
              className="pointer-events-none fixed z-50 rounded-full"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                width: previewSize,
                height: previewSize,
                transform: "translate(-50%, -50%)",
                backgroundColor: tool === "eraser" ? "rgba(255,255,255,0.6)" : color,
                border: tool === "eraser" ? "2px solid #666" : `2px solid ${color}`,
                opacity: 0.8,
                boxShadow: tool === "eraser" ? "0 0 0 1px rgba(0,0,0,0.3)" : "0 0 0 1px rgba(255,255,255,0.5)",
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}
