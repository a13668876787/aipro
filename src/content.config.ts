import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reviewSchema = z.object({
  mechanism: z.string(),
  whoBenefits: z.string(),
  userRisk: z.string(),
  verification: z.string(),
  failureMode: z.string(),
});

const daily = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/daily' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string(),
    category: z.enum(['OpenAI/ChatGPT', 'AI工具', 'AI视频', 'AI编程', '商业机会', '创作者灵感']),
    impact: z.enum(['高', '中', '低']),
    audience: z.string(),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    action: z.string(),
    risk: z.string(),
    relatedTools: z.array(z.string()).default([]),
    relatedOpportunities: z.array(z.string()).default([]),
    review: reviewSchema,
  }),
});

const opportunities = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/opportunities' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['短视频引流', 'AI自动化服务', '模板包', '咨询服务', '小工具产品']),
    difficulty: z.enum(['小白友好', '需要练习', '进阶']),
    startupCost: z.string(),
    monetizationPath: z.string(),
    audience: z.string(),
    sevenDayTest: z.array(z.string()).length(7),
    videoAngle: z.string(),
    review: reviewSchema,
  }),
});

const library = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    pillar: z.enum(['方法论', '工具实测', '机会复盘', '风险清单']),
    audience: z.string(),
    updated: z.date(),
  }),
});

export const collections = { daily, opportunities, library };
