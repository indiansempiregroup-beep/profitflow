# Release Strategy

## Versioning

- Follow semantic versioning.
- Use patch releases for bug fixes.
- Use minor releases for backward-compatible feature work.
- Use major releases for breaking changes.

## Release Process

1. Merge changes into develop.
2. Run full CI and regression checks.
3. Create a release branch.
4. Perform release validation.
5. Tag the release and merge into main.
6. Deploy using the approved environment pipeline.
