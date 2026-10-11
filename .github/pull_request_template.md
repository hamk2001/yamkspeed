## Description

Please include a summary of the changes and the related issue/phase task.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Refactoring / Performance improvement
- [ ] Documentation update

## Checklist

### 🎯 Measurement Honesty
- [ ] No `Math.random` or simulated transfer numbers in `src/engine/**`.
- [ ] Failed transfers present honest errors rather than fallback mocks.
- [ ] Rate limits and cooldown periods are respected.

### 🌐 Internationalization & RTL
- [ ] All user-facing strings added to both `en.ts` and `ar.ts`.
- [ ] All 6 Arabic plural forms handled where applicable.
- [ ] Verified in both LTR (English) and RTL (Arabic) layouts.
- [ ] Logical CSS utilities used exclusively (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`); no physical `left`/`right`.
- [ ] BiDi isolation preserved for numbers, server names, and URLs.

### ♿ Accessibility & Theme
- [ ] WCAG 2.1 AA contrast ratios maintained in both Light and Dark themes.
- [ ] Tested with keyboard navigation and screen-reader accessibility labels.
- [ ] Respects `prefers-reduced-motion` settings.
