import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { type Song, type Setlist, type Musician } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, List, Users, TrendingUp, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { data: setlists = [] } = useQuery<Setlist[]>({
    queryKey: ["/api/setlists"],
  });

  const { data: musicians = [] } = useQuery<Musician[]>({
    queryKey: ["/api/musicians"],
  });

  const upcomingSetlists = setlists
    .filter((s) => !s.isTemplate && new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentSetlists = setlists
    .filter((s) => !s.isTemplate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const stats = [
    {
      title: "Total Songs",
      value: songs.length,
      icon: Music,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Active Setlists",
      value: setlists.filter((s) => !s.isTemplate).length,
      icon: List,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Musicians",
      value: musicians.length,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Upcoming Services",
      value: upcomingSetlists.length,
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome to your worship management center
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover-elevate" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-recent-setlists">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Setlists
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSetlists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No setlists created yet</p>
                  <Link href="/setlists">
                    <Button variant="outline" className="mt-4" data-testid="button-create-first-setlist">
                      Create Your First Setlist
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSetlists.map((setlist) => (
                    <Link key={setlist.id} href="/setlists">
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-card border hover-elevate cursor-pointer"
                        data-testid={`item-recent-setlist-${setlist.id}`}
                      >
                        <div>
                          <div className="font-medium">{setlist.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(setlist.date), "MMM d, yyyy")}
                          </div>
                        </div>
                        <List className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-upcoming-services">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSetlists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No upcoming services scheduled</p>
                  <Link href="/setlists">
                    <Button variant="outline" className="mt-4" data-testid="button-create-setlist">
                      Create Setlist
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSetlists.map((setlist) => (
                    <div
                      key={setlist.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border hover-elevate"
                      data-testid={`item-upcoming-setlist-${setlist.id}`}
                    >
                      <div>
                        <div className="font-medium">{setlist.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(setlist.date), "MMM d, yyyy")}
                        </div>
                      </div>
                      <Link href={`/setlists/${setlist.id}/present`}>
                        <Button size="icon" variant="ghost" data-testid={`button-present-${setlist.id}`}>
                          <Play className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/">
            <Card className="hover-elevate cursor-pointer" data-testid="card-quick-action-songs">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 rounded-full bg-green-500/10">
                    <Music className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Manage Songs</div>
                    <div className="text-sm text-muted-foreground">
                      Add and organize your song library
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/setlists">
            <Card className="hover-elevate cursor-pointer" data-testid="card-quick-action-setlists">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 rounded-full bg-blue-500/10">
                    <List className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Build Setlists</div>
                    <div className="text-sm text-muted-foreground">
                      Create and plan worship services
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/musicians">
            <Card className="hover-elevate cursor-pointer" data-testid="card-quick-action-musicians">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 rounded-full bg-purple-500/10">
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Team Members</div>
                    <div className="text-sm text-muted-foreground">
                      Manage musicians and leaders
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
