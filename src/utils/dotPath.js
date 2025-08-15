// src/utils/dotPath.js

// Safely get a value from an object using a dot-path, e.g. "foo.bar.baz"
export function getByDotPath(obj, path) {
  if (!obj || typeof obj !== "object" || !path) return undefined
  return path.split('.').reduce(
    (acc, part) => acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined,
    obj
  )
}

// Optionally: a setter for dot-paths (for future control widgets)
export function setByDotPath(obj, path, value) {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {}
    }
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}
