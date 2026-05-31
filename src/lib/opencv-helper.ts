// Declare cv for typescript
declare var cv: any;

export async function waitForOpenCV(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof cv !== 'undefined' && cv.Mat) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (typeof cv !== 'undefined' && cv.Mat) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
}

export function cropDocument(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement | null {
  try {
    const src = cv.imread(sourceCanvas);
    const dst = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    
    // Apply Gaussian blur
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    
    // Edge detection (Canny)
    cv.Canny(dst, dst, 75, 200);
    
    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    
    // Sort contours by area and keep the largest ones
    let maxArea = 0;
    let maxContourIndex = -1;
    const minArea = (src.cols * src.rows) * 0.1; // At least 10% of image area
    
    for (let i = 0; i < contours.size(); ++i) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt, false);
      if (area > maxArea && area > minArea) {
        // Approximate contour to polygon
        const tmp = new cv.Mat();
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
        
        // If the polygon has 4 vertices, we assume it's the document
        if (approx.rows === 4) {
          maxArea = area;
          maxContourIndex = i;
        }
        tmp.delete();
        approx.delete();
      }
    }
    
    if (maxContourIndex !== -1) {
      const cnt = contours.get(maxContourIndex);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
      
      // We have the 4 points of the document. We need to order them: top-left, top-right, bottom-right, bottom-left
      // Simplified approach: sort by x and y.
      const points = [];
      for (let i = 0; i < 4; i++) {
        points.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] });
      }
      
      // Order points:
      // Top-left: min(x+y)
      // Bottom-right: max(x+y)
      // Top-right: min(y-x)
      // Bottom-left: max(y-x)
      points.sort((a, b) => (a.x + a.y) - (b.x + b.y));
      const tl = points[0];
      const br = points[3];
      
      const remaining = [points[1], points[2]];
      remaining.sort((a, b) => (a.y - a.x) - (b.y - b.x));
      const tr = remaining[0];
      const bl = remaining[1];
      
      // Calculate width and height of the new image
      const widthA = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
      const widthB = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
      const maxWidth = Math.max(Math.round(widthA), Math.round(widthB));
      
      const heightA = Math.sqrt(Math.pow(tr.x - br.x, 2) + Math.pow(tr.y - br.y, 2));
      const heightB = Math.sqrt(Math.pow(tl.x - bl.x, 2) + Math.pow(tl.y - bl.y, 2));
      const maxHeight = Math.max(Math.round(heightA), Math.round(heightB));
      
      // Construct source and destination points for perspective transform
      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y
      ]);
      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0, maxWidth - 1, 0, maxWidth - 1, maxHeight - 1, 0, maxHeight - 1
      ]);
      
      // Get transform matrix
      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      const warped = new cv.Mat();
      const dsize = new cv.Size(maxWidth, maxHeight);
      
      // Apply perspective transform
      cv.warpPerspective(src, warped, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      
      // Convert warped Mat to canvas
      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, warped);
      
      // Cleanup
      src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
      approx.delete(); srcTri.delete(); dstTri.delete(); M.delete(); warped.delete();
      
      return outputCanvas;
    }
    
    // Cleanup if no contour found
    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
    return null;
  } catch (e) {
    console.error("OpenCV processing error:", e);
    return null;
  }
}
