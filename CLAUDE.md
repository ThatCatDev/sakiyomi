# Sakiyomi Development Guidelines

## UI/UX Patterns

### Feedback and Notifications
- **NEVER use `alert()`, `confirm()`, or `prompt()` - always use modals**
  - Browser dialogs are unstyled and inconsistent across browsers
  - Modals provide a consistent, styled experience
  - They can include actionable buttons (confirm, cancel)
  - Better accessibility support
  - For simple alerts: Use `window.showAlert?.({ type: 'error', title: '...', message: '...' })`
  - For confirmations: Create a confirmation modal component with accept/cancel buttons
  - For destructive actions: Use a dedicated confirmation modal (see `DeleteTeamModal.astro` pattern)

### Buttons and Interactive Elements
- All buttons must have clear affordances:
  - Hover states (color change, subtle animation)
  - Focus states (ring outline for keyboard navigation)
  - Active/pressed states
  - Disabled states (reduced opacity, no-cursor)
- Use semantic button types: `type="button"` or `type="submit"`

### Forms
- Show inline validation errors near the relevant field
- Use loading states on submit buttons
- Disable form submission while processing
- Show success/error feedback after form submission

## Code Patterns

### Database Functions
- Always use fully qualified type names in SQL functions (e.g., `public.invitation_status`)
- When using `set search_path = ''` for security, cast enums explicitly

### Testing
- All new features should have e2e test coverage
- Use Playwright's `getByRole` and `getByText` for accessibility-friendly locators
- Test both happy paths and error states

## File Structure

```
src/
  components/    # Reusable UI components
  layouts/       # Page layouts
  lib/           # Utility functions and API clients
  pages/         # Route handlers and pages
    api/         # API endpoints
supabase/
  migrations/    # Database migrations
  templates/     # Email templates
e2e/             # End-to-end tests
```
