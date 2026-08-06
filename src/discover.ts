import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {Template, Templates} from './types.js';

const TEMPLATE_EXTENSIONS = ['.ts', '.js'];

export async function discoverTemplates(dir: string): Promise<Templates<any>> {
    const entries = await readdir(dir, {withFileTypes: true});
    const templates: Templates<any> = {};
    const sourceByName: {[name: string]: string} = {};

    for (const entry of entries) {
        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name);
        if (!TEMPLATE_EXTENSIONS.includes(ext)) continue;

        const name = path.basename(entry.name, ext);

        if (name === 'index') {
            console.warn(`Ignoring "${entry.name}" in ${dir}: "index" is a reserved name, not loaded as a template`);
            continue;
        }

        if (sourceByName[name]) {
            throw new Error(
                `Ambiguous template "${name}" in ${dir}: both ${sourceByName[name]} and ${entry.name} exist`,
            );
        }
        sourceByName[name] = entry.name;

        const mod = await import(pathToFileURL(path.join(dir, entry.name)).href);
        const template: Template<any> | undefined = mod.default;

        if (!template || typeof template.fn !== 'function' || !template.schema) {
            throw new Error(`"${entry.name}" in ${dir} does not export a valid Template as its default export`);
        }
        templates[name] = template;
    }

    return templates;
}
