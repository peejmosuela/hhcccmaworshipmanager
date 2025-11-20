import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { insertSetlistSchema, type Setlist, type InsertSetlist, type SongLeader } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { z } from "zod";

interface AddEditSetlistDialogProps {
  setlist?: Setlist | null;
  children?: React.ReactNode;
  onClose?: () => void;
}

const formSchema = insertSetlistSchema.extend({
  date: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function AddEditSetlistDialog({ setlist, children, onClose }: AddEditSetlistDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: songLeaders = [] } = useQuery<SongLeader[]>({
    queryKey: ["/api/song-leaders"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: setlist?.name || "",
      date: setlist?.date ? new Date(setlist.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      songLeaderId: setlist?.songLeaderId || "none",
      notes: setlist?.notes || "",
      isTemplate: setlist?.isTemplate || 0,
    },
  });

  useEffect(() => {
    if (setlist) {
      form.reset({
        name: setlist.name,
        date: new Date(setlist.date).toISOString().split('T')[0],
        songLeaderId: setlist.songLeaderId || "none",
        notes: setlist.notes || "",
        isTemplate: setlist.isTemplate || 0,
      });
      setOpen(true);
    }
  }, [setlist, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: InsertSetlist = {
        ...data,
        date: new Date(data.date),
        songLeaderId: (data.songLeaderId && data.songLeaderId !== "none") ? data.songLeaderId : null,
        notes: data.notes || null,
      };
      return apiRequest("POST", "/api/setlists", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists"] });
      toast({
        title: "Success",
        description: "Setlist created successfully",
      });
      form.reset();
      setOpen(false);
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create setlist",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: InsertSetlist = {
        ...data,
        date: new Date(data.date),
        songLeaderId: (data.songLeaderId && data.songLeaderId !== "none") ? data.songLeaderId : null,
        notes: data.notes || null,
      };
      return apiRequest("PUT", `/api/setlists/${setlist?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setlists"] });
      toast({
        title: "Success",
        description: "Setlist updated successfully",
      });
      setOpen(false);
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setlist",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (setlist) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      if (!setlist) {
        form.reset();
      }
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{setlist ? "Edit Setlist" : "Create New Setlist"}</DialogTitle>
          <DialogDescription>
            {setlist 
              ? "Update setlist details" 
              : "Create a new setlist for a worship service"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setlist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sunday Morning Service" {...field} data-testid="input-setlist-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-setlist-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="songLeaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Leader</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-song-leader">
                          <SelectValue placeholder="Select leader" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {songLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Manage leaders in Musicians page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Service notes, theme, special instructions..."
                      className="min-h-24"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-setlist-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isTemplate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Save as Template</FormLabel>
                    <FormDescription className="text-xs">
                      Mark this setlist as a template that can be reused for future services
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 1}
                      onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                      data-testid="switch-is-template"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                data-testid="button-cancel-setlist"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-setlist"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : setlist ? "Update Setlist" : "Create Setlist"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
