import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Calendar, User, Music, Edit, Presentation, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEditSetlistDialog } from "@/components/add-edit-setlist-dialog";
import { SetlistDetailDialog } from "@/components/setlist-detail-dialog";
import type { Setlist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SetlistsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [setlistToEdit, setSetlistToEdit] = useState<Setlist | null>(null);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);

  const { data: setlists = [], isLoading } = useQuery<Setlist[]>({
    queryKey: ["/api/setlists"],
  });

  const duplicateMutation = useMutation({
    mutationFn: async (setlistId: string) => {
      return apiRequest("POST", `/api/setlists/${setlistId}/duplicate`, {
        name: undefined,
        date: undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists"] });
      toast({
        title: "Success",
        description: "Setlist duplicated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate setlist",
        variant: "destructive",
      });
    },
  });

  const sortedSetlists = [...setlists].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium">Setlists</h1>
            <p className="text-muted-foreground mt-1">Plan and manage worship service setlists</p>
          </div>
          <AddEditSetlistDialog setlist={setlistToEdit} onClose={() => setSetlistToEdit(null)}>
            <Button data-testid="button-add-setlist">
              <Plus className="mr-2 h-4 w-4" />
              Create Setlist
            </Button>
          </AddEditSetlistDialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
        ) : setlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Music className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No setlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first setlist to plan a worship service
            </p>
            <AddEditSetlistDialog>
              <Button data-testid="button-add-first-setlist">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Setlist
              </Button>
            </AddEditSetlistDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSetlists.map((setlist) => (
              <Card key={setlist.id} className="hover-elevate" data-testid={`card-setlist-${setlist.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-setlist-name-${setlist.id}`}>
                        {setlist.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(setlist.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    {setlist.isTemplate === 1 && (
                      <Badge variant="secondary" data-testid={`badge-template-${setlist.id}`}>
                        Template
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {setlist.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {setlist.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedSetlist(setlist)}
                      data-testid={`button-view-setlist-${setlist.id}`}
                    >
                      View & Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLocation(`/setlists/${setlist.id}/present`)}
                      data-testid={`button-present-setlist-${setlist.id}`}
                    >
                      <Presentation className="mr-2 h-4 w-4" />
                      Present
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => duplicateMutation.mutate(setlist.id)}
                      disabled={duplicateMutation.isPending}
                      data-testid={`button-duplicate-setlist-${setlist.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSetlistToEdit(setlist)}
                      data-testid={`button-edit-setlist-${setlist.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedSetlist && (
        <SetlistDetailDialog
          setlist={selectedSetlist}
          open={!!selectedSetlist}
          onClose={() => setSelectedSetlist(null)}
          onEdit={() => {
            setSetlistToEdit(selectedSetlist);
            setSelectedSetlist(null);
          }}
        />
      )}
    </div>
  );
}
