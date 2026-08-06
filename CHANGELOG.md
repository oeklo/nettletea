# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added

- Nettle Tea now runs as a standalone CLI.

### Changed

- Allow no template translations.
- Added `to: ({ user: string } | { channel: string })[]` as the preferred way to address `/send` targets.

### Deprecated

- `to_users` and `to_channels` in `/send` body.

### Removed

### Fixed

### Security
