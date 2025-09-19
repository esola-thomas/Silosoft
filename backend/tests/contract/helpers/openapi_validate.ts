// OpenAPI validation helper (T055) - placeholder
// Future: load openapi.yaml, compile schema validator (e.g., using openapi-schema-validator or ajv)
// For now provides a noop validate function so tests can import without failing.

export interface ValidationResult { valid: boolean; errors?: string[]; }

export function validateResponse(_path: string, _method: string, _status: number, _body: any): ValidationResult {
  // TODO implement real spec validation
  return { valid: true };
}