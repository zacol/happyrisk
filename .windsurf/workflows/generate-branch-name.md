# generate-branch-name

## Description

Generate a branch name based on current code changes and repository conventions.

Use this workflow when:

- You are about to create a new branch
- You want consistent branch naming
- You follow Conventional Commits-style naming

---

## Instructions

### 1. Review Commit History

- Analyze the last ~10–20 commits
- Identify:
  - Common prefixes (`feat`, `fix`, `refactor`, etc.)
  - Naming patterns

### 2. Analyze Current Changes

- Review:
  - Staged changes (`git diff --cached`)
  - Unstaged changes (`git diff`)
- Determine:
  - What was changed?
  - Why it was changed
  - Affected areas

### 3. Classify the Change Type

Choose:

- `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`

### 4. Generate Branch Name

**Format:**

```text
<type>/<short-description>
```

**Rules:**

- Use kebab-case
- Be concise and descriptive
- Focus on intent

**Examples:**

```text
feat/add-user-authentication
fix/login-validation-error
refactor/api-response-handling
```

---

## Output Format

```text
Branch name:
<generated-branch-name>

Reasoning:
<brief explanation>
```
