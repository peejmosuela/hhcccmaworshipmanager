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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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
}

export class MemStorage implements IStorage {
  private songs: Map<string, Song>;
  private musicians: Map<string, Musician>;
  private songLeaders: Map<string, SongLeader>;
  private setlists: Map<string, Setlist>;
  private setlistSongs: Map<string, SetlistSong>;
  private setlistMusicians: Map<string, SetlistMusician>;
  private songUsage: Map<string, SongUsage>;

  constructor() {
    this.songs = new Map();
    this.musicians = new Map();
    this.songLeaders = new Map();
    this.setlists = new Map();
    this.setlistSongs = new Map();
    this.setlistMusicians = new Map();
    this.songUsage = new Map();
  }

  // Songs
  async getSongs(): Promise<Song[]> {
    return Array.from(this.songs.values());
  }

  async getSong(id: string): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = randomUUID();
    const song: Song = {
      ...insertSong,
      id,
      createdAt: new Date(),
    };
    this.songs.set(id, song);
    return song;
  }

  async updateSong(id: string, insertSong: InsertSong): Promise<Song | undefined> {
    const existing = this.songs.get(id);
    if (!existing) return undefined;

    const updated: Song = {
      ...insertSong,
      id,
      createdAt: existing.createdAt,
    };
    this.songs.set(id, updated);
    return updated;
  }

  async deleteSong(id: string): Promise<boolean> {
    return this.songs.delete(id);
  }

  // Musicians
  async getMusicians(): Promise<Musician[]> {
    return Array.from(this.musicians.values());
  }

  async getMusician(id: string): Promise<Musician | undefined> {
    return this.musicians.get(id);
  }

  async createMusician(insertMusician: InsertMusician): Promise<Musician> {
    const id = randomUUID();
    const musician: Musician = {
      ...insertMusician,
      id,
      createdAt: new Date(),
    };
    this.musicians.set(id, musician);
    return musician;
  }

  async updateMusician(id: string, insertMusician: InsertMusician): Promise<Musician | undefined> {
    const existing = this.musicians.get(id);
    if (!existing) return undefined;

    const updated: Musician = {
      ...insertMusician,
      id,
      createdAt: existing.createdAt,
    };
    this.musicians.set(id, updated);
    return updated;
  }

  async deleteMusician(id: string): Promise<boolean> {
    return this.musicians.delete(id);
  }

  // Song Leaders
  async getSongLeaders(): Promise<SongLeader[]> {
    return Array.from(this.songLeaders.values());
  }

  async getSongLeader(id: string): Promise<SongLeader | undefined> {
    return this.songLeaders.get(id);
  }

  async createSongLeader(insertLeader: InsertSongLeader): Promise<SongLeader> {
    const id = randomUUID();
    const leader: SongLeader = {
      ...insertLeader,
      id,
      createdAt: new Date(),
    };
    this.songLeaders.set(id, leader);
    return leader;
  }

  async updateSongLeader(id: string, insertLeader: InsertSongLeader): Promise<SongLeader | undefined> {
    const existing = this.songLeaders.get(id);
    if (!existing) return undefined;

    const updated: SongLeader = {
      ...insertLeader,
      id,
      createdAt: existing.createdAt,
    };
    this.songLeaders.set(id, updated);
    return updated;
  }

  async deleteSongLeader(id: string): Promise<boolean> {
    return this.songLeaders.delete(id);
  }

  // Setlists
  async getSetlists(): Promise<Setlist[]> {
    return Array.from(this.setlists.values());
  }

  async getSetlist(id: string): Promise<Setlist | undefined> {
    return this.setlists.get(id);
  }

  async createSetlist(insertSetlist: InsertSetlist): Promise<Setlist> {
    const id = randomUUID();
    const setlist: Setlist = {
      ...insertSetlist,
      id,
      createdAt: new Date(),
    };
    this.setlists.set(id, setlist);
    return setlist;
  }

  async updateSetlist(id: string, insertSetlist: InsertSetlist): Promise<Setlist | undefined> {
    const existing = this.setlists.get(id);
    if (!existing) return undefined;

    const updated: Setlist = {
      ...insertSetlist,
      id,
      createdAt: existing.createdAt,
    };
    this.setlists.set(id, updated);
    return updated;
  }

  async deleteSetlist(id: string): Promise<boolean> {
    return this.setlists.delete(id);
  }

  // Setlist Songs
  async getSetlistSongs(setlistId: string): Promise<SetlistSong[]> {
    return Array.from(this.setlistSongs.values())
      .filter(ss => ss.setlistId === setlistId);
  }

  async addSongToSetlist(data: InsertSetlistSong): Promise<SetlistSong> {
    const id = randomUUID();
    const existingSongs = await this.getSetlistSongs(data.setlistId);
    const maxOrder = existingSongs.reduce((max, s) => Math.max(max, s.order), -1);

    const setlistSong: SetlistSong = {
      ...data,
      id,
      order: maxOrder + 1,
      transposedKey: data.transposedKey || null,
    };
    this.setlistSongs.set(id, setlistSong);

    // Track usage
    const setlist = await this.getSetlist(data.setlistId);
    if (setlist) {
      await this.trackSongUsage({
        songId: data.songId,
        setlistId: data.setlistId,
        usedAt: setlist.date,
      });
    }

    return setlistSong;
  }

  async removeSongFromSetlist(setlistId: string, setlistSongId: string): Promise<boolean> {
    const setlistSong = this.setlistSongs.get(setlistSongId);
    if (!setlistSong || setlistSong.setlistId !== setlistId) {
      return false;
    }
    return this.setlistSongs.delete(setlistSongId);
  }

  async updateSetlistSongKey(setlistSongId: string, transposedKey: string): Promise<SetlistSong | undefined> {
    const setlistSong = this.setlistSongs.get(setlistSongId);
    if (!setlistSong) return undefined;

    const updated: SetlistSong = {
      ...setlistSong,
      transposedKey,
    };
    this.setlistSongs.set(setlistSongId, updated);
    return updated;
  }

  async reorderSetlistSongs(setlistId: string, setlistSongIds: string[]): Promise<void> {
    setlistSongIds.forEach((id, index) => {
      const setlistSong = this.setlistSongs.get(id);
      if (setlistSong && setlistSong.setlistId === setlistId) {
        const updated: SetlistSong = {
          ...setlistSong,
          order: index,
        };
        this.setlistSongs.set(id, updated);
      }
    });
  }

  // Setlist Musicians
  async getSetlistMusicians(setlistId: string): Promise<SetlistMusician[]> {
    return Array.from(this.setlistMusicians.values())
      .filter(sm => sm.setlistId === setlistId);
  }

  async setSetlistMusicians(setlistId: string, musicianIds: string[]): Promise<void> {
    // Remove existing
    const existing = await this.getSetlistMusicians(setlistId);
    existing.forEach(sm => this.setlistMusicians.delete(sm.id));

    // Add new
    for (const musicianId of musicianIds) {
      const id = randomUUID();
      const setlistMusician: SetlistMusician = {
        id,
        setlistId,
        musicianId,
      };
      this.setlistMusicians.set(id, setlistMusician);
    }
  }

  // Song Usage
  async trackSongUsage(data: InsertSongUsage): Promise<SongUsage> {
    const id = randomUUID();
    const usage: SongUsage = {
      ...data,
      id,
    };
    this.songUsage.set(id, usage);
    return usage;
  }

  async getSongUsageStats(): Promise<any[]> {
    const songs = await this.getSongs();
    const setlists = await this.getSetlists();
    const songLeaders = await this.getSongLeaders();
    
    return songs.map(song => {
      const usages = Array.from(this.songUsage.values())
        .filter(u => u.songId === song.id);
      
      const usageCount = usages.length;
      const lastUsed = usages.length > 0
        ? new Date(Math.max(...usages.map(u => u.usedAt.getTime())))
        : null;

      const setlistsUsed = usages.map(u => {
        const setlist = setlists.find(s => s.id === u.setlistId);
        const songLeader = setlist?.songLeaderId 
          ? songLeaders.find(l => l.id === setlist.songLeaderId)
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
}

export const storage = new MemStorage();
