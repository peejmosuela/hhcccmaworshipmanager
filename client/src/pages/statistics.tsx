import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SongUsageStats {
  id: string;
  title: string;
  artist: string | null;
  originalKey: string;
  usageCount: number;
  lastUsed: string | null;
  setlists: Array<{
    setlistName: string;
    date: string;
    songLeaderName: string | null;
  }>;
}

export default function StatisticsPage() {
  const { data: stats = [], isLoading } = useQuery<SongUsageStats[]>({
    queryKey: ["/api/statistics/song-usage"],
  });

  const sortedByUsage = [...stats].sort((a, b) => b.usageCount - a.usageCount);
  const sortedByRecent = [...stats]
    .filter(s => s.lastUsed)
    .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime());

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-6">
        <h1 className="text-3xl font-medium">Statistics</h1>
        <p className="text-muted-foreground mt-1">Song usage tracking and insights</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Songs</CardDescription>
              <CardTitle className="text-3xl" data-testid="text-total-songs">
                {stats.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Songs Used</CardDescription>
              <CardTitle className="text-3xl" data-testid="text-songs-used">
                {stats.filter(s => s.usageCount > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Never Used</CardDescription>
              <CardTitle className="text-3xl" data-testid="text-songs-unused">
                {stats.filter(s => s.usageCount === 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Most Used Songs</CardTitle>
            <CardDescription>Songs sorted by frequency of use</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : sortedByUsage.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No song usage data yet</p>
                <p className="text-sm text-muted-foreground">Add songs to setlists to track usage</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Song</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead className="text-center">Times Used</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedByUsage.slice(0, 20).map((song) => (
                    <TableRow key={song.id} data-testid={`row-song-usage-${song.id}`}>
                      <TableCell className="font-medium">{song.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {song.artist || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{song.originalKey}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge>{song.usageCount}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {song.lastUsed 
                          ? new Date(song.lastUsed).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : "Never"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Used Songs</CardTitle>
            <CardDescription>Songs sorted by most recent use</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : sortedByRecent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent usage data</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Song</TableHead>
                    <TableHead>Last Setlist</TableHead>
                    <TableHead>Song Leader</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedByRecent.slice(0, 15).map((song) => {
                    const lastSetlist = song.setlists[song.setlists.length - 1];
                    return (
                      <TableRow key={song.id}>
                        <TableCell className="font-medium">{song.title}</TableCell>
                        <TableCell>{lastSetlist?.setlistName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {lastSetlist?.songLeaderName || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {song.lastUsed 
                            ? new Date(song.lastUsed).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : "—"
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
