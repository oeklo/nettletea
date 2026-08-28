# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added

- Nettle Tea now runs as a standalone CLI.
- `--bcc-channel`/`BCC_CHANNEL` to send a copy of every `/send` to a fixed channel, in addition to the real recipients.

### Changed

- Allow no template translations.
- Added `to: ({ user: string } | { channel: string })[]` as the preferred way to address `/send` targets.
- Breaking: renamed `--swagger` to `--openapi`.

### Deprecated

- `to_users` and `to_channels` in `/send` body.

### Removed

### Fixed

### Security
