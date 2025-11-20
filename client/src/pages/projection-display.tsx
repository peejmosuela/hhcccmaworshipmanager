import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { type Song, type Setlist, type SongLeader, type Musician } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X, ZoomIn, ZoomOut, Music } from "lucide-react";
import { transposeChord, getSemitoneDifference, parseChordLine } from "@/lib/chordUtils";
import { cn } from "@/lib/utils";

interface SetlistSongWithSong {
  id: string;
  songId: string;
  order: number;
  transposedKey: string | null;
  song: Song;
}

interface SetlistWithSongs extends Setlist {
  songs: SetlistSongWithSong[];
  songLeader?: SongLeader;
  musicians: Array<{ id: string; musicianId: string; musician: Musician }>;
}

export default function ProjectionDisplayPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const setlistId = params.id;
  const [fontSize, setFontSize] = useState(32);
  const [highlightChords, setHighlightChords] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const songRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: setlist, isLoading } = useQuery<SetlistWithSongs>({
    queryKey: ["/api/setlists", setlistId],
  });

  const sortedSetlistSongs = setlist?.songs ? [...setlist.songs].sort((a, b) => a.order - b.order) : [];

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => setShowControls(false), 5000);
    setControlsTimeout(timeout);
  };

  const handleTouchStart = () => {
    if (!showControls) {
      setShowControls(true);
      const timeout = setTimeout(() => setShowControls(false), 5000);
      setControlsTimeout(timeout);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setLocation("/setlists");
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      containerRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
    } else if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      containerRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
    } else if (e.key === "+" || e.key === "=") {
      setFontSize((prev) => Math.min(prev + 4, 64));
    } else if (e.key === "-" || e.key === "_") {
      setFontSize((prev) => Math.max(prev - 4, 16));
    }
  }, [setLocation]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const scrollToSong = (songId: string) => {
    const element = songRefs.current[songId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderLyricsWithChords = (song: Song, transposedKey: string | null) => {
    if (!song.lyrics) return null;

    const originalKey = song.originalKey;
    const targetKey = transposedKey || originalKey;
    const semitones = getSemitoneDifference(originalKey, targetKey);
    const lines = song.lyrics.split("\n");

    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-4" />;
      }

      const chords = parseChordLine(line);

      if (chords.length > 0) {
        return (
          <div
            key={idx}
            className={cn(
              "font-mono whitespace-pre",
              highlightChords && "text-green-400 font-semibold"
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {transposeChord(line, semitones)}
          </div>
        );
      }

      return (
        <div key={idx} className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
          {line}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!setlist || sortedSetlistSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <Music className="h-24 w-24 mb-6 opacity-50" />
        <h2 className="text-3xl font-semibold mb-4">No Songs in Setlist</h2>
        <p className="text-muted-foreground mb-8">
          Add songs to this setlist to use presentation mode
        </p>
        <Button
          onClick={() => setLocation("/setlists")}
          variant="outline"
          data-testid="button-back-to-setlists"
        >
          Back to Setlists
        </Button>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-black text-white overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      data-testid="projection-display"
    >
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="max-w-5xl mx-auto px-8 py-16 space-y-24">
          {sortedSetlistSongs.map((setlistSong, index) => (
            <div
              key={setlistSong.id}
              ref={(el) => (songRefs.current[setlistSong.id] = el)}
              className="min-h-screen flex flex-col justify-center"
              data-testid={`song-section-${index}`}
            >
              <div className="mb-8 pb-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-bold mb-2" data-testid={`song-title-${index}`}>
                      {setlistSong.song.title}
                    </h2>
                    <p className="text-xl text-muted-foreground">
                      {setlistSong.song.artist}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold mb-1">
                      Key: {setlistSong.transposedKey || setlistSong.song.originalKey}
                    </div>
                    <div className="text-muted-foreground">
                      Song {index + 1} of {sortedSetlistSongs.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="leading-loose">
                {renderLyricsWithChords(setlistSong.song, setlistSong.transposedKey)}
              </div>
            </div>
          ))}

          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-4">End of Setlist</h2>
              <p className="text-xl text-muted-foreground mb-8">
                {sortedSetlistSongs.length} songs performed
              </p>
              <Button
                onClick={() => setLocation("/setlists")}
                size="lg"
                variant="outline"
                data-testid="button-exit-presentation"
              >
                Exit Presentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 z-50",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold" data-testid="text-setlist-name">
              {setlist.name}
            </h1>
            <div className="text-sm text-muted-foreground">
              {sortedSetlistSongs.length} songs
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFontSize((prev) => Math.max(prev - 4, 16))}
                data-testid="button-decrease-font"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{fontSize}px</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFontSize((prev) => Math.min(prev + 4, 64))}
                data-testid="button-increase-font"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
              <Button
                variant={highlightChords ? "default" : "ghost"}
                size="sm"
                onClick={() => setHighlightChords((prev) => !prev)}
                data-testid="button-toggle-chords"
              >
                Chords
              </Button>
            </div>

            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => containerRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" })}
                data-testid="button-scroll-up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => containerRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
                data-testid="button-scroll-down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 border-r border-white/20 pr-4 max-w-xs overflow-x-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap mr-2">Jump:</span>
              {sortedSetlistSongs.map((setlistSong, idx) => (
                <Button
                  key={setlistSong.id}
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSong(setlistSong.id)}
                  data-testid={`button-jump-to-song-${idx}`}
                  className="min-w-[2rem]"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/setlists")}
              data-testid="button-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
