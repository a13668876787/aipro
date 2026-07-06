import tools from '../data/tools.json';

export type Tool = (typeof tools)[number];

export const allTools = tools as Tool[];

export function toolById(id: string) {
  return allTools.find((tool) => tool.id === id);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function toJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
