import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-primary/10 p-6 rounded-full">
            <Music className="w-16 h-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4">
          Worship Manager
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          Organize worship songs, build setlists, manage musicians, and create beautiful projection displays for your church services.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-lg bg-card border">
            <h3 className="text-lg font-semibold mb-2">Song Library</h3>
            <p className="text-sm text-muted-foreground">
              Store worship songs with lyrics, chords, and tags for easy organization and searching.
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border">
            <h3 className="text-lg font-semibold mb-2">Setlist Builder</h3>
            <p className="text-sm text-muted-foreground">
              Create setlists with drag-and-drop reordering and per-song key transposition.
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border">
            <h3 className="text-lg font-semibold mb-2">Projection Display</h3>
            <p className="text-sm text-muted-foreground">
              Project lyrics with chords in full-screen mode with customizable colors and font sizes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
