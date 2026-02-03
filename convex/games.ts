import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getGames = query({
  handler: async (ctx) => {
    const games = await ctx.db.query("games").order("desc").collect();
    return games;
  },
});

export const addGame = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", {
      text: args.text,
      SinglePlayer: false,
    });

    return gameId;
  },
});

export const toggleGame = mutation({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game) throw new ConvexError("Game not found");

    await ctx.db.patch(args.id, {
      SinglePlayer: !game.SinglePlayer,
    });
  },
});

export const deleteGames = mutation({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateGame = mutation({
  args: {
    id: v.id("games"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      text: args.text,
    });
  },
});

export const clearAllGames = mutation({
  handler: async (ctx) => {
    const games = await ctx.db.query("games").collect();

    for (const game of games) {
      await ctx.db.delete(game._id);
    }

    return { deletedCount: games.length };
  },
});
