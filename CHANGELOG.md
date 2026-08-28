# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-08-28
### Added

- Nettle Tea now runs as a standalone CLI.
- `--bcc-channel`/`BCC_CHANNEL` to send a copy of every `/send` to a fixed channel, in addition to the real recipients.
- `GET /health` (liveness) and `GET /health/ready` (readiness - checks Slack reachability, cached 10s) endpoints.

### Changed

- Allow template without translations.
- Added `to: ({ user: string } | { channel: string })[]` as the preferred way to address `/send` targets.
- Breaking: renamed `--swagger` to `--openapi`.

### Deprecated

- `to_users` and `to_channels` in `/send` body.

[Unreleased]: https://github.com/oeklo/nettletea/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/oeklo/nettletea/compare/v0.2.0...v0.3.0
