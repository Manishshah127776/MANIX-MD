# MANI XMD glassmorphism implementation

This build applies the shared MANI XMD Glassmorphism Design System to the live pairing platform without replacing any backend functionality.

## Design-system coverage

The stylesheet now centralizes Soft, Standard, and Strong glass tokens, including surface opacity, borders, highlights, shadows, blur, accents, radii, and light/AMOLED overrides. Existing navigation, cards, dashboard panels, pairing panels, QR surfaces, pairing-code surfaces, settings, and the glass dockbar consume the shared token layer.

QR and phone-code surfaces use Strong glass with a dedicated high-contrast white QR scan area. Critical state and recovery text remains readable above decorative atmosphere. Focus-visible outlines cover interactive controls, inputs, tabs, menus, dialogs, and summaries.

## Runtime safeguards

Reduced-motion mode disables decorative scene opacity and long-running motion. Mobile breakpoints reduce blur and shadow cost, while forced-colors mode removes decorative transparency and uses system colors. Existing live state, QR, phone-code, Socket.IO, session, command, and Render hooks are unchanged.

## Definition of done

The glass system is considered complete when the core Pair and Dashboard workflows remain truthful to backend state; critical content is readable; pairing remains usable without WebGL; reduced-motion and forced-colors modes remain functional; and mobile devices receive a lower-cost visual treatment.
