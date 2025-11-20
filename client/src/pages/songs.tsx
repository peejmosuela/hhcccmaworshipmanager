import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Music2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddEditSongDialog } from "@/components/add-edit-song-dialog";
import { SongDetailDialog } from "@/components/song-detail-dialog";
import { AddToSetlistDialog } from "@/components/add-to-setlist-dialog";
import type { Song } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SongsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [songToAddToSetlist, setSongToAddToSetlist] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const { toast } = useToast();

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/songs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({
        title: "Success",
        description: "Song deleted successfully",
      });
      setSongToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive",
      });
    },
  });

  const filteredSongs = songs.filter((song) => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Sort alphabetically when in list view
  const displaySongs = viewMode === "list"
    ? [...filteredSongs].sort((a, b) => a.title.localeCompare(b.title))
    : filteredSongs;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium">Songs</h1>
            <p className="text-muted-foreground mt-1">Manage your worship song library</p>
          </div>
          <AddEditSongDialog song={songToEdit} onClose={() => setSongToEdit(null)}>
            <Button data-testid="button-add-song">
              <Plus className="mr-2 h-4 w-4" />
              Add Song
            </Button>
          </AddEditSongDialog>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs by title, artist, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-songs"
            />
          </div>
          <div className="flex gap-1 border rounded-md p-1">
            <Toggle
              pressed={viewMode === "card"}
              onPressedChange={() => setViewMode("card")}
              aria-label="Card view"
              data-testid="button-card-view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={viewMode === "list"}
              onPressedChange={() => setViewMode("list")}
              aria-label="List view"
              data-testid="button-list-view"
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displaySongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Music2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "No songs found" : "No songs yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Get started by adding your first worship song"}
            </p>
            {!searchQuery && (
              <AddEditSongDialog>
                <Button data-testid="button-add-first-song">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Song
                </Button>
              </AddEditSongDialog>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {displaySongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-4 bg-card border rounded-lg hover-elevate"
                data-testid={`list-song-${song.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg" data-testid={`text-song-title-${song.id}`}>
                    {song.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {song.artist || "Unknown Artist"}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSong(song)}
                    data-testid={`button-view-${song.id}`}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSongToAddToSetlist(song)}
                    data-testid={`button-add-to-setlist-${song.id}`}
                  >
                    Add to Setlist
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSongToEdit(song)}
                    data-testid={`button-edit-${song.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSongToDelete(song)}
                    data-testid={`button-delete-${song.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySongs.map((song) => (
              <Card key={song.id} className="hover-elevate" data-testid={`card-song-${song.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1 truncate" data-testid={`text-song-title-${song.id}`}>
                        {song.title}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {song.artist || "Unknown Artist"} • Key of {song.originalKey}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {song.tags && song.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {song.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs" data-testid={`badge-tag-${tag}`}>
                          {tag}
                        </Badge>
                      ))}
                      {song.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{song.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedSong(song)}
                      data-testid={`button-view-${song.id}`}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSongToAddToSetlist(song)}
                      data-testid={`button-add-to-setlist-${song.id}`}
                    >
                      Add to Setlist
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSongToEdit(song)}
                      data-testid={`button-edit-${song.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSongToDelete(song)}
                      data-testid={`button-delete-${song.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedSong && (
        <SongDetailDialog
          song={selectedSong}
          open={!!selectedSong}
          onClose={() => setSelectedSong(null)}
          onEdit={() => {
            setSongToEdit(selectedSong);
            setSelectedSong(null);
          }}
        />
      )}

      {songToAddToSetlist && (
        <AddToSetlistDialog
          song={songToAddToSetlist}
          open={!!songToAddToSetlist}
          onClose={() => setSongToAddToSetlist(null)}
        />
      )}

      <AlertDialog open={!!songToDelete} onOpenChange={(open) => !open && setSongToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Song?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{songToDelete?.title}"? This will permanently remove the song and all its associations from setlists. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete" disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => songToDelete && deleteMutation.mutate(songToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
