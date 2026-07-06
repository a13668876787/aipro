import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('tools data includes practical review fields', () => {
  const tools = JSON.parse(fs.readFileSync(path.join(root, 'src/data/tools.json'), 'utf8'));
  assert.ok(tools.length >= 20);
  for (const tool of tools) {
    for (const key of ['id', 'name', 'category', 'useCase', 'difficulty', 'audience', 'monetization', 'risk', 'url']) {
      assert.ok(tool[key], `${tool.name || tool.id} missing ${key}`);
    }
    assert.match(tool.url, /^https?:\/\//);
  }
});

test('built site keeps the required public sections', () => {
  const index = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  assert.match(index, /AI 今日雷达 Pro/);
  assert.match(index, /第一性原理/);
  assert.match(index, /对抗式审查/);
  assert.match(index, /工具目录/);
  assert.match(index, /机会库/);
  assert.match(index, /data-search-input/);
  assert.match(index, /data-saved-list/);
});
