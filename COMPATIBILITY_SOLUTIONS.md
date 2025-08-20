# ESM/CommonJS Compatibility Solutions

## The Issue

- Plugin uses remark v15 and strip-markdown v6 (ESM-only packages)
- Plugin compiles to CommonJS (for Docusaurus compatibility)
- CommonJS cannot `require()` ESM modules, causing the error

## Solutions

### Solution 1: Dynamic Imports (✅ Currently Implemented)

The current fix uses dynamic imports to load ESM modules from CommonJS:

```typescript
const dynamicImport = new Function("specifier", "return import(specifier)")
const remarkModule = await dynamicImport("remark")
const stripModule = await dynamicImport("strip-markdown")
```

**Pros:**

- Works with both ESM and CommonJS modules
- Maintains compatibility with latest package versions
- Already implemented and tested

**Cons:**

- Slightly more complex code
- Uses Function constructor (might trigger security scanners)

### Solution 2: Downgrade to CommonJS-Compatible Versions

Use older versions that still support CommonJS:

```json
{
  "dependencies": {
    "remark": "^12.0.0",
    "strip-markdown": "^4.0.0"
  }
}
```

**Pros:**

- Simple, no code changes needed
- Standard CommonJS imports work

**Cons:**

- Missing newer features and bug fixes
- Eventually will need to migrate anyway

### Solution 3: Make Build-Time Only

Since remark is only used during build (not runtime), we could:

1. Move to devDependencies
2. Pre-process all markdown during plugin development
3. Ship pre-processed data

**Pros:**

- No runtime dependencies on remark
- Faster build times for users

**Cons:**

- Cannot process user's documentation dynamically
- Would require major architectural changes

## Recommendation

**Stick with Solution 1 (dynamic imports)** as it:

- Is already implemented and working
- Maintains compatibility with all versions
- Allows users to use any version of remark in their own projects
- Future-proofs the plugin for ESM migration

## Testing the Fix

To test with different remark versions:

```bash
# Test with ESM version (v13+)
npm install remark@15

# Test with older CommonJS version
npm install remark@12

# Both should work with the dynamic import fix
```
