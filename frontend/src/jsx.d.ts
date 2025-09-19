// Fallback JSX definitions for strict verbatimModuleSyntax inference issues
import type * as React from 'react';

declare global {
  namespace JSX {
    // Fallback: allow any standard element (temporarily) to suppress intrinsic element errors
    interface IntrinsicElements {
      [elemName: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
}
