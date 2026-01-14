# Form System Documentation

> **Reusable form components with automatic accessibility attributes**
> Location: `src/components/ui/form-fields.tsx`

## Overview

StepLeague uses a set of reusable form components that automatically generate `id` and `name` attributes from a `fieldName` prop. This eliminates browser DevTools warnings about form fields missing identifiers and ensures proper accessibility.

## Available Components

| Component | Use Case |
|-----------|----------|
| `FormInput` | Text, number, date, email, password inputs |
| `FormSelect` | Dropdown select menus |
| `FormCheckbox` | Checkbox with label |
| `FormTextarea` | Multi-line text input |
| `FormFileInput` | File upload input |

## Usage Examples

```tsx
import { 
  FormInput, 
  FormSelect, 
  FormCheckbox, 
  FormTextarea, 
  FormFileInput 
} from "@/components/ui/form-fields";

// Basic text input with label
<FormInput 
  fieldName="user-email" 
  label="Email Address" 
  type="email"
  required 
/>

// Input with hint text
<FormInput 
  fieldName="display-name" 
  label="Display Name" 
  hint="This will be shown on leaderboards"
/>

// Input with error state
<FormInput 
  fieldName="steps" 
  label="Step Count" 
  type="number"
  error={errors.steps}
/>

// Select dropdown
<FormSelect fieldName="league-select" label="Select League">
  <option value="">Choose a league...</option>
  <option value="1">League Alpha</option>
  <option value="2">League Beta</option>
</FormSelect>

// Checkbox
<FormCheckbox 
  fieldName="agree-terms" 
  label="I agree to the terms and conditions" 
/>

// Checkbox with hint
<FormCheckbox 
  fieldName="notifications" 
  label="Email notifications"
  hint="Receive weekly summary emails"
/>

// File upload
<FormFileInput 
  fieldName="screenshot" 
  label="Upload Screenshot" 
  accept="image/png,image/jpeg,image/heic"
  hint="PNG, JPG, or HEIC up to 5MB"
/>

// Textarea
<FormTextarea 
  fieldName="feedback-comment" 
  label="Additional Comments"
  rows={4}
/>
```

## Dynamic Field Names (Lists/Loops)

When rendering form fields in loops, append a unique identifier to the `fieldName`:

```tsx
{entries.map((entry) => (
  <div key={entry.id}>
    <FormInput 
      fieldName={`entry-date-${entry.id}`} 
      type="date" 
      value={entry.date}
      onChange={(e) => updateEntry(entry.id, "date", e.target.value)}
    />
    <FormInput 
      fieldName={`entry-steps-${entry.id}`} 
      type="number" 
      value={entry.steps}
      onChange={(e) => updateEntry(entry.id, "steps", e.target.value)}
    />
  </div>
))}
```

## Props Reference

### Base Props (All Components)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fieldName` | `string` | ✅ | Unique field identifier. Generates `id="form-{fieldName}"` and `name="{fieldName}"` |
| `label` | `string` | | Label text displayed above the input |
| `error` | `string` | | Error message displayed below input (red text) |
| `hint` | `string` | | Helper text displayed below input (muted text) |
| `containerClassName` | `string` | | Additional CSS classes for wrapper div |

### Additional Props

Each component also accepts all standard HTML attributes for its element type:

- `FormInput`: All `<input>` attributes (`type`, `value`, `onChange`, `placeholder`, `required`, etc.)
- `FormSelect`: All `<select>` attributes + `children` for options
- `FormCheckbox`: All `<input type="checkbox">` attributes + `checkboxPosition` ("left" | "right")
- `FormTextarea`: All `<textarea>` attributes (`rows`, `cols`, etc.)
- `FormFileInput`: All `<input type="file">` attributes (`accept`, `multiple`, etc.)

## Generated HTML

The components generate accessible HTML with proper attributes:

```tsx
<FormInput fieldName="email" label="Email" hint="Your email" />
```

Generates:

```html
<div class="flex flex-col gap-1.5">
  <label for="form-email" class="text-sm font-medium text-foreground">
    Email
  </label>
  <input 
    id="form-email" 
    name="email"
    aria-describedby="form-email-hint"
    class="..."
  />
  <p id="form-email-hint" class="text-xs text-muted-foreground">
    Your email
  </p>
</div>
```

## Accessibility Features

1. **Auto-generated `id` and `name`** - From `fieldName` prop
2. **Label linking** - `htmlFor` automatically matches input `id`
3. **aria-describedby** - Links hint/error text to input
4. **aria-invalid** - Set to "true" when error is present
5. **Error announcements** - Error messages have `role="alert"`
6. **Required indicator** - Asterisk shown for required fields

## Migration Guide

When encountering raw HTML form elements, migrate them:

```tsx
// ❌ WRONG - Raw HTML element (no id/name)
<input 
  type="text" 
  value={name} 
  onChange={(e) => setName(e.target.value)}
  className="rounded-md border border-input..."
/>

// ✅ CORRECT - Use FormInput
<FormInput 
  fieldName="user-name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

## Why This Matters

1. **Browser Autofill** - `name` attributes enable password managers and autofill
2. **DevTools Warnings** - Eliminates "form field should have id or name attribute" warnings
3. **Accessibility Audits** - Passes WCAG 2.1 requirements for form labeling
4. **Consistency** - Uniform styling and behavior across the app
5. **Testing** - Predictable IDs make automated testing easier

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-14 | Initial | Created form system documentation |
