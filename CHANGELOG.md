# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold with Vite, TypeScript, and Three.js.
- Static entry overlay with wordmark, tagline, button, and noscript fallback.
- Strict TypeScript configuration.
- ESLint flat configuration with architectural layer boundary restrictions.
- Prettier formatting configuration and EditorConfig.
- Vitest unit testing harness with core math test suite.
- Playwright E2E testing harness configured with headless WebGL2 SwiftShader args.
- Bundle size checker script enforcing 300 KB JS / 500 KB total gzip limits.
- GitHub Actions CI workflow for linting, typechecking, tests, build, and size checks.
- Pre-commit and commit-msg quality hooks via Husky, lint-staged, and Commitlint.
