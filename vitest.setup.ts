import React from "react";
// Vitest doesn't automatically inject React in the global scope when using JSX
// with `jsx: preserve`. Providing it here prevents ReferenceError: React is not defined
// in component tests.
(globalThis as any).React = React;
