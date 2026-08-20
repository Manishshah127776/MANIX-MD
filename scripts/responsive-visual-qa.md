# Responsive visual QA

Date: 2026-08-20

The desktop local preview at `#home` renders the existing MANI XMD command-center sidebar, desktop navigation, balanced hero, 3D controls, overview cards, pairing actions, generated visuals, and live backend status without changing the real API hooks.

The responsive pass adds desktop max-width tuning at 1200px/1500px, 42px minimum navigation and action controls, 46px inputs, a mobile bottom quick-navigation dock, mobile-safe fixed bottom spacing, stacked action buttons, compact hero/phone artwork, two-column-to-one-column card behavior, smaller phone mockup sizing, and touch-hover suppression.

A Chromium 390x844 capture confirmed the new narrow viewport is being served and the page content is present beneath the startup veil. The headless capture retained the loading overlay during its short virtual-time window, so final phone behavior should also be checked in an interactive browser after the page has fully initialized. The production browser preview previously demonstrated that the existing loading screen clears normally in the interactive session.

## Glass dockbar update

The basic mobile dock was upgraded to a glass-style dockbar with a gradient highlight line, translucent blurred surface, five labeled controls, active route highlighting, lifted hover state on pointer devices, and a Settings button wired to the existing control-room modal. It remains full-width and touch-friendly on phones, while its desktop rule keeps it unobtrusive and ready for wider-screen navigation behavior. The current interactive desktop preview remains visually stable and the existing delegated `[data-route]` handler continues to control active states and navigation.
