import { Scanner } from './components/Scanner'
import { History } from './components/History'
import { FileText } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">DocScanner<span className="text-primary">.ai</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Powered by Supabase</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl -z-10" />

        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 text-foreground">
            Smart Document <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Extraction</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Capture a document, let AI crop it instantly, read the text, and extract structured data automatically directly into your database.
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <Scanner />
        </div>
        
        <History />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-16 md:flex-row max-w-5xl mx-auto">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with React, Vite, Tailwind CSS, OpenCV, Gemini AI, and Supabase.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
