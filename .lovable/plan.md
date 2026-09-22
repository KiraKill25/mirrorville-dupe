# Remove the splash overlay from setup

## Changes
- Gate the animated splash to the home route only, so navigating to `/setup` immediately removes it from the React tree.
- Make splash completion explicitly render nothing before notifying the root, preventing any overlay node from surviving its timer.
- Keep the setup player and timer inputs in the normal document flow, with no fixed or absolute parent covering them.
- Run the source type check and mobile production build to confirm Android-ready output.

## Technical details
- Update the root route to derive splash visibility from the active TanStack route and conditionally mount it only at `/`.
- Update `SplashScreen` with a terminal completed state that returns `null`.
- Do not change game logic, setup styling, timer behavior, or audio behavior.
