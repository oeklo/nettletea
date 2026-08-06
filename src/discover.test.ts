import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverTemplates } from './discover.js';

const VALID_TEMPLATE_JS = `
export default {
	name: 'Test',
	fn: () => ({ blocks: [] }),
	examples: { default: {} },
	schema: { type: 'object' },
};
`;

let dir: string;

beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), 'nettletea-discover-'));
});

afterEach(async () => {
	await rm(dir, { force: true, recursive: true });
});

describe('discoverTemplates', () => {
	it('loads every valid template file, keyed by filename stem', async () => {
		await writeFile(path.join(dir, 'foo.js'), VALID_TEMPLATE_JS);
		await writeFile(path.join(dir, 'bar.js'), VALID_TEMPLATE_JS);

		const templates = await discoverTemplates(dir);

		expect(Object.keys(templates).sort()).toEqual(['bar', 'foo']);
		expect(templates.foo.name).toBe('Test');
	});

	it('ignores non-.ts/.js files', async () => {
		await writeFile(path.join(dir, 'foo.js'), VALID_TEMPLATE_JS);
		await writeFile(path.join(dir, 'README.md'), '# not a template');

		const templates = await discoverTemplates(dir);

		expect(Object.keys(templates)).toEqual(['foo']);
	});

	it('skips index.js and warns', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		await writeFile(path.join(dir, 'index.js'), VALID_TEMPLATE_JS);

		const templates = await discoverTemplates(dir);

		expect(templates).toEqual({});
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('index.js');

		warn.mockRestore();
	});

	it('throws when both name.ts and name.js exist', async () => {
		await writeFile(path.join(dir, 'foo.ts'), VALID_TEMPLATE_JS);
		await writeFile(path.join(dir, 'foo.js'), VALID_TEMPLATE_JS);

		await expect(discoverTemplates(dir)).rejects.toThrow(/Ambiguous template "foo"/);
	});

	it('throws when the default export is not a valid Template', async () => {
		await writeFile(path.join(dir, 'broken.js'), 'export default { name: "no fn or schema" };');

		await expect(discoverTemplates(dir)).rejects.toThrow(/does not export a valid Template/);
	});
});
