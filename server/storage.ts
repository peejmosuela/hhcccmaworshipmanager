import {
  type Song,
  type InsertSong,
  type Musician,
  type InsertMusician,
  type SongLeader,
  type InsertSongLeader,
  type Setlist,
  type InsertSetlist,
  type SetlistSong,
  type InsertSetlistSong,
  type SetlistMusician,
  type InsertSetlistMusician,
  type SongUsage,
  type InsertSongUsage,
  type User,
  type UpsertUser,
  songs,
  musicians,
  songLeaders,
  setlists,
  setlistSongs,
  setlistMusicians,
  songUsage,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Songs
  getSongs(): Promise<Song[]>;
  getSong(id: string): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, song: InsertSong): Promise<Song | undefined>;
  deleteSong(id: string): Promise<boolean>;

  // Musicians
  getMusicians(): Promise<Musician[]>;
  getMusician(id: string): Promise<Musician | undefined>;
  createMusician(musician: InsertMusician): Promise<Musician>;
  updateMusician(id: string, musician: InsertMusician): Promise<Musician | undefined>;
  deleteMusician(id: string): Promise<boolean>;

  // Song Leaders
  getSongLeaders(): Promise<SongLeader[]>;
  getSongLeader(id: string): Promise<SongLeader | undefined>;
  createSongLeader(leader: InsertSongLeader): Promise<SongLeader>;
  updateSongLeader(id: string, leader: InsertSongLeader): Promise<SongLeader | undefined>;
  deleteSongLeader(id: string): Promise<boolean>;

  // Setlists
  getSetlists(): Promise<Setlist[]>;
  getSetlist(id: string): Promise<Setlist | undefined>;
  createSetlist(setlist: InsertSetlist): Promise<Setlist>;
  updateSetlist(id: string, setlist: InsertSetlist): Promise<Setlist | undefined>;
  deleteSetlist(id: string): Promise<boolean>;
  duplicateSetlist(id: string, newName?: string, newDate?: Date): Promise<Setlist | undefined>;

  // Setlist Songs
  getSetlistSongs(setlistId: string): Promise<SetlistSong[]>;
  addSongToSetlist(data: InsertSetlistSong): Promise<SetlistSong>;
  removeSongFromSetlist(setlistId: string, setlistSongId: string): Promise<boolean>;
  updateSetlistSongKey(setlistSongId: string, transposedKey: string): Promise<SetlistSong | undefined>;
  reorderSetlistSongs(setlistId: string, setlistSongIds: string[]): Promise<void>;

  // Setlist Musicians
  getSetlistMusicians(setlistId: string): Promise<SetlistMusician[]>;
  setSetlistMusicians(setlistId: string, musicianIds: string[]): Promise<void>;

  // Song Usage
  trackSongUsage(data: InsertSongUsage): Promise<SongUsage>;
  getSongUsageStats(): Promise<any[]>;
  getMusicianSchedulingStats(): Promise<any[]>;
}

export class DbStorage implements IStorage {
  // User operations for Replit Auth
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Songs
  async getSongs(): Promise<Song[]> {
    return await db.select().from(songs).orderBy(desc(songs.createdAt));
  }

  async getSong(id: string): Promise<Song | undefined> {
    const result = await db.select().from(songs).where(eq(songs.id, id)).limit(1);
    return result[0];
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const result = await db.insert(songs).values(insertSong).returning();
    return result[0];
  }

  async updateSong(id: string, insertSong: InsertSong): Promise<Song | undefined> {
    const result = await db.update(songs).set(insertSong).where(eq(songs.id, id)).returning();
    return result[0];
  }

  async deleteSong(id: string): Promise<boolean> {
    const result = await db.delete(songs).where(eq(songs.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Musicians
  async getMusicians(): Promise<Musician[]> {
    return await db.select().from(musicians).orderBy(desc(musicians.createdAt));
  }

  async getMusician(id: string): Promise<Musician | undefined> {
    const result = await db.select().from(musicians).where(eq(musicians.id, id)).limit(1);
    return result[0];
  }

  async createMusician(insertMusician: InsertMusician): Promise<Musician> {
    const result = await db.insert(musicians).values(insertMusician).returning();
    return result[0];
  }

  async updateMusician(id: string, insertMusician: InsertMusician): Promise<Musician | undefined> {
    const result = await db.update(musicians).set(insertMusician).where(eq(musicians.id, id)).returning();
    return result[0];
  }

  async deleteMusician(id: string): Promise<boolean> {
    const result = await db.delete(musicians).where(eq(musicians.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Song Leaders
  async getSongLeaders(): Promise<SongLeader[]> {
    return await db.select().from(songLeaders).orderBy(desc(songLeaders.createdAt));
  }

  async getSongLeader(id: string): Promise<SongLeader | undefined> {
    const result = await db.select().from(songLeaders).where(eq(songLeaders.id, id)).limit(1);
    return result[0];
  }

  async createSongLeader(insertLeader: InsertSongLeader): Promise<SongLeader> {
    const result = await db.insert(songLeaders).values(insertLeader).returning();
    return result[0];
  }

  async updateSongLeader(id: string, insertLeader: InsertSongLeader): Promise<SongLeader | undefined> {
    const result = await db.update(songLeaders).set(insertLeader).where(eq(songLeaders.id, id)).returning();
    return result[0];
  }

  async deleteSongLeader(id: string): Promise<boolean> {
    const result = await db.delete(songLeaders).where(eq(songLeaders.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Setlists
  async getSetlists(): Promise<Setlist[]> {
    return await db.select().from(setlists).orderBy(desc(setlists.date));
  }

  async getSetlist(id: string): Promise<Setlist | undefined> {
    const result = await db.select().from(setlists).where(eq(setlists.id, id)).limit(1);
    return result[0];
  }

  async createSetlist(insertSetlist: InsertSetlist): Promise<Setlist> {
    const result = await db.insert(setlists).values(insertSetlist).returning();
    return result[0];
  }

  async updateSetlist(id: string, insertSetlist: InsertSetlist): Promise<Setlist | undefined> {
    const result = await db.update(setlists).set(insertSetlist).where(eq(setlists.id, id)).returning();
    return result[0];
  }

  async deleteSetlist(id: string): Promise<boolean> {
    const result = await db.delete(setlists).where(eq(setlists.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async duplicateSetlist(id: string, newName?: string, newDate?: Date): Promise<Setlist | undefined> {
    const originalSetlist = await this.getSetlist(id);
    if (!originalSetlist) return undefined;

    const originalSongs = await this.getSetlistSongs(id);
    const originalMusicians = await this.getSetlistMusicians(id);

    const duplicatedSetlist = await this.createSetlist({
      name: newName || `${originalSetlist.name} (Copy)`,
      date: newDate || new Date(),
      songLeaderId: originalSetlist.songLeaderId,
      notes: originalSetlist.notes,
      isTemplate: 0,
    });

    if (originalSongs.length > 0) {
      const sortedSongs = [...originalSongs].sort((a, b) => a.order - b.order);
      for (const song of sortedSongs) {
        await db.insert(setlistSongs).values({
          setlistId: duplicatedSetlist.id,
          songId: song.songId,
          order: song.order,
          transposedKey: song.transposedKey,
        });
      }
    }

    if (originalMusicians.length > 0) {
      const musicianIds = originalMusicians.map((m) => m.musicianId);
      await this.setSetlistMusicians(duplicatedSetlist.id, musicianIds);
    }

    return duplicatedSetlist;
  }

  // Setlist Songs
  async getSetlistSongs(setlistId: string): Promise<SetlistSong[]> {
    return await db.select().from(setlistSongs).where(eq(setlistSongs.setlistId, setlistId));
  }

  async addSongToSetlist(data: InsertSetlistSong): Promise<SetlistSong> {
    const result = await db.insert(setlistSongs).values(data).returning();
    
    // Track song usage
    if (result[0]) {
      await this.trackSongUsage({
        songId: data.songId,
        setlistId: data.setlistId,
        usedAt: new Date(),
      });
    }
    
    return result[0];
  }

  async removeSongFromSetlist(setlistId: string, setlistSongId: string): Promise<boolean> {
    const result = await db.delete(setlistSongs)
      .where(eq(setlistSongs.id, setlistSongId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateSetlistSongKey(setlistSongId: string, transposedKey: string): Promise<SetlistSong | undefined> {
    const result = await db.update(setlistSongs)
      .set({ transposedKey })
      .where(eq(setlistSongs.id, setlistSongId))
      .returning();
    return result[0];
  }

  async reorderSetlistSongs(setlistId: string, setlistSongIds: string[]): Promise<void> {
    for (let i = 0; i < setlistSongIds.length; i++) {
      await db.update(setlistSongs)
        .set({ order: i })
        .where(eq(setlistSongs.id, setlistSongIds[i]));
    }
  }

  // Setlist Musicians
  async getSetlistMusicians(setlistId: string): Promise<SetlistMusician[]> {
    return await db.select().from(setlistMusicians).where(eq(setlistMusicians.setlistId, setlistId));
  }

  async setSetlistMusicians(setlistId: string, musicianIds: string[]): Promise<void> {
    // Remove existing musicians
    await db.delete(setlistMusicians).where(eq(setlistMusicians.setlistId, setlistId));

    // Add new musicians
    if (musicianIds.length > 0) {
      const values = musicianIds.map(musicianId => ({
        setlistId,
        musicianId,
      }));
      await db.insert(setlistMusicians).values(values);
    }
  }

  // Song Usage
  async trackSongUsage(data: InsertSongUsage): Promise<SongUsage> {
    const result = await db.insert(songUsage).values(data).returning();
    return result[0];
  }

  async getSongUsageStats(): Promise<any[]> {
    const allSongs = await this.getSongs();
    const allSetlists = await this.getSetlists();
    const allSongLeaders = await this.getSongLeaders();
    const allUsages = await db.select().from(songUsage);
    
    return allSongs.map(song => {
      const usages = allUsages.filter(u => u.songId === song.id);
      const usageCount = usages.length;
      const lastUsed = usages.length > 0
        ? new Date(Math.max(...usages.map(u => u.usedAt.getTime())))
        : null;

      const setlistsUsed = usages.map(u => {
        const setlist = allSetlists.find(s => s.id === u.setlistId);
        const songLeader = setlist?.songLeaderId 
          ? allSongLeaders.find(l => l.id === setlist.songLeaderId)
          : null;
        
        return {
          setlistName: setlist?.name || '',
          date: u.usedAt.toISOString(),
          songLeaderName: songLeader?.name || null,
        };
      });

      return {
        ...song,
        usageCount,
        lastUsed: lastUsed?.toISOString() || null,
        setlists: setlistsUsed,
      };
    });
  }

  async getMusicianSchedulingStats(): Promise<any[]> {
    const allMusicians = await this.getMusicians();
    const allSetlists = await this.getSetlists();
    const allAssignments = await db.select().from(setlistMusicians);
    
    return allMusicians.map(musician => {
      const assignments = allAssignments.filter(sm => sm.musicianId === musician.id);
      const scheduledCount = assignments.length;
      const lastScheduled = assignments.length > 0
        ? allSetlists
            .filter(s => assignments.some(a => a.setlistId === s.id))
            .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date
        : null;

      const setlistsScheduled = assignments.map(assignment => {
        const setlist = allSetlists.find(s => s.id === assignment.setlistId);
        return {
          setlistName: setlist?.name || '',
          date: setlist?.date.toISOString() || '',
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        ...musician,
        scheduledCount,
        lastScheduled: lastScheduled?.toISOString() || null,
        setlists: setlistsScheduled,
      };
    });
  }
}

export const storage = new DbStorage();
