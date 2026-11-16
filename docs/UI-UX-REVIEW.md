# UI and UX tip review

Reviewed the 37 distinct pages linked by the [UI collection](https://www.uidesign.tips/ui-tips)
and the 27 linked by the [UX collection](https://www.uidesign.tips/ux-tips).
Two UI cards reuse existing links. The tables account for those ideas as well.
The decisions apply to a desktop design system. Individual products own
their marketing, billing, migration, and sign-in flows.

## Changes in Nexis Design

| Before | After | Why |
| --- | --- | --- |
| An inset image had to pick an unrelated radius. | `CardMedia` subtracts the shared inset from the outer radius and uses a translucent surface ring. | The radii add up to the same center across both axes. |
| A thumbnail's minimum width could exceed its container. Zero or fractional column limits produced an invalid grid. | Clamp the column count to a positive integer and cap the effective minimum at the available width. | A narrow pane fits one card and a wide pane respects the cap. |
| A rail read each item's nearest positioning parent and only remeasured selection when the outer box resized. | Measure from the rail's origin and remeasure active and hovered items when rows or their groups change size. | Marks track nested, shifting, and differently sized targets. |
| Segments with differently sized labels had no shared track option or arrow navigation. | Give peer choices equal tracks with `equalWidth`. Arrow keys and Home/End follow the radio group. | The controls line up without losing keyboard access. |
| An avatar stack containing only the overflow badge still subtracted an overlap. | Offset the badge only when it actually overlaps another avatar. | The first visible item starts on the left edge of the group. |
| The virtual table assumed a 36 px header at every interface scale. | Measure its rendered header and derive the default row size at that scale. | Row estimates and spacer offsets use the same layout coordinates. |
| A line chart could plot comparison samples on a different grid, clip negative values, and misread the pointer under a scaled surface. | Share the primary sample positions, scale the signed domain around zero, and convert pointer coordinates into SVG coordinates. | The tick, line and hovered value describe the same sample. |
| Dialog examples could look clickable without doing anything, or claim a change without applying it. | Name the action, explain its scope, update state or report the result, and offer Undo where supported. | The action and the result agree. |
| A close icon could cover dialog copy and long modal footers could run off the screen. | Reserve space for the close icon, keep keyboard and visual footer order aligned, and allow constrained dialogs to scroll. | Long copy and larger interface settings keep controls reachable. |

## UI tips

| Idea | Decision |
| --- | --- |
| Social login | Product decision. Provide an alternative where a provider sign-in is useful. |
| Menu icons and active item | Keep icons for familiar scanning cues and use a check or semantic state for the active choice. Align icon slots in mixed rows. |
| Z-pattern composition | Context only. Desktop task order, predictable placement and reading direction govern layout. |
| Destructive confirmation copy | Adopted. Name the thing and operation. |
| Align uneven choices, including the duplicate card | Adopted for peer choices. Use equal tracks, shared labels or an aligned value column according to what users compare. |
| De-emphasize destructive actions | Adopted. Quiet trigger, explicit destructive confirmation, safe choice focused. |
| Above-the-fold action | Site or onboarding decision. A desktop screen can be informational. |
| Heading hierarchy | Covered by the existing typographic scale and constrained text widths. |
| Validate deletion | Adopted. Confirm irreversible loss and use Undo for reversible edits. |
| Starter templates in an empty state | Useful when samples get the user to a meaningful first result. Use the shared empty state. |
| Explain the next step | Adopted in overlay copy. Give the consequence wherever choosing it carries cost or loss. |
| Transparent avatar backing | Already provided by a neutral backing surface. |
| Transparent avatar outline | Already provided by an alpha outline. The stack's surface-colored separator preserves overlaps. |
| Nested card radius | Implemented using actual inset geometry. The 2:1 shortcut only fits certain insets. |
| Brand color restraint | Already a shared rule. Preserve quiet selection and visible focus. |
| Visible selection | Use the shared neutral treatments and semantics such as checked or selected. Add shape or text when color alone is ambiguous. |
| Actionable link labels | Keep links for navigation and buttons for state changes. Name the destination or task. |
| Consistent primary control | Already covered by the shared button hierarchy. |
| Media and gaze as a cue | Product storytelling option for a demo or walkthrough. |
| Hint at content below a page fold | Useful for shelves with clipped neighbors. Regular desktop panes can use scroll affordances. |
| Highlight a pricing plan | A billing or marketing choice. |
| Limit paragraph width | Keep logical line lengths using `ch` or a prose width. Reading products can choose a narrower measure. |
| Make an actionable card obvious | Retain a clear focusable target and visible action for ambiguous cards. Avoid redundant nested controls. |
| Self-explanatory inputs | Use a real label, the right control and examples only where they help. |
| Number control for small quantities | Already supported by `NumberInput`. Long numeric ranges may still need direct entry. |
| Distinguish tags from actions | Keep the existing component hierarchy and semantic roles. |
| Clickable help for touch | Use a popover when the user needs to open persistent help. Keep essential instructions visible. |
| Match chart to the question | Already documented. Use bars for counts across categories and time scales for dated samples. |
| Padding beside a rounded corner | Adopted as optical judgement with a shared geometric inset for actual nested arcs. |
| Distinguish objects with more than color | Covered by accessible names, selected states and icons or text for status. |
| Keep labels beside unfamiliar icons | Use visible labels for unfamiliar or consequential actions. |
| Names for swatches | Keep names available, including when tools display only the color. |
| Preview the current value | Useful for themes, typography and formatting controls when there is room. |
| Show shortcuts where used | Covered by menus, tooltips and the command palette. |
| Avoid action surprises | Adopted in modal examples and status feedback. |
| Prioritize task success over conversion | Keep habitual desktop controls stable. Avoid intercepting actions for conversion. |
| Visual hierarchy through grouping | Apply the shared type and spacing scale. Keep muted text legible. |
| Separate items by whitespace | Prefer gaps within related groups. Use alpha dividers to mark group boundaries. |

## UX tips

| Idea | Decision |
| --- | --- |
| Value calculator | Marketing content for products with a measurable benefit. |
| Red for consequential actions | Use the destructive tone for actual risk, with a verb and explanation. Ordinary importance uses the primary hierarchy. |
| Realistic mockups | Use real product screenshots in READMEs and useful fixtures in the gallery. |
| Specific numbers | Use real quantities and units when they inform an action. |
| Faces to build affinity | Product imagery choice. Preserve privacy and keep faces relevant to the task. |
| Testimonials during signup | Marketing content owned by the product. |
| Visual proof of product value | Use representative gallery and README examples. |
| Preview value near a call to action | Useful in onboarding when the preview clarifies the outcome. |
| Social authentication | Optional per product. Keep other supported sign-in paths easy to find. |
| Personalized live demo | Use disclosed sample data or the user's own choices when relevant. |
| Location-based presentation | Relevant to localization or a product demo. Omit unsolicited location inference from the scaffold. |
| Blur an interface to prompt payment or signup | Skip as a default. Describe access requirements plainly when a product has them. |
| Easy migration | Product feature. Use standard progress and recoverable errors for imports. |
| Social proof | Product messaging supported by real evidence. |
| Sign-in screen messaging | Keep sign-in task-focused. Add product context only where it helps. |
| Branding in announcements | Optional in onboarding or release material. Shared action and feedback patterns stay familiar. |
| Explain permission requests | Apply in apps before requesting a permission. Name what is needed and what it enables. |
| Pricing tiers with distinct symbols | A billing or marketing choice. Symbols may support names and prices. |
| Faces directing attention | A composition technique for relevant marketing imagery. |
| Character or mascot | A product asset when it suits the app. The launcher still uses the family mark. |
| Specific action copy | Adopted. Use the verb and the object or outcome. |
| Before-and-after visuals | Useful for review, documentation and product demos. |
| Distinctive interface | Apply a product point of view to its signature task and materials. See the branding guide. |
| Humor | Optional product voice. Keep errors and consequential actions literal. |
| Easter eggs | Optional extras. Required features stay discoverable in the usual interface. |
| Better plan comparisons | Owned by billing, with comparable terms and honest prices. |
| Different actions for new and returning users | Apply when the state is known, such as creating a first project or resuming one. |

[UI sources](https://www.uidesign.tips/ui-tips) · [UX sources](https://www.uidesign.tips/ux-tips)
