import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { boards, recentlyViewed, users } from "@/server/db/schema"
import {
  createBoard,
  createRecent,
  getAllBoards,
  getBoardById,
  getRecent,
  updateBoard
} from "@/server/schema/board.schema"
import { TRPCError } from "@trpc/server"
import { and, desc, eq, gte, sql } from "drizzle-orm"

export const boardRouter = createTRPCRouter({
  get: protectedProcedure.input(getBoardById).query(async ({ ctx, input }) => {
    const board = await ctx.db.query.boards.findFirst({
      where: eq(boards.id, input.id),
      with: {
        owner: true
      },
      columns: {
        title: true,
        background: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        public: true
      }
    })

    if (!board) {
      throw new TRPCError({
        code: "NOT_FOUND"
      })
    }

    return {
      id: input.id,
      title: board.title,
      background: board.background,
      user: board.owner,
      ownerId: board.ownerId,
      public: board.public
    }
  }),
  all: protectedProcedure.input(getAllBoards).query(async ({ ctx, input }) => {
    const { db } = ctx

    const limit = input.limit ?? 20
    const countRows = await db
      .select({
        board_count: sql<number>`count(${boards.id})`.as("board_count")
      })
      .from(boards)
    const totalCount = countRows[0]?.board_count
    if (totalCount === undefined) throw new Error("totalCount is undefined")

    let boardsQuery = db
      .select()
      .from(boards)
      .leftJoin(users, eq(users.id, boards.ownerId))
      .where(eq(boards.ownerId, input.userId))
      .orderBy(desc(boards.createdAt))
      .limit(limit)

    const cursor = input.cursor
    if (cursor) {
      boardsQuery = boardsQuery.where(gte(boards.id, cursor))
    }
    const items = await boardsQuery.execute()

    let nextCursor: typeof input.cursor | undefined = undefined
    if (items.length > limit) {
      const nextItem = items.pop()!
      nextCursor = nextItem.boards.id
    }

    const returnableItems = items.map((item) => ({
      id: item.boards.id,
      title: item.boards.title,
      background: item.boards.background,
      createdAt: item.boards.createdAt,
      owner: item.user
    }))

    return {
      items: returnableItems,
      nextCursor,
      totalCount
    }
  }),
  create: protectedProcedure.input(createBoard).mutation(async ({ ctx, input }) => {
    const foundBoard = await ctx.db.query.boards.findFirst({
      where: eq(boards.title, input.title)
    })

    if (!!foundBoard) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Board already exists"
      })
    }

    return await ctx.db.insert(boards).values({
      ...input
    })
  }),
  edit: protectedProcedure.input(updateBoard).mutation(async ({ ctx, input }) => {
    const foundBoard = await ctx.db.query.boards.findFirst({
      where: eq(boards.id, input.boardId)
    })

    if (!foundBoard) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Board not found"
      })
    }

    return await ctx.db
      .update(boards)
      .set({
        title: input.title
      })
      .where(eq(boards.id, input.boardId))
  }),
  createRecent: protectedProcedure.input(createRecent).mutation(async ({ ctx, input }) => {
    const foundRecent = await ctx.db.query.recentlyViewed.findFirst({
      where: and(
        eq(recentlyViewed.userId, input.userId),
        eq(recentlyViewed.boardId, input.boardId)
      ),
    })

    if (!!foundRecent) {
      return await ctx.db
        .update(recentlyViewed)
        .set({
          updatedAt: new Date()
        })
        .where(
          and(eq(recentlyViewed.userId, input.userId), eq(recentlyViewed.boardId, input.boardId))
        )
    }

    return await ctx.db.insert(recentlyViewed).values({
      userId: input.userId,
      boardId: input.boardId
    })
  }),
  getRecent: protectedProcedure.input(getRecent).query(async ({ ctx, input }) => {
    const { userId } = input

    return await ctx.db.query.recentlyViewed.findMany({
      where: eq(recentlyViewed.userId, userId),
      orderBy: desc(recentlyViewed.updatedAt),
      limit: 5,
      columns: {},
      with: {
        board: true
      }
    })
  })
})
