import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSongSchema,
  insertMusicianSchema,
  insertSongLeaderSchema,
  insertSetlistSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Songs CRUD
  app.get("/api/songs", async (_req, res) => {
    try {
      const songs = await storage.getSongs();
      res.json(songs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  app.get("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch song" });
    }
  });

  app.post("/api/songs", async (req, res) => {
    try {
      // Normalize tags: handle string, array, or missing
      let tags: string[] = [];
      if (typeof req.body.tags === "string") {
        tags = req.body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(req.body.tags)) {
        tags = req.body.tags.map((t: string) => String(t).trim()).filter(Boolean);
      }
      
      const body = {
        ...req.body,
        tags,
      };
      const validated = insertSongSchema.parse(body);
      const song = await storage.createSong(validated);
      res.status(201).json(song);
    } catch (error) {
      res.status(400).json({ error: "Invalid song data" });
    }
  });

  app.put("/api/songs/:id", async (req, res) => {
    try {
      // Normalize tags: handle string, array, or missing
      let tags: string[] = [];
      if (typeof req.body.tags === "string") {
        tags = req.body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(req.body.tags)) {
        tags = req.body.tags.map((t: string) => String(t).trim()).filter(Boolean);
      }
      
      const body = {
        ...req.body,
        tags,
      };
      const validated = insertSongSchema.parse(body);
      const song = await storage.updateSong(req.params.id, validated);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(400).json({ error: "Invalid song data" });
    }
  });

  app.delete("/api/songs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSong(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete song" });
    }
  });

  // Musicians CRUD
  app.get("/api/musicians", async (_req, res) => {
    try {
      const musicians = await storage.getMusicians();
      res.json(musicians);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch musicians" });
    }
  });

  app.post("/api/musicians", async (req, res) => {
    try {
      const validated = insertMusicianSchema.parse(req.body);
      const musician = await storage.createMusician(validated);
      res.status(201).json(musician);
    } catch (error) {
      res.status(400).json({ error: "Invalid musician data" });
    }
  });

  app.put("/api/musicians/:id", async (req, res) => {
    try {
      const validated = insertMusicianSchema.parse(req.body);
      const musician = await storage.updateMusician(req.params.id, validated);
      if (!musician) {
        return res.status(404).json({ error: "Musician not found" });
      }
      res.json(musician);
    } catch (error) {
      res.status(400).json({ error: "Invalid musician data" });
    }
  });

  app.delete("/api/musicians/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMusician(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Musician not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete musician" });
    }
  });

  // Song Leaders CRUD
  app.get("/api/song-leaders", async (_req, res) => {
    try {
      const leaders = await storage.getSongLeaders();
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch song leaders" });
    }
  });

  app.post("/api/song-leaders", async (req, res) => {
    try {
      const validated = insertSongLeaderSchema.parse(req.body);
      const leader = await storage.createSongLeader(validated);
      res.status(201).json(leader);
    } catch (error) {
      res.status(400).json({ error: "Invalid song leader data" });
    }
  });

  app.put("/api/song-leaders/:id", async (req, res) => {
    try {
      const validated = insertSongLeaderSchema.parse(req.body);
      const leader = await storage.updateSongLeader(req.params.id, validated);
      if (!leader) {
        return res.status(404).json({ error: "Song leader not found" });
      }
      res.json(leader);
    } catch (error) {
      res.status(400).json({ error: "Invalid song leader data" });
    }
  });

  app.delete("/api/song-leaders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSongLeader(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Song leader not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete song leader" });
    }
  });

  // Setlists CRUD
  app.get("/api/setlists", async (_req, res) => {
    try {
      const setlists = await storage.getSetlists();
      res.json(setlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setlists" });
    }
  });

  app.get("/api/setlists/:id", async (req, res) => {
    try {
      const setlist = await storage.getSetlist(req.params.id);
      if (!setlist) {
        return res.status(404).json({ error: "Setlist not found" });
      }

      const setlistSongs = await storage.getSetlistSongs(req.params.id);
      const songsWithDetails = await Promise.all(
        setlistSongs.map(async (ss) => {
          const song = await storage.getSong(ss.songId);
          return {
            ...ss,
            song: song!,
          };
        })
      );

      const setlistMusicians = await storage.getSetlistMusicians(req.params.id);
      const musiciansWithDetails = await Promise.all(
        setlistMusicians.map(async (sm) => {
          const musician = await storage.getMusician(sm.musicianId);
          return {
            ...sm,
            musician: musician!,
          };
        })
      );

      const songLeader = setlist.songLeaderId
        ? await storage.getSongLeader(setlist.songLeaderId)
        : undefined;

      const response = {
        ...setlist,
        songs: songsWithDetails,
        musicians: musiciansWithDetails,
        songLeader,
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setlist" });
    }
  });

  app.post("/api/setlists", async (req, res) => {
    try {
      const body = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        isTemplate: req.body.isTemplate ?? 0,
      };
      const validated = insertSetlistSchema.parse(body);
      const setlist = await storage.createSetlist(validated);
      res.status(201).json(setlist);
    } catch (error) {
      res.status(400).json({ error: "Invalid setlist data" });
    }
  });

  app.put("/api/setlists/:id", async (req, res) => {
    try {
      const body = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        isTemplate: req.body.isTemplate ?? 0,
      };
      const validated = insertSetlistSchema.parse(body);
      const setlist = await storage.updateSetlist(req.params.id, validated);
      if (!setlist) {
        return res.status(404).json({ error: "Setlist not found" });
      }
      res.json(setlist);
    } catch (error) {
      res.status(400).json({ error: "Invalid setlist data" });
    }
  });

  app.delete("/api/setlists/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSetlist(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Setlist not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete setlist" });
    }
  });

  app.post("/api/setlists/:id/duplicate", async (req, res) => {
    try {
      const { name, date } = req.body;
      
      let validatedName: string | undefined;
      let validatedDate: Date | undefined;
      
      if (name !== undefined && name !== null) {
        if (typeof name !== 'string' || name.trim() === '') {
          return res.status(400).json({ error: "Name must be a non-empty string" });
        }
        validatedName = name.trim();
      }
      
      if (date !== undefined && date !== null) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }
        validatedDate = parsedDate;
      }
      
      const duplicated = await storage.duplicateSetlist(
        req.params.id,
        validatedName,
        validatedDate
      );
      if (!duplicated) {
        return res.status(404).json({ error: "Setlist not found" });
      }
      res.status(201).json(duplicated);
    } catch (error) {
      res.status(500).json({ error: "Failed to duplicate setlist" });
    }
  });

  // Setlist Songs
  app.post("/api/setlists/:id/songs", async (req, res) => {
    try {
      const { songId, transposedKey } = req.body;
      if (!songId) {
        return res.status(400).json({ error: "songId is required" });
      }

      const setlistSong = await storage.addSongToSetlist({
        setlistId: req.params.id,
        songId,
        transposedKey: transposedKey || null,
        order: 0, // Will be calculated in storage
      });

      res.status(201).json(setlistSong);
    } catch (error) {
      res.status(400).json({ error: "Failed to add song to setlist" });
    }
  });

  app.patch("/api/setlists/:setlistId/songs/:setlistSongId", async (req, res) => {
    try {
      const { transposedKey } = req.body;
      if (transposedKey === undefined) {
        return res.status(400).json({ error: "transposedKey is required" });
      }
      const updated = await storage.updateSetlistSongKey(
        req.params.setlistSongId,
        transposedKey
      );
      if (!updated) {
        return res.status(404).json({ error: "Setlist song not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setlist song" });
    }
  });

  app.delete("/api/setlists/:setlistId/songs/:songId", async (req, res) => {
    try {
      const deleted = await storage.removeSongFromSetlist(
        req.params.setlistId,
        req.params.songId
      );
      if (!deleted) {
        return res.status(404).json({ error: "Song not found in setlist" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove song from setlist" });
    }
  });

  app.put("/api/setlists/:setlistId/songs/reorder", async (req, res) => {
    try {
      const { songIds } = req.body;
      if (!Array.isArray(songIds)) {
        return res.status(400).json({ error: "songIds must be an array" });
      }

      await storage.reorderSetlistSongs(req.params.setlistId, songIds);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder songs" });
    }
  });

  // Setlist Musicians
  app.put("/api/setlists/:id/musicians", async (req, res) => {
    try {
      const { musicianIds } = req.body;
      if (!Array.isArray(musicianIds)) {
        return res.status(400).json({ error: "musicianIds must be an array" });
      }

      await storage.setSetlistMusicians(req.params.id, musicianIds);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to update musicians" });
    }
  });

  // Statistics
  app.get("/api/statistics/song-usage", async (_req, res) => {
    try {
      const stats = await storage.getSongUsageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/statistics/musician-scheduling", async (_req, res) => {
    try {
      const stats = await storage.getMusicianSchedulingStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch musician statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
