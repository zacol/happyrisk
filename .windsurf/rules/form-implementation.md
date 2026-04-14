---
trigger: glob
globs: apps/web/**
---

# Form Implementation — Rules & Patterns

Rules for building forms in `apps/web`. Every form must follow these conventions to ensure consistency, type safety, accessibility, and correct integration with the project's tech stack.

## Tech Stack

- **React Hook Form v7** (`react-hook-form`) — form state management.
- **Standard Schema Resolver** (`@hookform/resolvers/standard-schema`) — connects Zod schemas to React Hook Form. Do **not** use `@hookform/resolvers/zod` — this project uses the standard schema resolver exclusively.
- **Zod** — validation schemas. Shared schemas live in `@happyrisk/core/schemas`.
- **shadcn/ui** (`@base-ui/react`) — `Input`, `Label`, `Select`, `Dialog`, `Button`, etc.
- **TanStack Query v5** — mutations for form submission (`useMutation` via custom hooks in `src/hooks/`).
- **Sonner** — toast notifications for success/error feedback.

## Schema & Types

- The Zod schema is the **single source of truth** for what constitutes valid form data.
- Infer the form's TypeScript type directly from the schema with `z.infer<typeof schema>`. Never write a separate interface that duplicates the schema's structure.
- Shared schemas (used by both API and frontend) live in `packages/core/src/schemas/`. Import them via `@happyrisk/core` or `@happyrisk/core/schemas`.
- Frontend-only schemas (e.g., a confirm-password field) may live next to the component in co-located file (`*.schema.ts` or `validation` directory), but still use Zod.
- Never write manual validation logic in event handlers — always express constraints in the schema.

```typescript
// packages/core/src/schemas/team.ts
import { z } from 'zod';

export const teamCreateSchema = z.object({
  name: z.string().min(1).max(255),
});

export type TeamCreate = z.infer<typeof teamCreateSchema>;
```

## `useForm` Setup

- Always use `standardSchemaResolver` — never `zodResolver`.
- Always pass `defaultValues` — this avoids uncontrolled-to-controlled input warnings and ensures `reset()` works correctly.
- Destructure only what you need from `useForm` (e.g., `register`, `handleSubmit`, `reset`, `setValue`, `formState`).
- For components that don't support `register` natively (e.g., shadcn `Select`), use `setValue` or `Controller` from React Hook Form.

```typescript
import { type TeamCreate, teamCreateSchema } from '@happyrisk/core';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useForm } from 'react-hook-form';

const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
} = useForm<TeamCreate>({
  resolver: standardSchemaResolver(teamCreateSchema),
  defaultValues: { name: '' },
});
```

## Field Components

For the standard input types — **text, select, checkbox, radio, textarea, date** — use composable field wrapper components from `src/components/ui/`. Each wrapper connects React Hook Form state to the shadcn/ui input and **must**:

- Accept the field `name` (and optionally form context via `useFormContext`) as props so the same component works across different forms.
- Render a visible `<Label>`, the input element, and an error message container as a single unit.
- Read `error`, `touched`, and `dirty` state from React Hook Form and reflect it in the UI.
- Set accessibility attributes automatically:
  - `aria-invalid="true"` when the field has an error.
  - `aria-describedby` pointing to the error message element's `id`.
  - `aria-required="true"` for required fields.
- Display the error message inline below the input using `<p className="text-sm text-destructive" role="alert">`.

Do **not** inline raw `<Label>` + `<Input>` + error `<p>` manually for these standard types — always go through the field wrapper. This eliminates boilerplate and guarantees consistent accessibility attributes across all forms.

For non-standard or highly custom inputs (e.g., file upload, rich text editor, color picker), creating a dedicated wrapper is **recommended** but not required. If you inline the markup, you are still responsible for all accessibility attributes listed above.

## Form JSX/TSX

- Always use the `void handleSubmit(onSubmit)(e)` pattern to handle the promise without an unhandled rejection.
- Add `noValidate` to the `<form>` element — schema validation replaces browser-native validation bubbles.
- Do not break native Enter-to-submit behavior — never call `preventDefault` on the wrong element.
- The submit button must be disabled while the mutation is pending (`mutation.isPending`).
- Show a loading label on the submit button during submission (e.g., `Creating...`, `Saving...`).

```tsx
<form
  onSubmit={(e) => {
    void handleSubmit(onSubmit)(e);
  }}
  noValidate
  className="grid gap-4 py-4"
>
  <div className="grid gap-2">
    <Label htmlFor="name">Name *</Label>
    <Input id="name" placeholder="e.g. Frontend" {...register('name')} />
    {errors.name && (
      <p className="text-sm text-destructive" role="alert">
        {errors.name.message}
      </p>
    )}
  </div>

  <Button type="submit" disabled={mutation.isPending}>
    {mutation.isPending ? 'Creating...' : 'Create'}
  </Button>
</form>
```

## Submission Handling

- Submit handlers are always `async` and use `mutation.mutateAsync()`.
- On success: show `toast.success()`, call `reset()`, and close the dialog or navigate.
- On failure: show `toast.error()` with a user-friendly message. Map known API error codes (e.g., `UserAlreadyExists`) to specific messages.
- Where possible, map server-side validation errors to specific form fields using `setError()` instead of only showing a generic toast.
- Never use `alert()`, `confirm()`, or `window.prompt()` — use Sonner toasts for feedback.
- Never call `fetch` or `axios` directly in submit handlers — always go through a TanStack Query mutation via a custom hook from `src/hooks/`.

```typescript
const onSubmit = async (data: TeamCreate) => {
  try {
    await mutation.mutateAsync(data);
    toast.success('Team created successfully');
    reset();
    // close dialog, navigate, etc.
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const message = mapServerError(axiosError) ?? 'Failed to create team';
    toast.error(message);
  }
};
```

## Dialog Forms

When a form lives inside a shadcn `Dialog`:

- Use controlled `open` state via `useState`.
- Always reset the form when the dialog closes via `onOpenChange`.
- Include Cancel and Submit buttons in `<DialogFooter>`.
- Cancel button: `type="button"` with `onClick={() => setOpen(false)}`.
- Submit button: `type="submit"` with `disabled={mutation.isPending}`.

```tsx
<Dialog
  open={open}
  onOpenChange={(nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }}
>
```

## Multi-Step Forms

- Split the form into discrete steps, each with its own Zod schema. Only validate the fields visible in the current step.
- Persist state across steps using form-level state (component state or a store) — not URL parameters. Users must not lose data when navigating between steps.
- Validate the current step before allowing navigation to the next step.
- Allow back-navigation without losing previously entered data.
- Show a progress indicator (stepper, progress bar) so users know where they are.
- On the final step, submit all accumulated data from all steps together.

## Validation Timing

React Hook Form's `mode` option controls **when** validation runs before the first submission. After a failed submit, `reValidateMode` (default `'onChange'`) takes over — errors clear as the user corrects them.

| `mode`        | Triggers validation on…       | Notes                                                                                    |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `'onSubmit'`  | Form submission only          | RHF default. No feedback until the user submits.                                         |
| `'onBlur'`    | Field blur                    | Validates when the user leaves a field.                                                  |
| `'onChange'`  | Every value change            | Immediate feedback but can be noisy and cause performance issues on large forms.         |
| `'onTouched'` | First blur, then every change | Hybrid — no error until the field is touched, then re-validates on each keystroke.       |
| `'all'`       | Both blur **and** change      | Combines `onBlur` and `onChange` — validates on blur and on every change simultaneously. |

- **Use `mode: 'all'` as the default for all forms.** It provides the best UX — the user gets immediate feedback both when leaving a field and while typing corrections.
- Override with a different mode only when there is an explicit reason (e.g., a very large form where `onChange` causes measurable performance issues).

## Error Display

- Error messages render **inline below the field** using `<p className="text-sm text-destructive" role="alert">`.
- Use `toast.error()` only for server-side submission errors — never for field-level validation.
- Use `setError()` to map API field-level errors back to specific form fields.

## Accessibility

- Every `<input>`, `<select>`, and `<textarea>` must have an associated visible `<Label>` connected via `htmlFor`/`id`. Never use a placeholder as a substitute for a label.
- Required fields must be indicated visually (asterisk after label text: `Name *`) and programmatically (`aria-required="true"`).
- Error messages must have `role="alert"` so screen readers announce them.
- Connect error messages to their fields with `aria-describedby` pointing to the error element's `id`.
- Set `aria-invalid="true"` on fields that have errors.
- Tab order must follow the visual layout — no unexpected focus jumps.
- Focus must move to the first invalid field after a failed submission attempt.
- The form must be submittable by pressing Enter in a text field.
- The form must be fully keyboard-navigable: Tab through fields, Enter to submit, Escape to close dialogs.

## Anti-Patterns

| Anti-Pattern                                           | Instead Do                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| Using `zodResolver` from `@hookform/resolvers/zod`     | Use `standardSchemaResolver` from `@hookform/resolvers/standard-schema`     |
| Manual validation in event handlers                    | Express all constraints in the Zod schema                                   |
| Duplicating types between schema and form              | Infer types with `z.infer<typeof schema>`                                   |
| Showing errors on every keystroke                      | Use submit, blur, or mixed-mode validation                                  |
| Placeholder as label (no visible `<Label>`)            | Always render a visible `<Label>` with `htmlFor`                            |
| Generic "Form has errors" message                      | Specific per-field error messages inline below each field                   |
| `alert()` / `confirm()` for feedback                   | Use Sonner `toast.success()` / `toast.error()`                              |
| Submit button without loading state                    | Disable button + change label during `mutation.isPending`                   |
| Raw `fetch`/`axios` in submit handler                  | Use TanStack Query mutation via a custom hook from `src/hooks/`             |
| Forgetting `reset()` on dialog close                   | Always reset form state in `onOpenChange` when dialog closes                |
| Creating ad-hoc Axios instances                        | Use the shared Axios instance from `src/lib/`                               |
| Hardcoding validation rules on the frontend            | Import shared schemas from `@happyrisk/core/schemas`                        |
| Omitting `defaultValues` in `useForm`                  | Always pass `defaultValues` to avoid uncontrolled input warnings            |
| Omitting `noValidate` on `<form>`                      | Always add `noValidate` — schema validation replaces browser-native bubbles |
| Using `toast` for field-level validation errors        | Show field errors inline; reserve toasts for server-side submission errors  |
| Inlining `Label` + `Input` + error for standard fields | Use composable field wrappers from `src/components/ui/`                     |

## Checklist

Before marking a form implementation as complete, verify:

- [ ] Zod schema defined (shared in `@happyrisk/core` or co-located if frontend-only)
- [ ] TypeScript type inferred from schema — no manual interface
- [ ] `standardSchemaResolver` used (not `zodResolver`)
- [ ] `defaultValues` provided to `useForm`
- [ ] `noValidate` on the `<form>` element
- [ ] Standard fields (text, select, checkbox, radio, textarea, date) use field wrapper components
- [ ] Every field has a visible `<Label>` with `htmlFor`
- [ ] Error messages shown inline below fields with `text-sm text-destructive`
- [ ] Error messages have `role="alert"`
- [ ] Submit button disabled during `mutation.isPending`
- [ ] Submit button shows loading text during submission
- [ ] Success toast via `toast.success()`
- [ ] Error toast via `toast.error()` with user-friendly message
- [ ] Form resets on successful submission and on dialog close
- [ ] Tab order follows visual layout
- [ ] Form submittable via Enter key
- [ ] Server errors mapped to fields via `setError()` where applicable
