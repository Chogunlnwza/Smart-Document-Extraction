import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Clock, Loader2, FileImage, Trash2 } from 'lucide-react';

interface DocumentRecord {
  id: string;
  created_at: string;
  cropped_image_url: string;
  document_type: string;
  extracted_data: Record<string, any>;
  status: string;
}

interface HistoryProps {
  session?: any;
  refreshTrigger?: number;
}

export function History({ session, refreshTrigger }: HistoryProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', session.user.id)
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
  }, [session, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
        
      if (error) throw error;
      setDocuments(docs => docs.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL your scan history? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', session.user.id);
        
      if (error) throw error;
      setDocuments([]);
    } catch (err) {
      console.error('Failed to delete all', err);
      alert('Failed to delete history');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-16 p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-card/50">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p>No scan history found.</p>
        <p className="text-sm">Documents you scan will appear here.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 p-4 relative">
      {isDeleting && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Clock className="w-6 h-6 text-primary" />
          Recent Scans
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDeleteAll}
            disabled={loading || isDeleting}
            className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <button 
            onClick={fetchDocuments}
            disabled={loading || isDeleting}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
            title="Refresh History"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-card border border-border shadow-md rounded-xl overflow-hidden flex flex-col md:flex-row relative group">
            
            {/* Delete button (shows on hover) */}
            <button 
              onClick={() => handleDelete(doc.id)}
              className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md z-10"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>

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
