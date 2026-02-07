---
name: Vercel Composition Patterns
description: Guidelines for building flexible, maintainable React components using composition, state lifting, and compound components.
---

# Vercel Composition Patterns

This skill focuses on architectural patterns that make React codebases scalable and easier to maintain. Use these patterns when refactoring complex components or designing new reusable UI elements.

## When to Apply
- Refactoring components with too many props (especially boolean flags).
- Building reusable component libraries.
- Designing flexible component APIs.
- Managing shared state across multiple related components.

## 1. Component Architecture (HIGH)

### Avoid Boolean Props for Customization
Do not use boolean props to toggle behavior or appearance significantly. Instead, use composition to let the consumer inject the desired parts.
- **Rule**: `architecture-avoid-boolean-props`
- **Bad**: `<Card showHeader={true} showFooter={false} />`
- **Good**: 
  ```jsx
  <Card>
    <CardHeader>Title</CardHeader>
    <CardContent>...</CardContent>
  </Card>
  ```

### Compound Components
Structure complex components with shared context to allow flexible arrangement of sub-components.
- **Rule**: `architecture-compound-components`
- **Example**: DropdownMenu, Select, Modal.

## 2. State Management (MEDIUM)

### Decouple Implementation
The provider should be the only place that knows *how* state is managed. Consumers should just consume values and actions.
- **Rule**: `state-decouple-implementation`

### Context Interface
Define a generic interface for your context that includes `state`, `actions`, and `meta`. This makes dependency injection easier.
- **Rule**: `state-context-interface`

### Lift State
Move state into Provider components to allow sibling access without prop drilling.
- **Rule**: `state-lift-state`

## 3. Implementation Patterns (MEDIUM)

### Explicit Variants
Create explicit variant components instead of using boolean "modes".
- **Rule**: `patterns-explicit-variants`
- **Bad**: `<Button primary />`, `<Button secondary />` (if mutually exclusive and numerous)
- **Good**: `<PrimaryButton />`, `<SecondaryButton />` or strict variant prop `<Button variant="primary" />`

### Children over Render Props
Prefer using `children` for composition instead of `renderX` props, unless passing data back is strictly necessary.
- **Rule**: `patterns-children-over-render-props`

## 4. React 19 APIs (MEDIUM)
> **Note**: Only apply if using React 19+.

- **No forwardRef**: Use `props.ref` directly or `use()` hook instead of `forwardRef` / `useContext`.
- **Rule**: `react19-no-forwardref`
