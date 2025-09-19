# Accessibility Checklist (T069)

## Landmarks
- [ ] Page has main landmark
- [ ] Interactive modals trap focus

## Keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Escape closes modals (EventModal, TradeModal, CompletionDialog)

## ARIA / Semantics
- [ ] Role icons have accessible names
- [ ] HeaderBar conveys game status via `aria-live="polite"`

## Color & Contrast
- [ ] Role color chips pass WCAG AA contrast

## Motion / Timing
- [ ] No flashing animations
