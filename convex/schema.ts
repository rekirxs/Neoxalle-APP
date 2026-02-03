import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    text: v.string(),
    SinglePlayer: v.boolean(),
  }),
});
