# FEATURE_SPEC.md Maintenance Rule

## Automatic Update Requirement

After **every feature change** that modifies user-facing behavior, you MUST update `docs/FEATURE_SPEC.md`.

### When to Update

Update FEATURE_SPEC.md when:
- ✅ Adding new keyboard shortcuts
- ✅ Changing element properties or defaults
- ✅ Adding/removing element types
- ✅ Modifying interaction behaviors
- ✅ Changing rendering rules (z-order, zoom gating, etc.)
- ✅ Altering color palettes
- ✅ Updating formations
- ✅ Changing save/persistence behavior
- ✅ Adding/modifying export formats
- ✅ Changing history commit rules

### Update Process

1. **Locate affected section(s)** in FEATURE_SPEC.md
2. **Update behavior descriptions** to match new implementation
3. **Update default values** in both section and Appendix A
4. **Update keyboard shortcuts** in both §10 and CheatSheetOverlay (if applicable)
5. **Bump version** in Meta section
6. **Update "Last Updated" date**

### Validation Checklist

Before completing feature PR:
- [ ] FEATURE_SPEC.md updated for all behavior changes
- [ ] Default values in Appendix A match code
- [ ] Keyboard shortcuts in §10 match CheatSheetOverlay
- [ ] No contradictions between sections
- [ ] Version and date updated in Meta section

### Related Files

When updating FEATURE_SPEC.md, also verify consistency with:
- `packages/ui/src/CheatSheetOverlay.tsx` (keyboard shortcuts)
- `docs/contracts/*.md` (technical contracts)
- `CHANGELOG.md` (release notes)

---

**This rule is MANDATORY** — FEATURE_SPEC.md is the single source of truth for all user-facing behavior.
