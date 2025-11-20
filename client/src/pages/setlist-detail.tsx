import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Setlist, type Song, type Musician, type SongLeader, type SetlistSong, type Position, type SetlistMusician } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Plus, Trash2, GripVertical, Calendar, User, 
  Music as MusicIcon, Users, Presentation, Check, ChevronsUpDown
} from "lucide-react";
import { format } from "date-fns";
import { getAllKeys } from "@/lib/chordUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SetlistSongWithSong extends SetlistSong {
  song: Song;
}

interface SetlistMusic extends SetlistMusician {
  musician: Musician;
}

interface SetlistWithSongs extends Setlist {
  songs: SetlistSongWithSong[];
  songLeader?: SongLeader;
  musicians: SetlistMusic[];
}

function SortableSongItem({ 
  setlistSong, 
  onRemove 
}: { 
  setlistSong: SetlistSongWithSong; 
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: setlistSong.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg hover-elevate"
      data-testid={`song-item-${setlistSong.id}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="font-medium">{setlistSong.song.title}</div>
        <div className="text-sm text-muted-foreground">{setlistSong.song.artist}</div>
      </div>
      <Badge variant="outline">
        {setlistSong.transposedKey || setlistSong.song.originalKey}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        data-testid={`button-remove-song-${setlistSong.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function SetlistDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const setlistId = params.id!;
  const [selectedSongId, setSelectedSongId] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [songSelectOpen, setSongSelectOpen] = useState(false);

  const { data: setlist, isLoading } = useQuery<SetlistWithSongs>({
    queryKey: ["/api/setlists", setlistId],
  });

  const { data: allSongs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { data: allMusicians = [] } = useQuery<Musician[]>({
    queryKey: ["/api/musicians"],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: allSongLeaders = [] } = useQuery<SongLeader[]>({
    queryKey: ["/api/song-leaders"],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSongMutation = useMutation({
    mutationFn: async ({ songId, transposedKey }: { songId: string; transposedKey?: string }) => {
      return apiRequest("POST", `/api/setlists/${setlistId}/songs`, { 
        songId, 
        transposedKey: transposedKey || null 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      setSelectedSongId("");
      setSelectedKey("");
      toast({ title: "Success", description: "Song added to setlist" });
    },
  });

  const removeSongMutation = useMutation({
    mutationFn: async (setlistSongId: string) => {
      return apiRequest("DELETE", `/api/setlists/${setlistId}/songs/${setlistSongId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      toast({ title: "Success", description: "Song removed from setlist" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (songIds: string[]) => {
      return apiRequest("PUT", `/api/setlists/${setlistId}/songs/reorder`, { songIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
    },
  });

  const updatePositionAssignmentMutation = useMutation({
    mutationFn: async ({ positionId, musicianId }: { positionId: string; musicianId: string | null }) => {
      // Get the latest setlist data from the cache at mutation time
      const currentSetlist = queryClient.getQueryData<SetlistWithSongs>(["/api/setlists", setlistId]);
      const currentAssignments = currentSetlist?.musicians || [];
      
      // Remove any existing assignment for this position, keep others
      const newAssignments = currentAssignments
        .filter(m => m.positionId !== positionId)
        .map(m => ({ musicianId: m.musicianId, positionId: m.positionId || undefined }));
      
      // Add the new assignment if a musician was selected
      if (musicianId) {
        newAssignments.push({ musicianId, positionId });
      }
      
      return apiRequest("PUT", `/api/setlists/${setlistId}/musicians`, { assignments: newAssignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
    },
  });

  const updateWorshipLeaderMutation = useMutation({
    mutationFn: async (songLeaderId: string | null) => {
      // Fetch fresh data directly from API to ensure we have the latest state
      const response = await fetch(`/api/setlists/${setlistId}`);
      if (!response.ok) throw new Error("Failed to fetch setlist");
      const currentSetlist = await response.json() as SetlistWithSongs;
      
      // Use PUT with full setlist data including all required fields
      // Ensure date is properly formatted and isTemplate is numeric
      return apiRequest("PUT", `/api/setlists/${setlistId}`, {
        name: currentSetlist.name,
        date: typeof currentSetlist.date === 'string' ? currentSetlist.date : new Date(currentSetlist.date).toISOString(),
        notes: currentSetlist.notes || null,
        songLeaderId,
        isTemplate: Number(currentSetlist.isTemplate ?? 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      toast({ title: "Success", description: "Worship leader updated" });
    },
  });

  const toggleTeamMemberMutation = useMutation({
    mutationFn: async ({ musicianId, isAssigned }: { musicianId: string; isAssigned: boolean }) => {
      // Fetch fresh data directly from API to prevent stale cache data loss
      const response = await fetch(`/api/setlists/${setlistId}`);
      if (!response.ok) throw new Error("Failed to fetch setlist");
      const currentSetlist = await response.json() as SetlistWithSongs;
      const currentAssignments = currentSetlist.musicians || [];
      
      let newAssignments: Array<{ musicianId: string; positionId?: string }>;
      if (isAssigned) {
        // Check if already assigned (either with or without position)
        const alreadyAssigned = currentAssignments.some(m => m.musicianId === musicianId);
        if (alreadyAssigned) {
          // Already assigned, preserve all existing assignments with proper positionId format
          newAssignments = currentAssignments.map(m => {
            const result: { musicianId: string; positionId?: string } = { musicianId: m.musicianId };
            if (m.positionId) result.positionId = m.positionId;
            return result;
          });
        } else {
          // Add the team member without a position, preserve existing assignments
          newAssignments = currentAssignments.map(m => {
            const result: { musicianId: string; positionId?: string } = { musicianId: m.musicianId };
            if (m.positionId) result.positionId = m.positionId;
            return result;
          });
          newAssignments.push({ musicianId });
        }
      } else {
        // Remove ONLY the team member assignment without a position
        // Keep position-based assignments (those with positionId)
        newAssignments = currentAssignments
          .filter(m => !(m.musicianId === musicianId && !m.positionId))
          .map(m => {
            const result: { musicianId: string; positionId?: string } = { musicianId: m.musicianId };
            if (m.positionId) result.positionId = m.positionId;
            return result;
          });
      }
      
      return apiRequest("PUT", `/api/setlists/${setlistId}/musicians`, { assignments: newAssignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
    },
  });

  const updateBackupSlotsMutation = useMutation({
    mutationFn: async (backupMusicianIds: string[]) => {
      const response = await fetch(`/api/setlists/${setlistId}`);
      if (!response.ok) throw new Error("Failed to fetch setlist");
      const currentSetlist = await response.json() as SetlistWithSongs;
      const currentAssignments = currentSetlist.musicians || [];

      // Keep position-based assignments and non-backup team assignments
      const nonBackupAssignments = currentAssignments.filter(m => {
        if (m.positionId) return true; // Keep all position-based
        const musician = allMusicians.find(mus => mus.id === m.musicianId);
        return musician && musician.teamCategory !== "Backup Singers";
      });

      // Add backup singer assignments (without position)
      const backupAssignments = backupMusicianIds.map(musicianId => ({ musicianId, positionId: undefined as string | undefined }));

      const newAssignments = [...nonBackupAssignments, ...backupAssignments].map(m => {
        const result: { musicianId: string; positionId?: string } = { musicianId: m.musicianId };
        if (m.positionId) result.positionId = m.positionId;
        return result;
      });

      return apiRequest("PUT", `/api/setlists/${setlistId}/musicians`, { assignments: newAssignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
    },
  });

  const updateMediaSlotsMutation = useMutation({
    mutationFn: async (mediaMusicianIds: string[]) => {
      const response = await fetch(`/api/setlists/${setlistId}`);
      if (!response.ok) throw new Error("Failed to fetch setlist");
      const currentSetlist = await response.json() as SetlistWithSongs;
      const currentAssignments = currentSetlist.musicians || [];

      // Keep position-based assignments and non-media team assignments
      const nonMediaAssignments = currentAssignments.filter(m => {
        if (m.positionId) return true; // Keep all position-based
        const musician = allMusicians.find(mus => mus.id === m.musicianId);
        return musician && musician.teamCategory !== "Media";
      });

      // Add media assignments (without position)
      const mediaAssignments = mediaMusicianIds.map(musicianId => ({ musicianId, positionId: undefined as string | undefined }));

      const newAssignments = [...nonMediaAssignments, ...mediaAssignments].map(m => {
        const result: { musicianId: string; positionId?: string } = { musicianId: m.musicianId };
        if (m.positionId) result.positionId = m.positionId;
        return result;
      });

      return apiRequest("PUT", `/api/setlists/${setlistId}/musicians`, { assignments: newAssignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
    },
  });

  const updateDancerSlotsMutation = useMutation({
    mutationFn: async (dancerMusicianIds: string[]) => {
      const response = await fetch(`/api/setlists/${setlistId}`);
      if (!response.ok) throw new Error("Failed to fetch setlist");
      const currentSetlist = await response.json() as SetlistWithSongs;
      const currentAssignments = currentSetlist.musicians || [];

      // Keep position-based assignments and non-dancer team assignments
      const nonDancerAssignments = currentAssignments.filter(m => {
        if (m.positionId) return true; // Keep all position-based
        const musician = allMusicians.find(mus => mus.id === m.musicianId);
        return musician && musician.teamCategory !== "Dancers";
      });

      // Add dancer assignments (without position)
      const dancerAssignments = dancerMusicianIds.map(musicianId => ({ musicianId, positionId: undefined as string | undefined }));

      const newAssignments = [...nonDancerAssignments, ...dancerAssignments].map(m => {
        const result: { musicianId: string; positionId?: string } = { musicianId: m.musicianId };
        if (m.positionId) result.positionId = m.positionId;
        return result;
      });

      return apiRequest("PUT", `/api/setlists/${setlistId}/musicians`, { assignments: newAssignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !setlist) return;

    if (active.id !== over.id) {
      const oldIndex = setlist.songs.findIndex((s) => s.id === active.id);
      const newIndex = setlist.songs.findIndex((s) => s.id === over.id);

      const reordered = [...setlist.songs];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      reorderMutation.mutate(reordered.map((s) => s.id));
    }
  };

  const availableSongs = allSongs.filter(
    (song) => !setlist?.songs.some((ss) => ss.songId === song.id)
  );

  const getAssignedMusician = (positionId: string) => {
    const assignment = setlist?.musicians.find(m => m.positionId === positionId);
    return assignment?.musicianId || "none";
  };

  const isTeamMemberAssigned = (musicianId: string) => {
    // Only check for assignments WITHOUT a position (team-only assignments)
    return setlist?.musicians.some(m => m.musicianId === musicianId && !m.positionId) || false;
  };

  // Filter musicians to only show Band Musicians for positions
  const bandMusicians = allMusicians.filter(m => m.teamCategory === "Band Musicians");
  
  // Filter other team members
  const backupSingers = allMusicians.filter(m => m.teamCategory === "Backup Singers");
  const mediaTeam = allMusicians.filter(m => m.teamCategory === "Media");
  const dancers = allMusicians.filter(m => m.teamCategory === "Dancers");
  
  // Get worship leader's first name
  const getFirstName = (fullName: string) => fullName.split(' ')[0];

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!setlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Setlist not found</h2>
          <Link href="/setlists">
            <Button>Back to Setlists</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/setlists">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-semibold" data-testid="text-setlist-name">
              {setlist.songLeader ? `${getFirstName(setlist.songLeader.name)}'s ${setlist.name}` : setlist.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(setlist.date), "EEEE, MMMM d, yyyy")}
              </div>
              {setlist.songLeader && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {setlist.songLeader.name}
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => setLocation(`/setlists/${setlistId}/present`)}
            data-testid="button-present"
          >
            <Presentation className="mr-2 h-4 w-4" />
            Present
          </Button>
        </div>

        {setlist.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{setlist.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MusicIcon className="h-5 w-5" />
                    Songs ({setlist.songs.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Popover open={songSelectOpen} onOpenChange={setSongSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={songSelectOpen}
                        className="flex-1 justify-between"
                        data-testid="select-song"
                      >
                        {selectedSongId
                          ? (() => {
                              const song = availableSongs.find((s) => s.id === selectedSongId);
                              return song ? `${song.title} - ${song.artist}` : "Select a song to add";
                            })()
                          : "Select a song to add"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0">
                      <Command>
                        <CommandInput placeholder="Search songs..." />
                        <CommandList>
                          <CommandEmpty>No songs found.</CommandEmpty>
                          <CommandGroup>
                            {availableSongs.map((song) => (
                              <CommandItem
                                key={song.id}
                                value={`${song.title} - ${song.artist}`}
                                onSelect={() => {
                                  setSelectedSongId(song.id);
                                  setSelectedKey(song.originalKey);
                                  setSongSelectOpen(false);
                                }}
                                data-testid={`option-song-${song.id}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSongId === song.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {song.title} - {song.artist}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedSongId && (
                    <Select value={selectedKey} onValueChange={setSelectedKey}>
                      <SelectTrigger className="w-32" data-testid="select-transpose-key">
                        <SelectValue placeholder="Key" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllKeys().map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button
                    onClick={() => selectedSongId && addSongMutation.mutate({ 
                      songId: selectedSongId,
                      transposedKey: selectedKey 
                    })}
                    disabled={!selectedSongId || addSongMutation.isPending}
                    data-testid="button-add-song"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                {setlist.songs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MusicIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No songs in this setlist yet</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={setlist.songs.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {setlist.songs.map((setlistSong) => (
                          <SortableSongItem
                            key={setlistSong.id}
                            setlistSong={setlistSong}
                            onRemove={() => removeSongMutation.mutate(setlistSong.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Worship Leader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={setlist.songLeaderId || "none"}
                  onValueChange={(leaderId) => {
                    updateWorshipLeaderMutation.mutate(leaderId === "none" ? null : leaderId);
                  }}
                >
                  <SelectTrigger data-testid="select-worship-leader">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {allSongLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Musicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div key={position.id} className="space-y-1">
                      <label className="text-sm font-medium">{position.name}</label>
                      <Select
                        value={getAssignedMusician(position.id)}
                        onValueChange={(musicianId) => {
                          updatePositionAssignmentMutation.mutate({
                            positionId: position.id,
                            musicianId: musicianId === "none" ? null : musicianId
                          });
                        }}
                      >
                        <SelectTrigger data-testid={`select-position-${position.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {bandMusicians.map((musician) => (
                            <SelectItem key={musician.id} value={musician.id}>
                              {musician.name}
                              {musician.instrument && ` - ${musician.instrument}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {bandMusicians.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Link href="/musicians">
                        <Button variant="outline" size="sm">
                          Add Band Musicians
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Backup Singers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((slotNumber) => {
                    const assignedBackups = (setlist?.musicians || [])
                      .filter(m => !m.positionId && backupSingers.find(s => s.id === m.musicianId))
                      .map(m => m.musicianId);
                    const currentAssignment = assignedBackups[slotNumber - 1];
                    
                    return (
                      <div key={slotNumber} className="space-y-1">
                        <label className="text-sm font-medium">Backup {slotNumber}</label>
                        <Select
                          value={currentAssignment || "none"}
                          onValueChange={(musicianId) => {
                            const newAssignments = [...assignedBackups];
                            if (musicianId === "none") {
                              newAssignments.splice(slotNumber - 1, 1);
                            } else {
                              newAssignments[slotNumber - 1] = musicianId;
                            }
                            updateBackupSlotsMutation.mutate(newAssignments.filter(Boolean));
                          }}
                        >
                          <SelectTrigger data-testid={`select-backup-${slotNumber}`}>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {backupSingers.map((singer) => (
                              <SelectItem 
                                key={singer.id} 
                                value={singer.id}
                                disabled={assignedBackups.includes(singer.id) && assignedBackups[slotNumber - 1] !== singer.id}
                              >
                                {singer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {backupSingers.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Link href="/musicians">
                        <Button variant="outline" size="sm">
                          Add Backup Singers
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((slotNumber) => {
                    const assignedMedia = (setlist?.musicians || [])
                      .filter(m => !m.positionId && mediaTeam.find(mt => mt.id === m.musicianId))
                      .map(m => m.musicianId);
                    const currentAssignment = assignedMedia[slotNumber - 1];
                    
                    return (
                      <div key={slotNumber} className="space-y-1">
                        <label className="text-sm font-medium">Media {slotNumber}</label>
                        <Select
                          value={currentAssignment || "none"}
                          onValueChange={(musicianId) => {
                            const newAssignments = [...assignedMedia];
                            if (musicianId === "none") {
                              newAssignments.splice(slotNumber - 1, 1);
                            } else {
                              newAssignments[slotNumber - 1] = musicianId;
                            }
                            updateMediaSlotsMutation.mutate(newAssignments.filter(Boolean));
                          }}
                        >
                          <SelectTrigger data-testid={`select-media-${slotNumber}`}>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {mediaTeam.map((member) => (
                              <SelectItem 
                                key={member.id} 
                                value={member.id}
                                disabled={assignedMedia.includes(member.id) && assignedMedia[slotNumber - 1] !== member.id}
                              >
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {mediaTeam.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Link href="/musicians">
                        <Button variant="outline" size="sm">
                          Add Media Team
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Dancers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((slotNumber) => {
                    const assignedDancers = (setlist?.musicians || [])
                      .filter(m => !m.positionId && dancers.find(d => d.id === m.musicianId))
                      .map(m => m.musicianId);
                    const currentAssignment = assignedDancers[slotNumber - 1];
                    
                    return (
                      <div key={slotNumber} className="space-y-1">
                        <label className="text-sm font-medium">Dancer {slotNumber}</label>
                        <Select
                          value={currentAssignment || "none"}
                          onValueChange={(musicianId) => {
                            const newAssignments = [...assignedDancers];
                            if (musicianId === "none") {
                              newAssignments.splice(slotNumber - 1, 1);
                            } else {
                              newAssignments[slotNumber - 1] = musicianId;
                            }
                            updateDancerSlotsMutation.mutate(newAssignments.filter(Boolean));
                          }}
                        >
                          <SelectTrigger data-testid={`select-dancer-${slotNumber}`}>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {dancers.map((dancer) => (
                              <SelectItem 
                                key={dancer.id} 
                                value={dancer.id}
                                disabled={assignedDancers.includes(dancer.id) && assignedDancers[slotNumber - 1] !== dancer.id}
                              >
                                {dancer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {dancers.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Link href="/musicians">
                        <Button variant="outline" size="sm">
                          Add Dancers
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
