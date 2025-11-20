import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Setlist, type Song, type Musician, type SongLeader, type SetlistSong } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Plus, Trash2, GripVertical, Calendar, User, 
  Music as MusicIcon, Users, Presentation 
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

interface SetlistWithSongs extends Setlist {
  songs: SetlistSongWithSong[];
  songLeader?: SongLeader;
  musicians: Array<{ id: string; musicianId: string; musician: Musician }>;
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

  const { data: setlist, isLoading } = useQuery<SetlistWithSongs>({
    queryKey: ["/api/setlists", setlistId],
  });

  const { data: allSongs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { data: allMusicians = [] } = useQuery<Musician[]>({
    queryKey: ["/api/musicians"],
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

  const updateMusiciansMutation = useMutation({
    mutationFn: async (musicianIds: string[]) => {
      return apiRequest("PUT", `/api/setlists/${setlistId}/musicians`, { musicianIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      toast({ title: "Success", description: "Musicians updated" });
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

  const selectedMusicianIds = setlist?.musicians.map((m) => m.musicianId) || [];

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
              {setlist.name}
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
                  <Select 
                    value={selectedSongId} 
                    onValueChange={(songId) => {
                      setSelectedSongId(songId);
                      const song = availableSongs.find(s => s.id === songId);
                      if (song) {
                        setSelectedKey(song.originalKey);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1" data-testid="select-song">
                      <SelectValue placeholder="Select a song to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSongs.map((song) => (
                        <SelectItem key={song.id} value={song.id} data-testid={`option-song-${song.id}`}>
                          {song.title} - {song.artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
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
                  <Users className="h-5 w-5" />
                  Musicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allMusicians.map((musician) => (
                    <label
                      key={musician.id}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded hover-elevate"
                      data-testid={`checkbox-musician-${musician.id}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selectedMusicianIds.includes(musician.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...selectedMusicianIds, musician.id]
                            : selectedMusicianIds.filter((id) => id !== musician.id);
                          updateMusiciansMutation.mutate(newIds);
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{musician.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {musician.instrument}
                        </div>
                      </div>
                    </label>
                  ))}
                  {allMusicians.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Link href="/musicians">
                        <Button variant="outline" size="sm">
                          Add Musicians
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
