# Apple Wallet Demo

## Current State
App has a LoginScreen with username/password and Internet Identity (II) login. Motion detection on ChargeScreen auto-triggers payment when phone is laid flat. Both have bugs.

## Requested Changes (Diff)

### Add
- Warmup period (1 second) after enabling charge motion before detection starts, to prevent false triggers on sensor initialization or permission dialog taps

### Modify
- **Login fix**: When user clicks "Sign in with Passkey or Google" (iiLogin button), if `identity` is already set (valid II session exists), skip calling `iiLogin()` and directly call `loginWithPrincipal` via the actor -- this prevents the "User is already authenticated" error from II
- **Login fix**: Show a loading/disabled state when `actor` is null/loading so users don't click login and get silent failure
- **Motion fix**: In `enableChargeMotion` handler, add a `motionReady` ref that starts false and becomes true after 1000ms delay. Only process `wasUpright && isFlat` detection when `motionReady` is true.

### Remove
- Nothing removed

## Implementation Plan
1. In LoginScreen: when II button clicked, if `identity` already exists, directly call `loginWithPrincipal` (via actor) instead of `iiLogin()`. If actor is still null, show disabled/loading state with a subtle message.
2. In enableChargeMotion: set a `motionReadyRef = useRef(false)`, set it to `true` via `setTimeout(1000)` after the handler is attached. Inside the handler, only run flat detection when `motionReadyRef.current` is true.
