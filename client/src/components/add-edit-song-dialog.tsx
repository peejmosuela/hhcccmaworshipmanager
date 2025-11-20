import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertSongSchema, type Song, type InsertSong } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAllKeys } from "@/lib/chordUtils";
import { useState, useEffect } from "react";
import { z } from "zod";

// Form schema that accepts tags as string (will convert to array on submit)
const songFormSchema = insertSongSchema.extend({
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

type SongFormData = z.infer<typeof songFormSchema>;

interface AddEditSongDialogProps {
  song?: Song | null;
  children?: React.ReactNode;
  onClose?: () => void;
}

export function AddEditSongDialog({ song, children, onClose }: AddEditSongDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SongFormData>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: song?.title || "",
      artist: song?.artist || "",
      originalKey: song?.originalKey || "C",
      lyrics: song?.lyrics || "",
      tags: song?.tags?.join(", ") || "",
      arrangement: song?.arrangement || "",
    },
  });

  useEffect(() => {
    if (song) {
      form.reset({
        title: song.title,
        artist: song.artist || "",
        originalKey: song.originalKey,
        lyrics: song.lyrics,
        tags: song.tags?.join(", ") || "",
        arrangement: song.arrangement || "",
      });
      setOpen(true);
    }
  }, [song, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSong) => {
      return apiRequest("POST", "/api/songs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({
        title: "Success",
        description: "Song added successfully",
      });
      form.reset();
      setOpen(false);
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add song",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSong) => {
      return apiRequest("PUT", `/api/songs/${song?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({
        title: "Success",
        description: "Song updated successfully",
      });
      setOpen(false);
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update song",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SongFormData) => {
    const tagsArray = typeof data.tags === "string" 
      ? data.tags.split(",").map(t => t.trim()).filter(Boolean)
      : data.tags || [];

    const formData: InsertSong = {
      title: data.title,
      artist: data.artist,
      originalKey: data.originalKey,
      lyrics: data.lyrics,
      tags: tagsArray,
      arrangement: data.arrangement || null,
    };

    if (song) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      if (!song) {
        form.reset();
      }
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{song ? "Edit Song" : "Add New Song"}</DialogTitle>
          <DialogDescription>
            {song 
              ? "Update the song details below" 
              : "Paste lyrics with chords on separate lines above the lyrics. Chords will be automatically detected."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Amazing Grace" {...field} data-testid="input-song-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist</FormLabel>
                    <FormControl>
                      <Input placeholder="Chris Tomlin" {...field} value={field.value || ""} data-testid="input-song-artist" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Key</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} data-testid="select-song-key">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select key" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAllKeys().map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="worship, praise, upbeat (comma separated)" 
                        value={Array.isArray(field.value) ? field.value.join(", ") : (field.value || "")}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-song-tags"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Separate tags with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="arrangement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrangement Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Intro, Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus x2, Outro"
                      className="min-h-20 resize-none"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-song-arrangement"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Song structure and arrangement markers (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lyrics with Chords</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Paste your lyrics here with chords on separate lines:
C                G
Amazing grace how sweet the sound
Am               F
That saved a wretch like me

Chords will be automatically detected and can be transposed later.`}
                      className="font-mono text-sm min-h-96"
                      {...field}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const cleaned = pastedText.trim();
                        field.onChange(cleaned);
                        
                        // Show toast to confirm paste detection
                        const linesWithChords = cleaned.split('\n').filter(line => {
                          const trimmed = line.trim();
                          return /[A-G][b#]?(m|maj|min|dim|aug|sus|add)?(\d*)?/.test(trimmed);
                        }).length;
                        
                        if (linesWithChords > 0) {
                          toast({
                            title: "Chords detected",
                            description: `Found ${linesWithChords} lines with chord notation. Chords will be automatically transposed.`,
                          });
                        }
                      }}
                      data-testid="textarea-song-lyrics"
                    />
                  </FormControl>
                  <FormDescription>
                    Paste chords on one line, lyrics on the next line. Our system will automatically detect chord lines.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                data-testid="button-cancel-song"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-song"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : song ? "Update Song" : "Add Song"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
