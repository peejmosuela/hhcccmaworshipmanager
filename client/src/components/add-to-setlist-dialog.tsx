import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Song, Setlist } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AddToSetlistDialogProps {
  song: Song;
  open: boolean;
  onClose: () => void;
}

export function AddToSetlistDialog({ song, open, onClose }: AddToSetlistDialogProps) {
  const [selectedSetlistId, setSelectedSetlistId] = useState<string>("");
  const { toast } = useToast();

  const { data: setlists = [], isLoading } = useQuery<Setlist[]>({
    queryKey: ["/api/setlists"],
    enabled: open,
  });

  const addToSetlistMutation = useMutation({
    mutationFn: async (setlistId: string) => {
      return apiRequest("POST", `/api/setlists/${setlistId}/songs`, {
        songId: song.id,
      });
    },
    onSuccess: (_, setlistId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/setlists", setlistId] });
      toast({
        title: "Success",
        description: `"${song.title}" added to setlist`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add song to setlist",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    if (selectedSetlistId) {
      addToSetlistMutation.mutate(selectedSetlistId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Setlist</DialogTitle>
          <DialogDescription>
            Add "{song.title}" to an existing setlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : setlists.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No setlists available</p>
              <Button variant="outline" onClick={onClose} data-testid="button-close-add-to-setlist">
                Create a setlist first
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Setlist</Label>
                <Select value={selectedSetlistId} onValueChange={setSelectedSetlistId}>
                  <SelectTrigger data-testid="select-setlist">
                    <SelectValue placeholder="Choose a setlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {setlists.map((setlist) => (
                      <SelectItem key={setlist.id} value={setlist.id}>
                        {setlist.name} - {new Date(setlist.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} data-testid="button-cancel-add-to-setlist">
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!selectedSetlistId || addToSetlistMutation.isPending}
                  data-testid="button-confirm-add-to-setlist"
                >
                  {addToSetlistMutation.isPending ? "Adding..." : "Add to Setlist"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
