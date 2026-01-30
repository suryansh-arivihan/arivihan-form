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
  tool: "pen" | "eraser" | "pointer";
}

interface PageAnnotations {
  [pageNumber: number]: Stroke[];
}

interface PageDimensions {
  width: number;
  height: number;
}

interface MarksData {
  obtained: number | null;
  total: number | null;
}

interface PdfAnnotationEditorProps {
  pdfUrl: string;
  onSave: (pdfBlob: Blob, marks: MarksData) => Promise<void>;
  onClose: () => void;
  subjectName?: string;
}

export default function PdfAnnotationEditor({
  pdfUrl,
  onSave,
  onClose,
  subjectName,
}: PdfAnnotationEditorProps) {
  const [, setNumPages] = useState<number>(0);
  const [visualScale, setVisualScale] = useState(0.5); // What user sees (CSS transform)
  const [renderScale, setRenderScale] = useState(0.5); // Actual PDF render resolution
  const MAX_SCALE = 2; // Limit max zoom to prevent memory crashes on mobile
  const RENDER_THRESHOLD = 0.5; // Re-render when visual differs from render by this much
  const [tool, setTool] = useState<"pen" | "eraser" | "pointer">("pen");
  const [color, setColor] = useState("#e53935"); // Red default
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [annotations, setAnnotations] = useState<PageAnnotations>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [, setPageDimensions] = useState<{ [key: number]: PageDimensions }>({})
  const [marksObtained, setMarksObtained] = useState<string>("");
  const [marksTotal, setMarksTotal] = useState<string>("");
  const [showMarksDialog, setShowMarksDialog] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visualScaleRef = useRef<number>(0.5);
  const lastRenderTime = useRef<number>(0);
  const pinchState = useRef<{
    active: boolean;
    initialDistance: number;
    initialScale: number;
    currentTransform: number;
    lastCenterX: number;  // Last pinch center X (relative to container)
    lastCenterY: number;  // Last pinch center Y (relative to container)
  }>({
    active: false,
    initialDistance: 0,
    initialScale: 0.5,
    currentTransform: 1,
    lastCenterX: 0,
    lastCenterY: 0,
  });
  // Store focal point data for scroll adjustment after re-render
  const pendingScrollAdjustment = useRef<{
    screenX: number;  // Screen position of pinch center (relative to container)
    screenY: number;
    scrollLeft: number;  // Scroll position at time of pinch
    scrollTop: number;
    oldScale: number;  // Scale before zoom
    newScale: number;  // Scale after zoom
  } | null>(null);

  // Fetch PDF bytes for later saving
  useEffect(() => {
    fetch(pdfUrl)
      .then((res) => res.arrayBuffer())
      .then((bytes) => setPdfBytes(bytes))
      .catch((err) => console.error("Error fetching PDF:", err));
  }, [pdfUrl]);

  // Keep visual scale ref in sync
  useEffect(() => {
    visualScaleRef.current = visualScale;
  }, [visualScale]);

  // Check if we need to re-render PDF for quality (only for non-pinch zoom changes)
  useEffect(() => {
    // Skip if there's a pending scroll adjustment (pinch zoom handles its own render)
    if (pendingScrollAdjustment.current) return;

    const ratio = visualScale / renderScale;
    // Re-render if zoomed in too much (blurry) or zoomed out too much (wasting memory)
    if (ratio > 1 + RENDER_THRESHOLD || ratio < 1 - RENDER_THRESHOLD) {
      // Debounce the render scale update
      const timeout = setTimeout(() => {
        setRenderScale(visualScale);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [visualScale, renderScale]);

  // Handle scroll adjustment after PDF re-renders (for pinch zoom focal point preservation)
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    const adjustment = pendingScrollAdjustment.current;

    // Only proceed if we have a pending adjustment and scales now match
    if (!adjustment || !container || !content) return;
    if (Math.abs(renderScale - adjustment.newScale) > 0.01) return;

    // Calculate new scroll position to keep focal point at same screen position
    // Before: content point at (screenX + scrollLeft, screenY + scrollTop) in oldScale coordinates
    // After: same content point is at (screenX + scrollLeft, screenY + scrollTop) * (newScale/oldScale) in newScale coordinates
    // We want this point to still be at (screenX, screenY) on screen
    const scaleRatio = adjustment.newScale / adjustment.oldScale;
    const contentX = adjustment.screenX + adjustment.scrollLeft;
    const contentY = adjustment.screenY + adjustment.scrollTop;

    const newScrollLeft = contentX * scaleRatio - adjustment.screenX;
    const newScrollTop = contentY * scaleRatio - adjustment.screenY;

    // Apply scroll adjustment
    requestAnimationFrame(() => {
      container.scrollLeft = Math.max(0, newScrollLeft);
      container.scrollTop = Math.max(0, newScrollTop);

      // Reset CSS transform smoothly
      content.style.transition = "transform 0.15s ease-out";
      content.style.transform = "scale(1)";
      content.style.transformOrigin = "center top";

      // Clear the pending adjustment
      pendingScrollAdjustment.current = null;
    });
  }, [renderScale]);

  // Apply CSS transform to compensate for render vs visual scale difference
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Don't interfere if scroll adjustment effect will handle this
    if (pendingScrollAdjustment.current) return;

    const cssScale = visualScale / renderScale;
    if (Math.abs(cssScale - 1) > 0.01) {
      content.style.transform = `scale(${cssScale})`;
      content.style.transformOrigin = "center top";
    } else {
      content.style.transform = "scale(1)";
    }
  }, [visualScale, renderScale]);

  // Pinch zoom with CSS transform for smooth visual feedback
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content || tool !== "pointer") return;

    const getDistance = (touches: TouchList): number => {
      return Math.hypot(
        touches[1].clientX - touches[0].clientX,
        touches[1].clientY - touches[0].clientY
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        // Clear pending render timeout - user is zooming again
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
          renderTimeoutRef.current = null;
        }
        // Clear any pending scroll adjustment
        pendingScrollAdjustment.current = null;

        // Calculate pinch center relative to container
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;
        const containerRect = container.getBoundingClientRect();

        // Use visual scale ref as the starting point
        const startScale = visualScaleRef.current;

        pinchState.current = {
          active: true,
          initialDistance: getDistance(e.touches),
          initialScale: startScale,
          currentTransform: 1,
          lastCenterX: centerX - containerRect.left,
          lastCenterY: centerY - containerRect.top,
        };
        content.style.transition = "none";
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchState.current.active) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const ratio = currentDistance / pinchState.current.initialDistance;

        // Update pinch center continuously (store screen position relative to container)
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;
        const containerRect = container.getBoundingClientRect();

        // Store last pinch center for use at touch end
        pinchState.current.lastCenterX = centerX - containerRect.left;
        pinchState.current.lastCenterY = centerY - containerRect.top;

        // Clamp the visual transform ratio
        const minRatio = 0.1 / pinchState.current.initialScale;
        const maxRatio = MAX_SCALE / pinchState.current.initialScale;
        const clampedRatio = Math.min(maxRatio, Math.max(minRatio, ratio));

        pinchState.current.currentTransform = clampedRatio;

        // Calculate CSS transform relative to the currently rendered scale
        const newVisualScale = Math.min(MAX_SCALE, pinchState.current.initialScale * clampedRatio);
        const cssTransform = newVisualScale / renderScale;

        // Use pinch center as transform origin for more natural feel
        // Origin must be in content coordinates (include scroll) to keep pinch point stationary
        const originX = centerX - containerRect.left + container.scrollLeft;
        const originY = centerY - containerRect.top + container.scrollTop;

        // Apply CSS transform for instant visual feedback (GPU accelerated)
        content.style.transformOrigin = `${originX}px ${originY}px`;
        content.style.transform = `scale(${cssTransform})`;
      }
    };

    const handleTouchEnd = () => {
      if (pinchState.current.active) {
        const finalScale = Math.min(MAX_SCALE, Math.max(0.1,
          pinchState.current.initialScale * pinchState.current.currentTransform
        ));
        const oldScale = renderScale;

        // Store the visual scale
        visualScaleRef.current = finalScale;
        const transformRatio = finalScale / renderScale;

        // Keep showing the CSS transform (don't reset yet)
        content.style.transition = "none";
        content.style.transform = `scale(${transformRatio})`;

        // Clear any pending render
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }

        // Capture scroll position and pinch center NOW (at touch end)
        const capturedScrollLeft = container.scrollLeft;
        const capturedScrollTop = container.scrollTop;
        const capturedCenterX = pinchState.current.lastCenterX;
        const capturedCenterY = pinchState.current.lastCenterY;

        // Debounce: only re-render PDF after 350ms of no pinching
        renderTimeoutRef.current = setTimeout(() => {
          // Prevent rapid re-renders (minimum 400ms between renders)
          const now = Date.now();
          if (now - lastRenderTime.current < 400) {
            // Skip this render, CSS transform is still showing the zoom
            return;
          }
          lastRenderTime.current = now;

          // Store focal point info for scroll adjustment after re-render
          // Use the values captured at touch end, not current values
          pendingScrollAdjustment.current = {
            screenX: capturedCenterX,
            screenY: capturedCenterY,
            scrollLeft: capturedScrollLeft,
            scrollTop: capturedScrollTop,
            oldScale: oldScale,
            newScale: finalScale,
          };

          // Set both scales together to trigger immediate re-render
          // The scroll adjustment will happen in the useEffect after renderScale updates
          setVisualScale(finalScale);
          setRenderScale(finalScale);
        }, 350);

        pinchState.current.active = false;
        pinchState.current.currentTransform = 1;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [tool, renderScale]);

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
    if (tool === "pointer") return; // Don't draw in pointer mode

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
    if (tool === "pointer") return; // Allow native scroll in pointer mode
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY, pageNumber);
    setCursorPos({ x: touch.clientX, y: touch.clientY, visible: true });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>, pageNumber: number) => {
    if (tool === "pointer") return; // Allow native scroll in pointer mode
    e.preventDefault();
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY, pageNumber);
    setCursorPos({ x: touch.clientX, y: touch.clientY, visible: true });
  };

  const handleTouchEnd = (pageNumber: number) => {
    if (tool === "pointer") return;
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

      const marksData: MarksData = {
        obtained: marksObtained.trim() ? parseInt(marksObtained, 10) : null,
        total: marksTotal.trim() ? parseInt(marksTotal, 10) : null,
      };
      await onSave(blob, marksData);
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
    { name: "Black", value: "#212121" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Toolbar - Responsive: Single row in landscape, two rows in portrait */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-2 sm:px-4 py-1.5 landscape:py-2 flex flex-wrap landscape:flex-nowrap items-center gap-1 sm:gap-2 overflow-x-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md flex-shrink-0"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="h-5 w-px bg-gray-300 flex-shrink-0 hidden landscape:block" />

          {/* Pen Tool */}
          <button
            onClick={() => setTool("pen")}
            className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${
              tool === "pen" ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
            }`}
            title="Pen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Colors - only visible when pen is selected */}
          {tool === "pen" && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-4 h-4 rounded-full border transition-all flex-shrink-0 ${
                    color === c.value
                      ? "border-gray-700 ring-2 ring-gray-300"
                      : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Eraser Tool */}
          <button
            onClick={() => setTool("eraser")}
            className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${
              tool === "eraser" ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
            }`}
            title="Eraser"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
          </button>

          {/* Pointer/Hand Tool */}
          <button
            onClick={() => setTool("pointer")}
            className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${
              tool === "pointer" ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
            }`}
            title="Scroll"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
              <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </button>

          <div className="h-5 w-px bg-gray-300 flex-shrink-0 hidden landscape:block" />

          {/* Undo */}
          <button
            onClick={undoLast}
            disabled={getTotalAnnotations() === 0}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 flex-shrink-0"
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
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 text-red-600 flex-shrink-0"
            title="Clear All"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Spacer to push remaining items */}
          <div className="flex-1" />

          {/* Save Button - portrait only here */}
          <button
            onClick={() => setShowMarksDialog(true)}
            disabled={saving}
            className="landscape:hidden px-2 sm:px-3 py-1.5 bg-primary-700 text-white rounded-md hover:bg-primary-800 disabled:opacity-50 flex items-center gap-1.5 text-sm flex-shrink-0"
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save & Upload"}</span>
            <span className="sm:hidden">{saving ? "" : "Save"}</span>
          </button>

          {/* Second row items - shown inline in landscape */}
          <div className="flex items-center gap-2 w-full landscape:w-auto pt-1.5 landscape:pt-0 border-t landscape:border-t-0 border-gray-100 mt-1.5 landscape:mt-0 order-last landscape:order-none">
            {/* Zoom */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => setVisualScale((s) => Math.max(0.1, s - 0.1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs w-8 text-center">{Math.round(visualScale * 100)}%</span>
              <button
                onClick={() => setVisualScale((s) => Math.min(MAX_SCALE, s + 0.1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="flex-1 landscape:hidden" />

            {/* Stroke Width */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-14"
              />
              <span className="text-xs text-gray-600 w-3">{strokeWidth}</span>
            </div>

            {/* Save Button - landscape only here (at end) */}
            <button
              onClick={() => setShowMarksDialog(true)}
              disabled={saving}
              className="hidden landscape:flex ml-2 px-2 py-1.5 bg-primary-700 text-white rounded-md hover:bg-primary-800 disabled:opacity-50 items-center gap-1.5 text-sm flex-shrink-0"
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{saving ? "" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-700 p-4 relative ${tool === "pointer" ? "touch-pan-x touch-pan-y" : ""}`}
      >
        <div ref={contentRef} className="will-change-transform">
        <PdfViewer
          pdfUrl={pdfUrl}
          scale={renderScale}
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
              className={`absolute top-0 left-0 ${tool === "pointer" ? "touch-auto" : "touch-none"}`}
              style={{
                width: "100%",
                height: "100%",
                cursor: tool === "pointer" ? "grab" : "none",
                pointerEvents: tool === "pointer" ? "none" : "auto",
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
        </div>

        {/* Brush Preview Cursor */}
        {cursorPos.visible && tool !== "pointer" && (() => {
          // Calculate preview size based on stroke width and visual scale
          const baseSize = tool === "eraser" ? strokeWidth * 3 : strokeWidth;
          const previewSize = Math.max(8, baseSize * visualScale * 1.5);
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

      {/* Marks Dialog */}
      {showMarksDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Enter Marks
            </h3>
            {subjectName && (
              <p className="text-sm text-gray-500 mb-4">{subjectName}</p>
            )}

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 text-center">Obtained</label>
                <input
                  type="number"
                  min="0"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                  placeholder="--"
                  autoFocus
                  className="w-full px-3 py-2 text-lg text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <span className="text-2xl text-gray-400 mt-5">/</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 text-center">Total</label>
                <input
                  type="number"
                  min="1"
                  value={marksTotal}
                  onChange={(e) => setMarksTotal(e.target.value)}
                  placeholder="--"
                  className="w-full px-3 py-2 text-lg text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mb-4">
              Leave empty to save without marks
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMarksDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowMarksDialog(false);
                  handleSave();
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save & Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
