import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { type Song, type Setlist, type SongLeader, type Musician } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X, ZoomIn, ZoomOut, Music, Palette, Plus } from "lucide-react";
import { transposeChord, getSemitoneDifference, parseChordLine, getAllKeys } from "@/lib/chordUtils";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type ColorScheme = "dark" | "light" | "inverted";

export default function ProjectionDisplayPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const setlistId = params.id;
  const { toast } = useToast();
  const [fontSize, setFontSize] = useState(16);
  const [highlightChords, setHighlightChords] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedSongToAdd, setSelectedSongToAdd] = useState<Song | null>(null);
  const [transposeKeyForNewSong, setTransposeKeyForNewSong] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const songRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: setlist, isLoading } = useQuery<SetlistWithSongs>({
    queryKey: ["/api/setlists", setlistId],
  });

  const sortedSetlistSongs = setlist?.songs ? [...setlist.songs].sort((a, b) => a.order - b.order) : [];

  const { data: allSongs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const getColorSchemeClasses = () => {
    switch (colorScheme) {
      case "light":
        return "bg-white text-black";
      case "inverted":
        return "bg-gray-100 text-gray-900";
      default:
        return "bg-black text-white";
    }
  };

  const getChordColorClass = () => {
    switch (colorScheme) {
      case "light":
        return "text-blue-600";
      case "inverted":
        return "text-indigo-700";
      default:
        return "text-green-400";
    }
  };

  const transposeMutation = useMutation({
    mutationFn: async ({ setlistSongId, newKey }: { setlistSongId: string; newKey: string }) => {
      return apiRequest("PATCH", `/api/setlists/${setlistId}/songs/${setlistSongId}`, {
        transposedKey: newKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      toast({
        title: "Success",
        description: "Song key updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update song key",
        variant: "destructive",
      });
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async ({ songId, transposedKey }: { songId: string; transposedKey?: string }) => {
      const maxOrder = sortedSetlistSongs.length > 0 
        ? Math.max(...sortedSetlistSongs.map(s => s.order))
        : 0;
      
      return apiRequest("POST", `/api/setlists/${setlistId}/songs`, {
        songId,
        order: maxOrder + 1,
        transposedKey: transposedKey || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      toast({
        title: "Success",
        description: "Song added to setlist",
      });
      setShowAddSong(false);
      setSelectedSongToAdd(null);
      setTransposeKeyForNewSong("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add song",
        variant: "destructive",
      });
    },
  });

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
              "font-mono break-words",
              highlightChords && getChordColorClass(),
              highlightChords && "font-semibold"
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {transposeChord(line, semitones)}
          </div>
        );
      }

      return (
        <div key={idx} className="break-words leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
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
      className={cn("h-screen overflow-hidden", getColorSchemeClasses())}
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
              <div className="mb-8 pb-4 border-b border-current/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold mb-2" data-testid={`song-title-${index}`}>
                      {setlistSong.song.title}
                    </h2>
                    <p className="text-xl opacity-70">
                      {setlistSong.song.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm opacity-70 mb-1">
                        Song {index + 1} of {sortedSetlistSongs.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">Key:</span>
                        <Select
                          value={setlistSong.transposedKey || setlistSong.song.originalKey}
                          onValueChange={(newKey) =>
                            transposeMutation.mutate({
                              setlistSongId: setlistSong.id,
                              newKey,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-24 text-lg font-semibold border-2",
                              colorScheme === "dark" && "bg-white/10 border-white/30 text-white",
                              colorScheme === "light" && "bg-black/5 border-black/20 text-black",
                              colorScheme === "inverted" && "bg-gray-800/20 border-gray-700/40 text-gray-900"
                            )}
                            data-testid={`select-transpose-${index}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllKeys().map((key) => (
                              <SelectItem key={key} value={key}>
                                {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {setlistSong.transposedKey && setlistSong.transposedKey !== setlistSong.song.originalKey && (
                        <div className="text-xs opacity-60 mt-1">
                          Original: {setlistSong.song.originalKey}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="leading-loose">
                {renderLyricsWithChords(setlistSong.song, setlistSong.transposedKey)}
              </div>
            </div>
          ))}

          {showAddSong && (
            <div className="py-16">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-bold">Add Song to Setlist</h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddSong(false);
                      setSelectedSongToAdd(null);
                      setTransposeKeyForNewSong("");
                    }}
                    data-testid="button-close-add-song"
                  >
                    Cancel
                  </Button>
                </div>
                
                {selectedSongToAdd ? (
                  <div className="space-y-6">
                    <div
                      className={cn(
                        "p-6 rounded-md border",
                        colorScheme === "dark" && "bg-white/5 border-white/20",
                        colorScheme === "light" && "bg-black/5 border-black/20",
                        colorScheme === "inverted" && "bg-gray-800/10 border-gray-700/30"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-2xl font-bold">{selectedSongToAdd.title}</h4>
                          <p className="text-lg opacity-70">{selectedSongToAdd.artist}</p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedSongToAdd(null);
                            setTransposeKeyForNewSong("");
                          }}
                        >
                          Change Song
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">Select Key:</span>
                        <Select 
                          value={transposeKeyForNewSong} 
                          onValueChange={setTransposeKeyForNewSong}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-32 text-lg font-semibold border-2",
                              colorScheme === "dark" && "bg-white/10 border-white/30 text-white",
                              colorScheme === "light" && "bg-black/5 border-black/20 text-black",
                              colorScheme === "inverted" && "bg-gray-800/20 border-gray-700/40 text-gray-900"
                            )}
                            data-testid="select-add-song-key"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllKeys().map((key) => (
                              <SelectItem key={key} value={key}>
                                {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {transposeKeyForNewSong !== selectedSongToAdd.originalKey && (
                          <span className="text-sm opacity-70">
                            (Original: {selectedSongToAdd.originalKey})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedSongToAdd(null);
                          setTransposeKeyForNewSong("");
                        }}
                        data-testid="button-cancel-add-song-confirm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => addSongMutation.mutate({ 
                          songId: selectedSongToAdd.id, 
                          transposedKey: transposeKeyForNewSong 
                        })}
                        disabled={addSongMutation.isPending}
                        data-testid="button-confirm-add-song"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Add to Setlist
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {allSongs
                      .filter(song => !sortedSetlistSongs.some(ss => ss.songId === song.id))
                      .map((song) => (
                        <div
                          key={song.id}
                          className={cn(
                            "p-4 rounded-md border cursor-pointer hover-elevate active-elevate-2",
                            colorScheme === "dark" && "bg-white/5 border-white/20",
                            colorScheme === "light" && "bg-black/5 border-black/20",
                            colorScheme === "inverted" && "bg-gray-800/10 border-gray-700/30"
                          )}
                          onClick={() => {
                            setSelectedSongToAdd(song);
                            setTransposeKeyForNewSong(song.originalKey);
                          }}
                          data-testid={`add-song-${song.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xl font-semibold">{song.title}</div>
                              <div className="text-sm opacity-70">{song.artist}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">Key: {song.originalKey}</div>
                              {song.tags && song.tags.length > 0 && (
                                <div className="text-xs opacity-60 mt-1">
                                  {song.tags.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {allSongs.filter(song => !sortedSetlistSongs.some(ss => ss.songId === song.id)).length === 0 && (
                      <div className="text-center py-8 opacity-60">
                        All songs are already in this setlist
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-4">End of Setlist</h2>
              <p className="text-xl opacity-70 mb-8">
                {sortedSetlistSongs.length} songs performed
              </p>
              <div className="space-y-4">
                {!showAddSong && (
                  <Button
                    onClick={() => setShowAddSong(true)}
                    size="lg"
                    variant="default"
                    data-testid="button-add-song-bottom"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Another Song
                  </Button>
                )}
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

            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const schemes: ColorScheme[] = ["dark", "light", "inverted"];
                  const currentIndex = schemes.indexOf(colorScheme);
                  setColorScheme(schemes[(currentIndex + 1) % schemes.length]);
                }}
                title="Toggle color scheme"
                data-testid="button-color-scheme"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSong(!showAddSong)}
                data-testid="button-add-song"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Song
              </Button>
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
