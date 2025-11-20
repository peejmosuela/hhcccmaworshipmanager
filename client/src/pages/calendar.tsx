import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type Setlist, type SongLeader, type Musician, type SetlistMusician } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Music2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

type SetlistWithPeople = Setlist & {
  songLeader?: SongLeader;
  musicians: Array<SetlistMusician & { musician: Musician }>;
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: setlists = [] } = useQuery<Setlist[]>({
    queryKey: ["/api/setlists"],
  });

  const { data: songLeaders = [] } = useQuery<SongLeader[]>({
    queryKey: ["/api/song-leaders"],
  });

  const { data: musicians = [] } = useQuery<Musician[]>({
    queryKey: ["/api/musicians"],
  });

  // Fetch all setlist musicians
  const { data: allSetlistMusicians = [] } = useQuery<SetlistMusician[]>({
    queryKey: ["/api/setlist-musicians/all"],
  });

  // Build setlists with people data
  const setlistsWithPeople: SetlistWithPeople[] = setlists.map(setlist => {
    const songLeader = songLeaders.find(sl => sl.id === setlist.songLeaderId);
    const setlistMusicians = allSetlistMusicians
      .filter(sm => sm.setlistId === setlist.id)
      .map(sm => {
        const musician = musicians.find(m => m.id === sm.musicianId);
        return {
          ...sm,
          musician: musician!,
        };
      })
      .filter(sm => sm.musician); // Filter out any missing musicians

    return {
      ...setlist,
      songLeader,
      musicians: setlistMusicians,
    };
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSetlistsForDay = (day: Date) => {
    return setlistsWithPeople.filter(
      (setlist) =>
        !setlist.isTemplate &&
        isSameDay(new Date(setlist.date), day)
    );
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-semibold mb-1 md:mb-2" data-testid="text-calendar-title">
              Calendar
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              View and manage your worship services schedule
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">{format(currentMonth, "MMMM yyyy")}</span>
                <span className="sm:hidden">{format(currentMonth, "MMM yyyy")}</span>
              </CardTitle>
              <div className="flex gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  data-testid="button-previous-month"
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentMonth(new Date())}
                  data-testid="button-today"
                  className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-4"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  data-testid="button-next-month"
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-xs md:text-sm py-1 md:py-2 text-muted-foreground"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}

              {calendarDays.map((day, idx) => {
                const daySetlists = getSetlistsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    className={`min-h-16 md:min-h-24 lg:min-h-32 p-1 md:p-2 border rounded ${
                      !isCurrentMonth ? "opacity-40 bg-muted/30" : "bg-card"
                    } ${isToday ? "ring-1 md:ring-2 ring-primary" : ""}`}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div
                      className={`text-xs md:text-sm font-medium mb-0.5 md:mb-2 ${
                        isToday ? "text-primary font-bold" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-0.5 md:space-y-1">
                      {daySetlists.map((setlist) => (
                        <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
                          <div
                            className="p-1 md:p-2 rounded bg-primary/10 hover-elevate cursor-pointer border border-primary/20"
                            data-testid={`calendar-setlist-${setlist.id}`}
                          >
                            <div className="text-xs font-semibold text-primary truncate mb-0.5 md:mb-1">
                              {setlist.name}
                            </div>
                            {setlist.songLeader && (
                              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Music2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{setlist.songLeader.name}</span>
                              </div>
                            )}
                            {setlist.musicians.length > 0 && (
                              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {setlist.musicians.length} {setlist.musicians.length === 1 ? "person" : "people"}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Services List */}
        <Card data-testid="card-upcoming-services-list">
          <CardHeader>
            <CardTitle>Upcoming Services with Team Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {setlistsWithPeople.filter(
              (s) =>
                !s.isTemplate &&
                new Date(s.date) >= new Date()
            ).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No upcoming services scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {setlistsWithPeople
                  .filter(
                    (s) =>
                      !s.isTemplate &&
                      new Date(s.date) >= new Date()
                  )
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 10)
                  .map((setlist) => (
                    <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
                      <div
                        className="p-4 rounded-lg border hover-elevate cursor-pointer"
                        data-testid={`upcoming-service-${setlist.id}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{setlist.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(setlist.date), "EEEE, MMMM d, yyyy")}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {format(new Date(setlist.date), "h:mm a")}
                          </Badge>
                        </div>

                        {setlist.songLeader && (
                          <div className="flex items-center gap-2 mb-2">
                            <Music2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Song Leader:</span>
                            <span className="text-sm">{setlist.songLeader.name}</span>
                          </div>
                        )}

                        {setlist.musicians.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <span className="text-sm font-medium">Team Members:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {setlist.musicians.map((sm) => (
                                  <Badge key={sm.id} variant="secondary" className="text-xs">
                                    {sm.musician.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {!setlist.songLeader && setlist.musicians.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">
                            No team members assigned yet
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
