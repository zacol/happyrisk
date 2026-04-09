# generate-merge-request-description

## Description

Generate a concise merge request description based on all changes in the current branch.

Use this workflow when:

- You are about to create a merge request
- You want a clean summary of your work
- You want consistent PR/MR descriptions

---

## Instructions

### 1. Collect Branch Changes

- Compare current branch with base branch (e.g. `main`, `develop`)
- Review:
  - All commits in the branch (`git log`)
  - Full diff (`git diff <base-branch>...HEAD`)

### 2. Analyze Changes

Determine:

- What was implemented (features, fixes, refactors)
- Why the changes were made
- Which parts of the system are affected
- Any breaking or notable changes

### 3. Group Changes

Organize findings into logical groups:

- Features
- Bug fixes
- Refactoring
- Other (docs, tests, chores)

### 4. Generate Summary

Create a concise, structured description using the format below.

Keep it:

- Clear and easy to scan
- Focused on **what** and **why**, not low-level implementation
- Professional and neutral in tone

---

## Output Format

```text
## Summary
<high-level description of the changes>

## Changes
- <key change 1>
- <key change 2>
- <key change 3>

## Additional Notes
- <optional: breaking changes, important context, limitations>
```

---

## Examples

### Example 1

```text
## Summary
Add user authentication system with JWT support.

## Changes
- Implement login and registration endpoints
- Add JWT-based authentication middleware
- Protect private API routes

## Additional Notes
- Existing endpoints remain unchanged
```

---

### Example 2

```text
## Summary
Fix validation issues in user signup flow.

## Changes
- Correct email validation logic
- Improve error messages for invalid input

## Additional Notes
- No breaking changes
```

---

## Checklist (for internal reasoning)

- [ ] Reviewed all commits in the branch
- [ ] Analyzed full diff against base branch
- [ ] Identified main purpose of changes
- [ ] Grouped changes logically
- [ ] Kept summary concise and clear
- [ ] Avoided unnecessary technical details
