import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown, Edit, X } from "lucide-react";
import type { Song } from "@shared/schema";
import { getAllKeys, transposeToKey, isChordLine } from "@/lib/chordUtils";

interface SongDetailDialogProps {
  song: Song;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function SongDetailDialog({ song, open, onClose, onEdit }: SongDetailDialogProps) {
  const [currentKey, setCurrentKey] = useState(song.originalKey);
  const [fontSize, setFontSize] = useState(18);
  const [highlightChords, setHighlightChords] = useState(true);

  const transposedLyrics = useMemo(() => {
    return transposeToKey(song.lyrics, song.originalKey, currentKey);
  }, [song.lyrics, song.originalKey, currentKey]);

  const transposeUp = () => {
    const keys = getAllKeys();
    const currentIndex = keys.indexOf(currentKey);
    const nextIndex = (currentIndex + 1) % keys.length;
    setCurrentKey(keys[nextIndex]);
  };

  const transposeDown = () => {
    const keys = getAllKeys();
    const currentIndex = keys.indexOf(currentKey);
    const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
    setCurrentKey(keys[prevIndex]);
  };

  const renderLyrics = () => {
    const lines = transposedLyrics.split('\n');
    
    return lines.map((line, index) => {
      const isChord = isChordLine(line);
      
      return (
        <div
          key={index}
          className={`font-mono leading-relaxed ${
            isChord
              ? `font-bold ${highlightChords ? 'text-primary' : 'text-foreground'}`
              : 'text-foreground'
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl" data-testid="text-song-detail-title">{song.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {song.artist || "Unknown Artist"}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-detail">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          <div className="flex-1 overflow-auto">
            <Card className="p-6 bg-card">
              <div className="whitespace-pre-wrap" data-testid="text-song-lyrics">
                {renderLyrics()}
              </div>
            </Card>
          </div>

          <div className="w-80 space-y-6 overflow-auto">
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="font-medium mb-3">Transpose</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={transposeDown}
                    data-testid="button-transpose-down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Select value={currentKey} onValueChange={setCurrentKey}>
                    <SelectTrigger data-testid="select-transpose-key">
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={transposeUp}
                    data-testid="button-transpose-up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Original key: {song.originalKey}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
                  <Slider
                    id="font-size"
                    min={12}
                    max={32}
                    step={2}
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    className="mt-2"
                    data-testid="slider-font-size"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="highlight-chords">Highlight Chords</Label>
                  <Switch
                    id="highlight-chords"
                    checked={highlightChords}
                    onCheckedChange={setHighlightChords}
                    data-testid="switch-highlight-chords"
                  />
                </div>
              </div>
            </Card>

            {song.tags && song.tags.length > 0 && (
              <Card className="p-6">
                <h3 className="font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {song.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={onEdit} data-testid="button-edit-from-detail">
                <Edit className="mr-2 h-4 w-4" />
                Edit Song
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
