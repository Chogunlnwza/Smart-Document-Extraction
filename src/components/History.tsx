import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Clock, Loader2, FileImage } from 'lucide-react';

interface DocumentRecord {
  id: string;
  created_at: string;
  cropped_image_url: string;
  document_type: string;
  extracted_data: Record<string, any>;
  status: string;
}

export function History() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Fetch the last 10 scans

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setDocuments(data as DocumentRecord[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading && documents.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return null; // Don't show anything if no history
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 p-4">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Clock className="w-6 h-6 text-primary" />
          Recent Scans
        </h2>
        <button 
          onClick={fetchDocuments}
          disabled={loading}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
          title="Refresh History"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-card border border-border shadow-md rounded-xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Image Preview */}
            <div className="w-full md:w-1/3 bg-muted flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-border min-h-[200px]">
              {doc.cropped_image_url && doc.cropped_image_url.includes('.pdf') ? (
                 <FileImage className="w-16 h-16 text-muted-foreground" />
              ) : (
                <img 
                  src={doc.cropped_image_url} 
                  alt="Document Thumbnail" 
                  className="max-w-full max-h-[250px] object-contain rounded-md shadow-sm"
                  loading="lazy"
                />
              )}
            </div>

            {/* Extracted Data */}
            <div className="w-full md:w-2/3 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Document Type</span>
                  <p className="text-xl font-bold text-primary">{doc.document_type || 'Unknown'}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {new Date(doc.created_at).toLocaleString()}
                </span>
              </div>

              {doc.extracted_data && Object.keys(doc.extracted_data).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                  {Object.entries(doc.extracted_data).map(([key, value]) => (
                    <div key={key} className="bg-background p-3 rounded-md border border-border/60 shadow-sm flex flex-col">
                      <span className="text-xs text-muted-foreground capitalize mb-1 font-medium">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-semibold text-foreground break-words text-sm">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-auto">No structured data available.</p>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
