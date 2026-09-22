# Restore Android touch input on setup

## Changes
- Clear `pointer-events`, `inert`, and `aria-hidden` from both `document.body` and `#root` when setup mounts.
- Wrap the setup contents in a route-local error boundary that displays the exact runtime error in a prominent red alert.
- Keep player names as isolated native text inputs and replace the styled timer switch with a native checkbox.
- Keep storage reads protected by separate error handling and remove setup-time media preloading.
- Verify type safety, the mobile bundle, and touch interaction at an Android-sized viewport.

## Technical details
- Preserve commit-on-blur player-name behavior, stable player IDs, timer durations, navigation, styling outside the switch, and all game logic.
- The cleanup runs only on `/setup` and does not introduce any new global state.
