import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { insertMusicianSchema, insertSongLeaderSchema, type Musician, type SongLeader, type InsertMusician, type InsertSongLeader } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function MusiciansPage() {
  const [musicianToEdit, setMusicianToEdit] = useState<Musician | null>(null);
  const [leaderToEdit, setLeaderToEdit] = useState<SongLeader | null>(null);
  const [musicianToDelete, setMusicianToDelete] = useState<Musician | null>(null);
  const [leaderToDelete, setLeaderToDelete] = useState<SongLeader | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-6">
        <h1 className="text-3xl font-medium">Musicians & Leaders</h1>
        <p className="text-muted-foreground mt-1">Manage your worship team members</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="band" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="band" data-testid="tab-band-musicians">Band</TabsTrigger>
            <TabsTrigger value="leaders" data-testid="tab-leaders">Worship Leader</TabsTrigger>
            <TabsTrigger value="media" data-testid="tab-media">Media</TabsTrigger>
            <TabsTrigger value="singers" data-testid="tab-singers">Singers</TabsTrigger>
            <TabsTrigger value="dancers" data-testid="tab-dancers">Dancers</TabsTrigger>
          </TabsList>

          <TabsContent value="band" className="mt-6">
            <MusiciansTab
              musicianToEdit={musicianToEdit}
              setMusicianToEdit={setMusicianToEdit}
              musicianToDelete={musicianToDelete}
              setMusicianToDelete={setMusicianToDelete}
              category="Band Musicians"
            />
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <MusiciansTab
              musicianToEdit={musicianToEdit}
              setMusicianToEdit={setMusicianToEdit}
              musicianToDelete={musicianToDelete}
              setMusicianToDelete={setMusicianToDelete}
              category="Media"
            />
          </TabsContent>

          <TabsContent value="singers" className="mt-6">
            <MusiciansTab
              musicianToEdit={musicianToEdit}
              setMusicianToEdit={setMusicianToEdit}
              musicianToDelete={musicianToDelete}
              setMusicianToDelete={setMusicianToDelete}
              category="Backup Singers"
            />
          </TabsContent>

          <TabsContent value="dancers" className="mt-6">
            <MusiciansTab
              musicianToEdit={musicianToEdit}
              setMusicianToEdit={setMusicianToEdit}
              musicianToDelete={musicianToDelete}
              setMusicianToDelete={setMusicianToDelete}
              category="Dancers"
            />
          </TabsContent>

          <TabsContent value="leaders" className="mt-6">
            <SongLeadersTab
              leaderToEdit={leaderToEdit}
              setLeaderToEdit={setLeaderToEdit}
              leaderToDelete={leaderToDelete}
              setLeaderToDelete={setLeaderToDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface MusiciansTabProps {
  musicianToEdit: Musician | null;
  setMusicianToEdit: (m: Musician | null) => void;
  musicianToDelete: Musician | null;
  setMusicianToDelete: (m: Musician | null) => void;
  category: "Band Musicians" | "Media" | "Backup Singers" | "Dancers";
}

function MusiciansTab({ musicianToEdit, setMusicianToEdit, musicianToDelete, setMusicianToDelete, category }: MusiciansTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: allMusicians = [], isLoading } = useQuery<Musician[]>({
    queryKey: ["/api/musicians"],
  });

  const musicians = allMusicians.filter(m => m.teamCategory === category);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/musicians/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/musicians"] });
      toast({ title: "Success", description: "Musician deleted" });
      setMusicianToDelete(null);
    },
  });

  const categoryLabels = {
    "Band Musicians": "Band Musicians",
    "Media": "Media Team Members",
    "Backup Singers": "Backup Singers",
    "Dancers": "Dancers"
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">{categoryLabels[category]}</h2>
        <Button onClick={() => { setMusicianToEdit(null); setShowDialog(true); }} data-testid="button-add-musician">
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : musicians.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No team members yet</h3>
          <p className="text-muted-foreground mb-4">Add members to your {category.toLowerCase()} team</p>
          <Button onClick={() => setShowDialog(true)} data-testid="button-add-first-musician">
            <Plus className="mr-2 h-4 w-4" />
            Add First Member
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {musicians.map((musician) => (
            <Card key={musician.id} data-testid={`card-musician-${musician.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{musician.name}</CardTitle>
                    {musician.instrument && (
                      <p className="text-sm text-muted-foreground mt-1">{musician.instrument}</p>
                    )}
                    {musician.contact && (
                      <p className="text-xs text-muted-foreground mt-1">{musician.contact}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setMusicianToEdit(musician); setShowDialog(true); }}
                      data-testid={`button-edit-musician-${musician.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMusicianToDelete(musician)}
                      data-testid={`button-delete-musician-${musician.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <MusicianDialog
        musician={musicianToEdit}
        open={showDialog}
        onClose={() => { setShowDialog(false); setMusicianToEdit(null); }}
        category={category}
      />

      <AlertDialog open={!!musicianToDelete} onOpenChange={(open) => !open && setMusicianToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Musician</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {musicianToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-musician">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => musicianToDelete && deleteMutation.mutate(musicianToDelete.id)}
              data-testid="button-confirm-delete-musician"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SongLeadersTabProps {
  leaderToEdit: SongLeader | null;
  setLeaderToEdit: (l: SongLeader | null) => void;
  leaderToDelete: SongLeader | null;
  setLeaderToDelete: (l: SongLeader | null) => void;
}

function SongLeadersTab({ leaderToEdit, setLeaderToEdit, leaderToDelete, setLeaderToDelete }: SongLeadersTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: leaders = [], isLoading } = useQuery<SongLeader[]>({
    queryKey: ["/api/song-leaders"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/song-leaders/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/song-leaders"] });
      toast({ title: "Success", description: "Song leader deleted" });
      setLeaderToDelete(null);
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Song Leaders</h2>
        <Button onClick={() => { setLeaderToEdit(null); setShowDialog(true); }} data-testid="button-add-leader">
          <Plus className="mr-2 h-4 w-4" />
          Add Song Leader
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No song leaders yet</h3>
          <p className="text-muted-foreground mb-4">Add worship leaders for your services</p>
          <Button onClick={() => setShowDialog(true)} data-testid="button-add-first-leader">
            <Plus className="mr-2 h-4 w-4" />
            Add First Leader
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map((leader) => (
            <Card key={leader.id} data-testid={`card-leader-${leader.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{leader.name}</CardTitle>
                    {leader.contact && (
                      <p className="text-xs text-muted-foreground mt-1">{leader.contact}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setLeaderToEdit(leader); setShowDialog(true); }}
                      data-testid={`button-edit-leader-${leader.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLeaderToDelete(leader)}
                      data-testid={`button-delete-leader-${leader.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <SongLeaderDialog
        leader={leaderToEdit}
        open={showDialog}
        onClose={() => { setShowDialog(false); setLeaderToEdit(null); }}
      />

      <AlertDialog open={!!leaderToDelete} onOpenChange={(open) => !open && setLeaderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Song Leader</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {leaderToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-leader">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaderToDelete && deleteMutation.mutate(leaderToDelete.id)}
              data-testid="button-confirm-delete-leader"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MusicianDialog({ musician, open, onClose, category }: { musician: Musician | null; open: boolean; onClose: () => void; category: "Band Musicians" | "Media" | "Backup Singers" | "Dancers" }) {
  const { toast } = useToast();
  const form = useForm<InsertMusician>({
    resolver: zodResolver(insertMusicianSchema),
    defaultValues: {
      name: musician?.name || "",
      instrument: musician?.instrument || "",
      contact: musician?.contact || "",
      teamCategory: musician?.teamCategory || category,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMusician) => apiRequest("POST", "/api/musicians", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/musicians"] });
      toast({ title: "Success", description: "Musician added" });
      form.reset();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertMusician) => apiRequest("PUT", `/api/musicians/${musician?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/musicians"] });
      toast({ title: "Success", description: "Musician updated" });
      onClose();
    },
  });

  const onSubmit = (data: InsertMusician) => {
    if (musician) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{musician ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-musician-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {category === "Band Musicians" && (
              <FormField
                control={form.control}
                name="instrument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Guitar, Piano, Drums..." data-testid="input-musician-instrument" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Email or phone" data-testid="input-musician-contact" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-musician">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-musician">
                {musician ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SongLeaderDialog({ leader, open, onClose }: { leader: SongLeader | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const form = useForm<InsertSongLeader>({
    resolver: zodResolver(insertSongLeaderSchema),
    defaultValues: {
      name: leader?.name || "",
      contact: leader?.contact || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSongLeader) => apiRequest("POST", "/api/song-leaders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/song-leaders"] });
      toast({ title: "Success", description: "Song leader added" });
      form.reset();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSongLeader) => apiRequest("PUT", `/api/song-leaders/${leader?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/song-leaders"] });
      toast({ title: "Success", description: "Song leader updated" });
      onClose();
    },
  });

  const onSubmit = (data: InsertSongLeader) => {
    if (leader) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{leader ? "Edit Song Leader" : "Add Song Leader"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-leader-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Email or phone" data-testid="input-leader-contact" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-leader">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-leader">
                {leader ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
