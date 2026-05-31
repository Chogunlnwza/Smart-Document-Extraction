import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, UploadCloud, CheckCircle, Loader2, FileImage } from 'lucide-react';
import { waitForOpenCV, cropDocument } from '../lib/opencv-helper';
import { model, base64ToGenerativePart } from '../lib/gemini';
import { supabase } from '../lib/supabase';


interface ScannerProps {
  onSuccess?: (data: any) => void;
}

export function Scanner({ onSuccess }: ScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openCvReady, setOpenCvReady] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [step, setStep] = useState<'camera' | 'preview' | 'result'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    waitForOpenCV().then(() => setOpenCvReady(true));
  }, []);

  const videoConstraints = {
    facingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedImage(result);

      if (file.type === 'application/pdf') {
        // Bypass OpenCV for PDF
        setCroppedImage(result);
        setStep('preview');
      } else {
        processImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        alert("Camera is still loading or unavailable. Please wait a moment or check permissions.");
        return;
      }
      setCapturedImage(imageSrc);
      processImage(imageSrc);
    }
  };

  const processImage = async (imageSrc: string | null) => {
    if (!imageSrc || !openCvReady) return;

    setIsProcessing(true);
    setStep('preview');

    try {
      // Create an image element to draw to canvas
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Crop Document using OpenCV
        const croppedCanvas = cropDocument(canvas);

        if (croppedCanvas) {
          setCroppedImage(croppedCanvas.toDataURL('image/jpeg', 0.9));
        } else {
          // Fallback to original image if contour detection fails
          setCroppedImage(imageSrc);
        }
      }
    } catch (e) {
      console.error(e);
      setCroppedImage(imageSrc); // fallback
    } finally {
      setIsProcessing(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setCroppedImage(null);
    setExtractionResult(null);
    setStep('camera');
  };

  const extractData = async () => {
    if (!croppedImage) return;
    setIsProcessing(true);

    try {
      // 1. Prepare image for Gemini
      const mimeType = croppedImage.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
      const imagePart = await base64ToGenerativePart(croppedImage, mimeType);

      // 2. Build prompt for structured JSON
      const prompt = `Analyze this document and extract the key information.
Please format the output strictly as a JSON object without markdown formatting blocks.
Identify the type of document (e.g., ID Card, Receipt, Invoice, General).
Extract all relevant fields based on the document type (e.g., name, id_number, dates, amounts, items, addresses).
Structure the JSON like this:
{
  "document_type": "The identified document type",
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}`;

      // 3. Call Gemini
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      // Clean JSON string (remove markdown if any)
      let cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const extractedJson = JSON.parse(cleanJson);
      setExtractionResult(extractedJson);

      // 4. Upload cropped image to Supabase Storage
      const base64Data = croppedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const extension = mimeType === 'application/pdf' ? 'pdf' : (mimeType.split('/')[1] || 'jpg');
      const fileName = `${Date.now()}-doc.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('document-images')
        .upload(fileName, blob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('document-images')
        .getPublicUrl(fileName);

      // 5. Save to Database
      const { error: dbError } = await supabase.from('documents').insert({
        original_image_url: null, // Could save original if needed
        cropped_image_url: publicUrlData.publicUrl,
        document_type: extractedJson.document_type || 'Unknown',
        extracted_data: extractedJson.data,
        status: 'processed'
      });

      if (dbError) throw dbError;

      setStep('result');
      if (onSuccess) onSuccess(extractedJson);

    } catch (e: any) {
      console.error("Extraction failed:", e);
      alert(`Failed: ${e.message || JSON.stringify(e)}\n\nPlease see console for full details.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4 bg-card rounded-2xl shadow-xl border border-border">

      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {step === 'camera' && <><Camera className="w-5 h-5 text-primary" /> Scan Document</>}
          {step === 'preview' && <><RefreshCw className="w-5 h-5 text-primary" /> Review Scan</>}
          {step === 'result' && <><CheckCircle className="w-5 h-5 text-green-500" /> Extracted Data</>}
        </h2>
        {!openCvReady && step === 'camera' && (
          <span className="text-xs flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-md">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading AI Core...
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative w-full aspect-[4/3] bg-muted rounded-xl overflow-hidden flex items-center justify-center">
        {step === 'camera' && (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
              className="absolute top-4 right-4 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors backdrop-blur-md shadow-lg z-10 flex items-center justify-center"
              title="Switch Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </>
        )}

        {step === 'preview' && croppedImage && (
          croppedImage.startsWith('data:application/pdf') ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/10">
              <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">PDF Document Selected</p>
            </div>
          ) : (
            <img src={croppedImage} alt="Cropped" className="w-full h-full object-contain bg-black/10" />
          )
        )}

        {step === 'result' && croppedImage && (
          <div className="w-full h-full flex p-4 gap-4 bg-muted">
            <div className="w-1/3 flex items-center justify-center bg-black/5 rounded-lg p-2">
              {croppedImage.startsWith('data:application/pdf') ? (
                <FileImage className="w-12 h-12 text-muted-foreground" />
              ) : (
                <img src={croppedImage} alt="Cropped" className="max-w-full max-h-full object-contain rounded-md shadow-sm" />
              )}
            </div>
            <div className="w-2/3 overflow-auto bg-background rounded-lg p-4 border border-border shadow-inner text-sm text-left">
              {extractionResult ? (
                <div className="flex flex-col gap-3">
                  {extractionResult.document_type && (
                    <div className="pb-3 border-b border-border">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Document Type</span>
                      <p className="text-lg font-bold text-primary mt-1">{extractionResult.document_type}</p>
                    </div>
                  )}

                  {extractionResult.data && Object.keys(extractionResult.data).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {Object.entries(extractionResult.data).map(([key, value]) => (
                        <div key={key} className="bg-card p-3 rounded-md border border-border/60 shadow-sm flex flex-col">
                          <span className="text-xs text-muted-foreground capitalize mb-1 font-medium">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-foreground break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-foreground font-mono text-xs whitespace-pre-wrap">
                      {JSON.stringify(extractionResult, null, 2)}
                    </pre>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-300">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="font-medium animate-pulse">
              {step === 'preview' ? 'Optimizing Image...' : 'Extracting Data with AI...'}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex gap-4 w-full justify-center">
        {step === 'camera' && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 max-w-[200px] bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              Upload File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <button
              onClick={capture}
              disabled={!openCvReady}
              className="flex-1 max-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-xl font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <Camera className="w-5 h-5" />
              Capture
            </button>
          </>
        )}

        {step === 'preview' && (
          <>
            <button
              onClick={retake}
              disabled={isProcessing}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-6 rounded-xl font-medium transition-all"
            >
              Retake
            </button>
            <button
              onClick={extractData}
              disabled={isProcessing}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-xl font-medium transition-all shadow-lg shadow-primary/25 flex justify-center items-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              Extract Data
            </button>
          </>
        )}

        {step === 'result' && (
          <button
            onClick={retake}
            className="flex-1 max-w-[240px] bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-xl font-medium transition-all shadow-lg"
          >
            Scan Another Document
          </button>
        )}
      </div>
    </div>
  );
}
