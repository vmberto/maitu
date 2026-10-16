# UI library

Use these components for shared controls rather than copying their styles into screens.

- `Button`: compact raised action; `tone="primary"`, `tone="danger"`, or `icon` for variants. `variant="row"` keeps menu actions quiet; `variant="touch"` leaves the surface to the caller. Defaults to `type="button"`; use `type="submit"` for form actions. `bind:element` exposes the native button when needed.
- `LinkButton`: the same raised or touch appearance with native link behavior.
- `Surface`: bordered, raised container; `as="section"` and `tone="danger"` are available.
- `ChoiceGroup`: compact radio choices with optional icon snippet and disabled choices. Use `Tabs` for switching views instead of choosing a saved value.
- `CompletionToggle`: raised task completion button; pass its label, pressed state, click handler, and disabled state.
- `Section`, `Disclosure`: titled content panels using the same raised finish.
- `ListIdentity`, `ListTypePicker`, `ListAppearance`: shared list creation/editing controls.
- `NewListDialog`: creation panel composed from these controls; load it on demand so it does not add work to startup.

`tokens.css` owns shared shadows, including dark-theme variants. `buttons.css` owns shared action states; `drawer.css` owns drawer layout. Task title and creation fields intentionally remain plain and borderless. Selected states are distinct from focus outlines; focus outlines are suppressed on shared buttons per the current design.
