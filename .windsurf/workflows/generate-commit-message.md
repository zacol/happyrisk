# generate-commit-message

## Description

Generate a Conventional Commit message based on current changes.

Use this workflow when:

- You are about to commit changes
- You want consistent commit messages
- You follow Conventional Commits

---

## Instructions

### 1. Review Commit History

- Analyze the last ~10–20 commits
- Identify:
  - Common prefixes (`feat`, `fix`, etc.)
  - Scope usage
  - Message structure

### 2. Analyze Current Changes

- Review:
  - Staged changes (`git diff --cached`)
  - Unstaged changes (`git diff`)
- Determine:
  - What changed
  - Why it changed
  - Affected modules

### 3. Classify the Change Type

Choose:

- `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`

### 4. Determine Scope (Optional)

- Infer from folders/modules
- Keep lowercase and concise

### 5. Generate Commit Message

**Format:**

```text
<type>(<scope>): <short summary>
```

**Rules:**

- Imperative mood
- Max ~50 chars subject
- No trailing period

**Example:**

```text
feat(auth): add JWT authentication support
```

---

## Output Format

```text
Commit message:
<generated-commit-message>

Reasoning:
<brief explanation>
```
