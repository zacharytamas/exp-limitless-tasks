import { z } from 'zod'

export const ContentNodeSchema: z.ZodType<ContentNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    content: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startOffsetMs: z.number().int().optional(),
    endOffsetMs: z.number().int().optional(),
    children: z.array(ContentNodeSchema).optional(),
    speakerName: z.string().nullable().optional(),
    speakerIdentifier: z.enum(['user']).nullable().optional(),
  }),
)

export const LifelogSchema = z.object({
  id: z.string(),
  title: z.string(),
  markdown: z.string().nullable(),
  contents: z.array(ContentNodeSchema),
  startTime: z.string(),
  endTime: z.string(),
  isStarred: z.boolean(),
  updatedAt: z.string(),
})

export const MetaLifelogsSchema = z.object({
  nextCursor: z.string().optional(),
  count: z.number().int(),
})

export const MetaSchema = z.object({
  lifelogs: MetaLifelogsSchema,
})

export const LifelogsResponseDataSchema = z.object({
  lifelogs: z.array(LifelogSchema),
})

export const LifelogsResponseSchema = z.object({
  data: LifelogsResponseDataSchema,
  meta: MetaSchema,
})

export type ContentNode = {
  type: string
  content: string
  startTime?: string
  endTime?: string
  startOffsetMs?: number
  endOffsetMs?: number
  children?: ContentNode[]
  speakerName?: string | null
  speakerIdentifier?: 'user' | null
}

export type Lifelog = z.infer<typeof LifelogSchema>
export type MetaLifelogs = z.infer<typeof MetaLifelogsSchema>
export type Meta = z.infer<typeof MetaSchema>
export type LifelogsResponseData = z.infer<typeof LifelogsResponseDataSchema>
export type LifelogsResponse = z.infer<typeof LifelogsResponseSchema>
