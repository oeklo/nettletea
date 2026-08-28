# Nettle Tea

Template Server for Slack.

## Purpose

Nettle Tea is a transactional message server for Slack: point it at a
directory of templates, and it exposes them as endpoints to preview and send messages generated from
them and user-provided data.

## Usage

Write a template - one file per template, as the default export

```ts
// templates/helloWorld.ts
import type { Template } from 'nettletea';
import { Type } from '@fastify/type-provider-typebox';

interface Data {
	name: string;
}

export default {
	name: 'Hello World',
	fn: (data: Data) => {
        return {
            blocks: [
                {
                    text: {
                        type: 'mrkdwn',
                        text: `hello ${data.name}`,
                    },
                    type: 'section',
                },
            ],
            text: `hello ${data.name}`,
        }
    },
	examples: {
		default: {
			name: 'World',
		},
	},
	schema: Type.Object({
		name: Type.String(),
	}),
} as Template<Data>;
```

The template's file name (minus extension) becomes its route name - the file
above is served at `/t/helloWorld`. Both `.ts` and `.js` work.

Run the server:

```bash
SLACK_TOKEN=xoxb-... nettletea --templates ./templates
```

or, from the repo without installing globally:

```bash
SLACK_TOKEN=xoxb-... npx nettletea --templates ./templates
```

Each template gets three routes: `POST /t/<name>` (render only), `POST /t/<name>/send`
(render and deliver via Slack), `POST /t/<name>/preview` (render, reply `303`
with a Block Kit Builder preview URL - as a plain-text body by default, or as
a `Location` header with `?mode=header`).

### CLI options

Run `nettletea --help` for the up-to-date list

### Environment variables

Every option above is also readable from an env var of the same name:

`SLACK_TOKEN`
: Slack bot token. Optional - needed only for `/send` to actually deliver. Without it the server still starts (with a warning logged); render and preview routes work as normal, and `/send` responds `503 Service Unavailable`.

`TEMPLATES`
: Same as `--templates`. Templates directory. Default `./templates`.

`PORT`
: Same as `--port`. Port to listen on. Default `3000`.

`HOST`
: Same as `--host`. Host to bind to. Default `::`.

`ROOT`
: Same as `--root`. Route prefix.

`LANG`
: Same as `--lang`. Default i18next language.

`OVERRIDE_TO`
: Same as `--override-to`. Force every send to one address (staging).

`BCC_CHANNEL`
: Same as `--bcc-channel`. Send a copy of every send to this channel (name, not ID), in addition to the real recipients. Suppressed when `OVERRIDE_TO` is active.

`SWAGGER`
: Same as `--swagger`. Serve OpenAPI docs (JSON, YAML, and UI) at `/documentation`. Must be the literal string `"true"` or `"false"` - other values (e.g. `"1"`) are not recognized.

### Templates using enums, namespaces, or decorators

Plain Node can't execute those TypeScript constructs on its own (only
erasable syntax is stripped natively). Opt into a transpiling loader when you
invoke the CLI:

```bash
NODE_OPTIONS="--import tsx" SLACK_TOKEN=xoxb-... nettletea --templates ./templates
```

nettletea itself doesn't depend on `tsx`/`ts-node` - this is a loader you
choose and install yourself, only if you need it.

## Disclaimer

Slack is a trademark and service mark of Slack Technologies, Inc., registered in the U.S. and in other countries.

Neither the author of this project not the project itself are not affiliated with Slack Technologies.
