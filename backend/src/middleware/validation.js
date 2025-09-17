const path = require('path');
const { AppError } = require('./errorHandler');

/**
 * Request Validation Middleware - Validates requests against OpenAPI schema
 * Provides structured validation with clear error messages
 */

/**
 * Load OpenAPI specification
 * @returns {Object} Parsed OpenAPI spec
 */
function loadOpenAPISpec() {
  try {
    // Load the OpenAPI spec from the contracts directory
    const specPath = path.join(__dirname, '../../../specs/feat/001-Silosoft-MVP/contracts/game-api.yaml');
    const fs = require('fs');
    const yaml = require('js-yaml');

    const specContent = fs.readFileSync(specPath, 'utf8');
    return yaml.load(specContent);
  } catch (error) {
    console.warn('Could not load OpenAPI spec for validation:', error.message);
    return null;
  }
}

/**
 * Validate request parameters against path parameters in OpenAPI spec
 * @param {Object} req - Express request object
 * @param {Object} pathSpec - OpenAPI path specification
 * @returns {Array} Array of validation errors
 */
function validatePathParameters(req, pathSpec) {
  const errors = [];

  if (!pathSpec.parameters) return errors;

  for (const param of pathSpec.parameters) {
    if (param.in === 'path' && param.required) {
      const value = req.params[param.name];

      if (!value) {
        errors.push({
          field: param.name,
          message: `Path parameter '${param.name}' is required`,
          location: 'path'
        });
        continue;
      }

      // Validate type
      if (param.schema?.type === 'string' && typeof value !== 'string') {
        errors.push({
          field: param.name,
          message: `Path parameter '${param.name}' must be a string`,
          location: 'path',
          value
        });
      }
    }
  }

  return errors;
}

/**
 * Validate request body against OpenAPI schema
 * @param {Object} req - Express request object
 * @param {Object} pathSpec - OpenAPI path specification
 * @returns {Array} Array of validation errors
 */
function validateRequestBody(req, pathSpec) {
  const errors = [];

  if (!pathSpec.requestBody) return errors;

  const requestBody = pathSpec.requestBody;
  const content = requestBody.content?.['application/json'];

  if (!content) return errors;

  const schema = content.schema;
  const body = req.body;

  // Check if body is required
  if (requestBody.required && (!body || Object.keys(body).length === 0)) {
    errors.push({
      field: 'body',
      message: 'Request body is required',
      location: 'body'
    });
    return errors;
  }

  if (!schema || !body) return errors;

  // Validate based on schema type
  if (schema.type === 'object') {
    errors.push(...validateObjectSchema(body, schema, 'body'));
  }

  return errors;
}

/**
 * Validate object against OpenAPI object schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - OpenAPI schema
 * @param {string} path - Field path for error reporting
 * @returns {Array} Array of validation errors
 */
function validateObjectSchema(obj, schema, path = '') {
  const errors = [];

  if (!schema.properties) return errors;

  // Check required fields
  if (schema.required) {
    for (const requiredField of schema.required) {
      if (!(requiredField in obj) || obj[requiredField] === null || obj[requiredField] === undefined) {
        errors.push({
          field: `${path}.${requiredField}`,
          message: `Field '${requiredField}' is required`,
          location: 'body'
        });
      }
    }
  }

  // Validate each property
  for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
    const fieldValue = obj[fieldName];
    const fieldPath = path ? `${path}.${fieldName}` : fieldName;

    if (fieldValue === undefined || fieldValue === null) {
      continue; // Skip undefined/null values (handled by required check)
    }

    errors.push(...validateFieldValue(fieldValue, fieldSchema, fieldPath));
  }

  return errors;
}

/**
 * Validate individual field value against schema
 * @param {*} value - Value to validate
 * @param {Object} schema - Field schema
 * @param {string} path - Field path for error reporting
 * @returns {Array} Array of validation errors
 */
function validateFieldValue(value, schema, path) {
  const errors = [];

  // Type validation
  if (schema.type) {
    if (!isValidType(value, schema.type)) {
      errors.push({
        field: path,
        message: `Field '${path}' must be of type ${schema.type}`,
        location: 'body',
        value,
        expectedType: schema.type
      });
      return errors; // Skip further validation if type is wrong
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      field: path,
      message: `Field '${path}' must be one of: ${schema.enum.join(', ')}`,
      location: 'body',
      value,
      allowedValues: schema.enum
    });
  }

  // String validations
  if (schema.type === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        field: path,
        message: `Field '${path}' must be at least ${schema.minLength} characters long`,
        location: 'body',
        value
      });
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        field: path,
        message: `Field '${path}' must be at most ${schema.maxLength} characters long`,
        location: 'body',
        value
      });
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      errors.push({
        field: path,
        message: `Field '${path}' cannot be empty`,
        location: 'body',
        value
      });
    }
  }

  // Number validations
  if (schema.type === 'number' || schema.type === 'integer') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        field: path,
        message: `Field '${path}' must be at least ${schema.minimum}`,
        location: 'body',
        value
      });
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        field: path,
        message: `Field '${path}' must be at most ${schema.maximum}`,
        location: 'body',
        value
      });
    }
  }

  // Array validations
  if (schema.type === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({
        field: path,
        message: `Field '${path}' must have at least ${schema.minItems} items`,
        location: 'body',
        value
      });
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({
        field: path,
        message: `Field '${path}' must have at most ${schema.maxItems} items`,
        location: 'body',
        value
      });
    }

    // Validate array items
    if (schema.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        errors.push(...validateFieldValue(item, schema.items, itemPath));
      });
    }
  }

  return errors;
}

/**
 * Check if value matches expected type
 * @param {*} value - Value to check
 * @param {string} expectedType - Expected type
 * @returns {boolean} True if type matches
 */
function isValidType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true; // Unknown type, assume valid
  }
}

/**
 * Get path specification from OpenAPI spec
 * @param {Object} spec - OpenAPI specification
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @returns {Object|null} Path specification or null if not found
 */
function getPathSpec(spec, method, path) {
  if (!spec || !spec.paths) return null;

  // Normalize path (remove /api/v1 prefix if present)
  const normalizedPath = path.replace(/^\/api\/v1/, '');

  // Find matching path in spec
  for (const [specPath, pathItem] of Object.entries(spec.paths)) {
    if (pathMatches(normalizedPath, specPath)) {
      return pathItem[method.toLowerCase()];
    }
  }

  return null;
}

/**
 * Check if request path matches OpenAPI path pattern
 * @param {string} requestPath - Actual request path
 * @param {string} specPath - OpenAPI path pattern
 * @returns {boolean} True if paths match
 */
function pathMatches(requestPath, specPath) {
  // Convert OpenAPI path pattern to regex
  const pattern = specPath.replace(/\{[^}]+\}/g, '[^/]+');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(requestPath);
}

/**
 * Main validation middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validationMiddleware(req, res, next) {
  try {
    // Skip validation for health check and non-API routes
    if (req.path === '/health' || !req.path.startsWith('/api/v1')) {
      return next();
    }

    // Load OpenAPI spec (with caching)
    if (!validationMiddleware.spec) {
      validationMiddleware.spec = loadOpenAPISpec();
    }

    const spec = validationMiddleware.spec;

    // If no spec available, log warning and continue
    if (!spec) {
      console.warn('OpenAPI spec not available, skipping validation');
      return next();
    }

    // Get path specification for current request
    const pathSpec = getPathSpec(spec, req.method, req.path);

    if (!pathSpec) {
      // Path not found in spec - let it through, 404 will be handled later
      return next();
    }

    // Validate request
    const errors = [];

    // Validate path parameters
    errors.push(...validatePathParameters(req, pathSpec));

    // Validate request body
    errors.push(...validateRequestBody(req, pathSpec));

    // If validation errors, return 400
    if (errors.length > 0) {
      const error = new AppError(
        `Validation failed: ${errors.map(e => e.message).join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
      error.validationErrors = errors;
      return next(error);
    }

    // Validation passed, continue
    next();

  } catch (error) {
    console.error('Validation middleware error:', error);
    // Don't block requests if validation fails internally
    next();
  }
}

// Check if js-yaml is available
let yamlAvailable = true;
try {
  require.resolve('js-yaml');
} catch (error) {
  console.warn('js-yaml not installed. Request validation will be skipped.');
  yamlAvailable = false;
}

// Export appropriate middleware based on yaml availability
if (yamlAvailable) {
  module.exports = validationMiddleware;
} else {
  // Return pass-through middleware if js-yaml is not available
  module.exports = (req, res, next) => next();
}