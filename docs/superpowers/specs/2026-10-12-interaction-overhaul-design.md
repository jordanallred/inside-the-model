# Interaction Overhaul Design

## Intent

Make every interactive lesson feel like a purposeful experiment rather than a collection of controls and a text dump. The site remains an explanatory guide: interactions reveal one causal idea at a time and retain their real calculations.

## Interaction model

Every widget receives the same compact learning frame: an activity type, a one-sentence mission, two or three named experiments, and a visible explanation of the causal change. The frame is declarative data keyed by widget name, so coverage is auditable and a new widget cannot silently regress to an unstructured control panel.

The frame invokes named experiment setters where a widget offers meaningful alternate states. Widgets without a safe alternate state retain a reset action and use a focused observation prompt. Keyboard buttons, range inputs, and native controls remain the operating surface; the redesign does not replace accessible controls with a canvas-only UI.

## Modality choices

- Simulations (optimization, training, sampling, attention, routing) use experiment prompts and structured observations.
- Comparisons and calculators use named scenarios that establish a realistic baseline before changing a parameter.
- Hands-on editors and security exercises use a task prompt and visible observation result.
- The Explorer and quizzes keep their existing direct-manipulation and challenge modalities, with the shared frame documenting their purpose.

## Architecture

`public/js/interaction.js` owns the full widget registry and decorates each rendered widget after its initializer runs. `site.js` calls it once per widget. Optional widget-specific `data-action` buttons forward into each widget's existing event delegation, avoiding duplicated calculation logic. CSS defines the mission shell, experiment controls, and structured observation panel.

`tools/check-interactions.mjs` statically checks that every documentation widget has a registry entry and that every registry entry maps to a known initializer. It is run before the JavaScript syntax check and build.

## Accessibility and resilience

The shell uses labelled groups and real buttons. It never suppresses existing output or controls. If an optional experiment action is absent, its button is hidden rather than producing a broken state. The widgets still work without the frame if a script error prevents decoration.

## Verification

Run the interaction coverage check, JavaScript syntax check, project build, project checks, and trace verification. Then load representative simulation, calculator, editor, security, comparison, Explorer, and quiz routes at desktop and mobile widths, activate a suggested experiment, and confirm the visible result changes.
