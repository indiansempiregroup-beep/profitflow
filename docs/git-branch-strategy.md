# Git Branch Strategy

## Branching Model

- main: production-ready code only
- develop: integration branch for the next release
- feature/*: work for a single capability or repository area
- fix/*: bug fixes
- chore/*: maintenance and tooling work
- release/*: release preparation branches
- hotfix/*: urgent production fixes

## Pull Request Rules

- Every change must go through a pull request.
- Require review from at least one maintainer.
- Keep pull requests focused and small.
- Re-run CI before merging.
