import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { type Song, type SetlistSong, type Setlist } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Settings2, Music } from "lucide-react";
import { transposeChord, getAllKeys, parseChordLine } from "@/lib/chordUtils";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectionDisplayPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const setlistId = params.id;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(28);
  const [highlightChords, setHighlightChords] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: setlist, isLoading: setlistLoading } = useQuery<Setlist>({
    queryKey: ["/api/setlists", setlistId],
  });

  const { data: setlistSongs = [], isLoading: songsLoading } = useQuery<SetlistSong[]>({
    queryKey: ["/api/setlists", setlistId, "songs"],
  });

  const { data: allSongs = [], isLoading: allSongsLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const sortedSetlistSongs = [...setlistSongs].sort((a, b) => a.order - b.order);
  const currentSetlistSong = sortedSetlistSongs[currentIndex];
  const currentSong = allSongs.find((s) => s.id === currentSetlistSong?.songId);

  const isLoading = setlistLoading || songsLoading || allSongsLoading;

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (currentIndex < sortedSetlistSongs.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } else if (e.key === "Escape") {
        setLocation(`/setlists`);
      } else if (e.key === "+") {
        setFontSize((prev) => Math.min(prev + 2, 48));
      } else if (e.key === "-") {
        setFontSize((prev) => Math.max(prev - 2, 16));
      }
    },
    [currentIndex, sortedSetlistSongs.length, setLocation]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (sortedSetlistSongs.length === 0) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-4">
        <Music className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Songs in Setlist</h2>
          <p className="text-muted-foreground mb-4">
            Add songs to this setlist to use presentation mode.
          </p>
          <Button
            onClick={() => setLocation("/setlists")}
            data-testid="button-back-to-setlists"
          >
            Back to Setlists
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSong || !currentSetlistSong) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Song not found...</p>
      </div>
    );
  }

  const renderLyrics = () => {
    const lines = currentSong.lyrics.split("\n");
    const result: JSX.Element[] = [];
    const transposedKey = currentSetlistSong.transposedKey || currentSong.originalKey;
    const semitones = getAllKeys().indexOf(transposedKey) - getAllKeys().indexOf(currentSong.originalKey);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const chords = parseChordLine(line);

      if (chords.length > 0) {
        const transposedChords = chords.map((chordInfo: { chord: string; position: number }) => ({
          ...chordInfo,
          chord: transposeChord(chordInfo.chord, semitones),
        }));

        result.push(
          <div key={`line-${i}`} className="relative mb-1">
            <div className="relative h-8">
              {transposedChords.map((chordInfo: { chord: string; position: number }, idx: number) => (
                <span
                  key={idx}
                  className={cn(
                    "absolute font-bold whitespace-nowrap",
                    highlightChords ? "text-primary" : "text-foreground"
                  )}
                  style={{
                    left: `${chordInfo.position * 0.6}em`,
                    top: 0,
                  }}
                >
                  {chordInfo.chord}
                </span>
              ))}
            </div>
          </div>
        );
      } else {
        result.push(
          <div key={`line-${i}`} className="leading-relaxed">
            {line || <br />}
          </div>
        );
      }
    }

    return result;
  };

  return (
    <div
      className="h-screen w-screen bg-background flex flex-col overflow-hidden"
      onMouseMove={handleMouseMove}
      data-testid="projection-display"
    >
      <div
        className={cn(
          "absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between z-10 transition-transform duration-300",
          showControls ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/setlists")}
            data-testid="button-exit-projection"
          >
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-medium">{currentSong.title}</h2>
            <p className="text-sm text-muted-foreground">
              {currentSong.artist || "Unknown Artist"} • Key of{" "}
              {currentSetlistSong.transposedKey || currentSong.originalKey}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Song {currentIndex + 1} of {sortedSetlistSongs.length}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-display-settings">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Display Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Font Size</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setFontSize((prev) => Math.max(prev - 2, 16))}
                      data-testid="button-decrease-font"
                    >
                      -
                    </Button>
                    <span className="text-sm w-12 text-center">{fontSize}px</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setFontSize((prev) => Math.min(prev + 2, 48))}
                      data-testid="button-increase-font"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={highlightChords}
                onCheckedChange={setHighlightChords}
                data-testid="checkbox-highlight-chords"
              >
                Highlight Chords
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-12 py-20">
        <div
          className="max-w-5xl w-full font-mono"
          style={{ fontSize: `${fontSize}px` }}
          data-testid="projection-lyrics"
        >
          {renderLyrics()}
        </div>
      </div>

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 flex items-center justify-between z-10 transition-transform duration-300",
          showControls ? "translate-y-0" : "translate-y-full"
        )}
      >
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          data-testid="button-previous-song"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentSong.arrangement && (
          <p className="text-sm text-muted-foreground text-center">
            {currentSong.arrangement}
          </p>
        )}

        <Button
          variant="outline"
          onClick={() =>
            setCurrentIndex(Math.min(sortedSetlistSongs.length - 1, currentIndex + 1))
          }
          disabled={currentIndex === sortedSetlistSongs.length - 1}
          data-testid="button-next-song"
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-1/2 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-background/50 backdrop-blur-sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </div>
        <div className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-background/50 backdrop-blur-sm"
            onClick={() =>
              setCurrentIndex(Math.min(sortedSetlistSongs.length - 1, currentIndex + 1))
            }
            disabled={currentIndex === sortedSetlistSongs.length - 1}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
