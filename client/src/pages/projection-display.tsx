import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { type Song, type Setlist, type SongLeader, type Musician } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X, ZoomIn, ZoomOut, Music, Palette, Plus, Check, ChevronsUpDown } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  const [chordColor, setChordColor] = useState("#22c55e");
  const [highlightChords, setHighlightChords] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedSongToAdd, setSelectedSongToAdd] = useState<Song | null>(null);
  const [transposeKeyForNewSong, setTransposeKeyForNewSong] = useState<string>("");
  const [songSearchOpen, setSongSearchOpen] = useState(false);
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

  const getChordColorStyle = () => {
    return { color: chordColor };
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
      return apiRequest("POST", `/api/setlists/${setlistId}/songs`, {
        songId,
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
      setSongSearchOpen(false);
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
      setFontSize((prev) => Math.max(prev - 4, 8));
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
            className="font-mono"
            style={{ 
              fontSize: `${fontSize}px`,
              whiteSpace: 'pre',
              overflowX: 'auto',
              ...(highlightChords ? { ...getChordColorStyle(), fontWeight: 600 } : {})
            }}
          >
            {transposeChord(line, semitones)}
          </div>
        );
      }

      return (
        <div 
          key={idx} 
          className="font-mono" 
          style={{ 
            fontSize: `${fontSize}px`,
            whiteSpace: 'pre',
            overflowX: 'auto'
          }}
        >
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
        
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-12 md:space-y-24">
          {sortedSetlistSongs.map((setlistSong, index) => (
            <div
              key={setlistSong.id}
              ref={(el) => (songRefs.current[setlistSong.id] = el)}
              className="min-h-screen flex flex-col justify-center"
              data-testid={`song-section-${index}`}
            >
              <div className="mb-4 md:mb-8 pb-2 md:pb-4 border-b border-current/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2" data-testid={`song-title-${index}`}>
                      {setlistSong.song.title}
                    </h2>
                    <p className="text-base md:text-xl opacity-70">
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
                      setSongSearchOpen(false);
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
                            setSongSearchOpen(true);
                          }}
                          data-testid="button-change-song"
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
                          setSongSearchOpen(false);
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
                  <div className="space-y-4">
                    <p className="text-lg mb-2">Search for a song to add:</p>
                    <Popover open={songSearchOpen} onOpenChange={setSongSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={songSearchOpen}
                          className={cn(
                            "w-full justify-between text-lg h-14",
                            colorScheme === "dark" && "bg-white/10 border-white/30 text-white hover:bg-white/20",
                            colorScheme === "light" && "bg-black/5 border-black/20 text-black hover:bg-black/10",
                            colorScheme === "inverted" && "bg-gray-800/20 border-gray-700/40 text-gray-900 hover:bg-gray-800/30"
                          )}
                          data-testid="button-search-song"
                        >
                          <span className={!selectedSongToAdd ? "opacity-60" : ""}>
                            {selectedSongToAdd ? selectedSongToAdd.title : "Select song..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                        <Command>
                          <CommandInput placeholder="Search songs..." data-testid="input-search-song" />
                          <CommandList>
                            <CommandEmpty>No songs found.</CommandEmpty>
                            <CommandGroup>
                              {allSongs
                                .filter(song => !sortedSetlistSongs.some(ss => ss.songId === song.id))
                                .map((song) => (
                                  <CommandItem
                                    key={song.id}
                                    value={`${song.title} ${song.artist}`}
                                    onSelect={() => {
                                      setSelectedSongToAdd(song);
                                      setTransposeKeyForNewSong(song.originalKey);
                                      setSongSearchOpen(false);
                                    }}
                                    data-testid={`search-result-${song.id}`}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedSongToAdd?.id === song.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{song.title}</div>
                                      <div className="text-sm text-muted-foreground">{song.artist}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Key: {song.originalKey}
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-3 md:px-6 py-2 md:py-4 gap-2">
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-sm md:text-xl font-semibold truncate max-w-[150px] md:max-w-none text-[#ffffff]" data-testid="text-setlist-name">
              {setlist.name}
            </h1>
            <div className="text-xs md:text-sm text-muted-foreground">
              {sortedSetlistSongs.length} songs
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-4 flex-wrap">
            <div className="flex items-center gap-1 border-r border-white/20 pr-2 md:pr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFontSize((prev) => Math.max(prev - 4, 8))}
                data-testid="button-decrease-font"
                className="h-7 w-7 md:h-9 md:w-9 text-[#ffffff]"
              >
                <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <span className="text-xs md:text-sm w-8 md:w-12 text-center text-[#ffffff]">{fontSize}px</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFontSize((prev) => Math.min(prev + 4, 64))}
                data-testid="button-increase-font"
                className="h-7 w-7 md:h-9 md:w-9 text-[#ffffff]"
              >
                <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 md:gap-2 border-r border-white/20 pr-2 md:pr-4">
              <Button
                variant={highlightChords ? "default" : "ghost"}
                size="sm"
                onClick={() => setHighlightChords((prev) => !prev)}
                data-testid="button-toggle-chords"
                className="text-xs md:text-sm h-7 md:h-8 px-2 md:px-3"
              >
                Chords
              </Button>
              <label className="flex items-center gap-1 cursor-pointer text-[#ffffff]" title="Chord color">
                <span className="text-xs hidden md:inline">Color:</span>
                <input
                  type="color"
                  value={chordColor}
                  onChange={(e) => setChordColor(e.target.value)}
                  className="h-6 w-8 md:h-7 md:w-10 cursor-pointer rounded border border-white/30"
                  data-testid="input-chord-color"
                />
              </label>
            </div>

            <div className="flex items-center gap-1 border-r border-white/20 pr-2 md:pr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => containerRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" })}
                data-testid="button-scroll-up"
                className="h-7 w-7 md:h-9 md:w-9 text-[#ffffff]"
              >
                <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => containerRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
                data-testid="button-scroll-down"
                className="h-7 w-7 md:h-9 md:w-9 text-[#ffffff]"
              >
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 border-r border-white/20 pr-2 md:pr-4 overflow-x-auto max-w-[200px] md:max-w-xs">
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap mr-1">Jump:</span>
              {sortedSetlistSongs.map((setlistSong, idx) => (
                <Button
                  key={setlistSong.id}
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSong(setlistSong.id)}
                  data-testid={`button-jump-to-song-${idx}`}
                  className="min-w-[1.5rem] md:min-w-[2rem] h-6 md:h-8 px-1 md:px-2 text-xs md:text-sm text-[#ffffff]"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-r border-white/20 pr-2 md:pr-4">
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
                className="h-7 w-7 md:h-9 md:w-9 text-[#ffffff]"
              >
                <Palette className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            <div className="hidden md:flex items-center gap-2 border-r border-white/20 pr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSong(!showAddSong)}
                data-testid="button-add-song"
                className="text-[#ffffff]"
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
              className="h-7 w-7 md:h-9 md:w-9 text-[#ffffff]"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
