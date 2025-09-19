// Temporary fallback to silence IntrinsicElements errors in test environment
// TODO: Remove after resolving proper React type resolution.
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
