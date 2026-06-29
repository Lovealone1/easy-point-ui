# UI Design Guidelines & Conventions

This document tracks unified UX/UI guidelines and design patterns adopted across the platform.

---

## 1. Select Dropdown Menu Positioning

To guarantee maximum visibility and accessibility of form inputs, select dropdown lists must **never overlay or cover the selection input triggers**. 

### Guidelines:
- **Placement**: Dropdown list items should always be rendered **underneath / below** the input component itself, leaving the trigger container free and visible.
- **Implementation**:
  - For standard Base UI / Radix UI Select components, set `alignItemWithTrigger={false}` on the `<SelectContent>` element.
  - This ensures option menus do not overlap or align on top of the input elements, providing a consistent standard desktop web select experience.
