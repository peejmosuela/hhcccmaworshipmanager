import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import type { Setlist, Song, SongLeader, Musician } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SetlistDetailDialogProps {
  setlist: Setlist;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

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

interface SortableSongItemProps {
  setlistSong: SetlistSongWithSong;
  index: number;
  onRemove: (id: string) => void;
}

function SortableSongItem({ setlistSong, index, onRemove }: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setlistSong.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4"
      data-testid={`card-setlist-song-${setlistSong.id}`}
    >
      <div className="flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover-elevate p-2 rounded"
          data-testid={`drag-handle-${setlistSong.id}`}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="text-lg font-medium text-muted-foreground w-8">
          {index + 1}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{setlistSong.song.title}</h4>
          <p className="text-sm text-muted-foreground">
            {setlistSong.song.artist || "Unknown"} • {setlistSong.transposedKey || setlistSong.song.originalKey}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(setlistSong.id)}
          data-testid={`button-remove-song-${setlistSong.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export function SetlistDetailDialog({ setlist, open, onClose, onEdit }: SetlistDetailDialogProps) {
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState("");
  const { toast } = useToast();

  const { data: setlistDetails, isLoading } = useQuery<SetlistWithSongs>({
    queryKey: ["/api/setlists", setlist.id],
    enabled: open,
  });

  const { data: allSongs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
    enabled: showAddSong,
  });

  const { data: allMusicians = [] } = useQuery<Musician[]>({
    queryKey: ["/api/musicians"],
    enabled: open,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      return apiRequest("POST", `/api/setlists/${setlist.id}/songs`, { songId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlist.id] });
      setShowAddSong(false);
      setSelectedSongId("");
      toast({ title: "Success", description: "Song added to setlist" });
    },
  });

  const removeSongMutation = useMutation({
    mutationFn: async (setlistSongId: string) => {
      return apiRequest("DELETE", `/api/setlists/${setlist.id}/songs/${setlistSongId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlist.id] });
      toast({ title: "Success", description: "Song removed from setlist" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (songIds: string[]) => {
      return apiRequest("PUT", `/api/setlists/${setlist.id}/songs/reorder`, { songIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlist.id] });
    },
  });

  const updateMusiciansMutation = useMutation({
    mutationFn: async (musicianIds: string[]) => {
      return apiRequest("PUT", `/api/setlists/${setlist.id}/musicians`, { musicianIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlist.id] });
      toast({ title: "Success", description: "Musicians updated" });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !setlistDetails) return;

    if (active.id !== over.id) {
      const sortedSongs = [...setlistDetails.songs].sort((a, b) => a.order - b.order);
      const oldIndex = sortedSongs.findIndex((s) => s.id === active.id);
      const newIndex = sortedSongs.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sortedSongs, oldIndex, newIndex);
      const songIds = newOrder.map(s => s.id);

      // Optimistically update UI
      queryClient.setQueryData(["/api/setlists", setlist.id], {
        ...setlistDetails,
        songs: newOrder.map((song, index) => ({ ...song, order: index })),
      });

      reorderMutation.mutate(songIds);
    }
  };

  const availableSongs = allSongs.filter(
    song => !setlistDetails?.songs.some(s => s.songId === song.id)
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!setlistDetails) return null;

  const sortedSongs = [...setlistDetails.songs].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl" data-testid="text-setlist-detail-name">
                {setlistDetails.name}
              </DialogTitle>
              <p className="text-muted-foreground mt-1">
                {new Date(setlistDetails.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {setlistDetails.songLeader && (
                <Badge variant="secondary" className="mt-2">
                  Leader: {setlistDetails.songLeader.name}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-setlist-detail">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Songs ({setlistDetails.songs.length})</h3>
              {!showAddSong ? (
                <Button size="sm" onClick={() => setShowAddSong(true)} data-testid="button-show-add-song">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Song
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowAddSong(false)} data-testid="button-hide-add-song">
                  Cancel
                </Button>
              )}
            </div>

            {showAddSong && (
              <Card className="p-4 mb-4">
                <div className="flex gap-2">
                  <Select value={selectedSongId} onValueChange={setSelectedSongId}>
                    <SelectTrigger data-testid="select-add-song">
                      <SelectValue placeholder="Select a song" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSongs.map((song) => (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title} - {song.originalKey}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => selectedSongId && addSongMutation.mutate(selectedSongId)}
                    disabled={!selectedSongId || addSongMutation.isPending}
                    data-testid="button-confirm-add-song"
                  >
                    Add
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {sortedSongs.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No songs in this setlist yet</p>
                </Card>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedSongs.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedSongs.map((setlistSong, index) => (
                      <SortableSongItem
                        key={setlistSong.id}
                        setlistSong={setlistSong}
                        index={index}
                        onRemove={(id) => removeSongMutation.mutate(id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Musicians</h3>
            <Card className="p-4">
              {allMusicians.length === 0 ? (
                <p className="text-muted-foreground text-sm">No musicians available. Add them in the Musicians page.</p>
              ) : (
                <div className="space-y-3">
                  {allMusicians.map((musician) => {
                    const isAssigned = setlistDetails.musicians.some(m => m.musicianId === musician.id);
                    return (
                      <div key={musician.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`musician-${musician.id}`}
                          checked={isAssigned}
                          onCheckedChange={() => {
                            const current = new Set(setlistDetails.musicians.map(m => m.musicianId));
                            if (current.has(musician.id)) {
                              current.delete(musician.id);
                            } else {
                              current.add(musician.id);
                            }
                            updateMusiciansMutation.mutate(Array.from(current));
                          }}
                          data-testid={`checkbox-musician-${musician.id}`}
                        />
                        <label
                          htmlFor={`musician-${musician.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          {musician.name} {musician.instrument && `- ${musician.instrument}`}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {setlistDetails.notes && (
            <div>
              <h3 className="font-medium mb-2">Notes</h3>
              <Card className="p-4">
                <p className="text-sm whitespace-pre-wrap">{setlistDetails.notes}</p>
              </Card>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button onClick={onEdit} data-testid="button-edit-setlist-from-detail">
            Edit Setlist Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
