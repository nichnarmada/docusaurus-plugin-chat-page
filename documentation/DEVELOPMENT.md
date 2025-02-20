# Development Guide

## Project Architecture

This project consists of two main repositories:

1. **docusaurus-plugin-content-audit** (this repository)

   - Plugin source code and implementation
   - Located at: `~/Documents/projects/docusaurus-plugin-content-audit`
   - Contains all the plugin logic, theme components, and analysis tools

2. **docusaurus-ex** (test site)

   - Sample Docusaurus site for testing the plugin
   - Located at: `~/Documents/projects/docusaurus-ex`
   - Used to verify plugin functionality in a real Docusaurus environment

3. **@sample** (reference implementation)

   - Located in the `sample/` directory of this repository
   - Official Docusaurus plugin sample implementation
   - Use as reference for plugin structure and best practices
   - Demonstrates proper TypeScript setup and plugin architecture

## Development Workflow

Every time you make changes to the plugin, you need to:

1. **Build the plugin:**

   ```bash
   # In docusaurus-plugin-content-audit directory
   yarn clean        # Clean previous build
   yarn build        # Build the plugin
   ```

2. **Reinstall in test site:**

   ```bash
   # In docusaurus-ex directory
   rm -rf node_modules/docusaurus-plugin-content-audit  # Remove existing plugin
   yarn add file:../docusaurus-plugin-content-audit     # Install local plugin
   ```

3. **Start test site:**

   ```bash
   # In docusaurus-ex directory
   yarn start        # Start Docusaurus development server
   ```

## Plugin Configuration

Add the following to your `docusaurus.config.js`:

```js
module.exports = {
  // ... other config
  plugins: [
    [
      "docusaurus-plugin-content-audit",
      {
        // Plugin options
        label: "Audit Dashboard", // Text shown in navbar
        path: "/audit", // URL path for the audit dashboard
        showNavbar: true, // Whether to show in navbar

        // Coming soon:
        // analysisRules: {         // Configure analysis rules
        //   metadata: {
        //     required: ['title', 'description'],
        //     recommended: ['tags', 'authors']
        //   },
        //   content: {
        //     minLength: 100,
        //     maxHeaderDepth: 3
        //   }
        // },
        // severity: {              // Configure issue severity levels
        //   missingMetadata: 'error',
        //   brokenLinks: 'warning'
        // }
      },
    ],
  ],
}
```

### Configuration Options

| Option       | Type      | Default            | Description                                                                                   |
| ------------ | --------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `label`      | `string`  | `"Content Audit"`  | The text displayed in the navbar link                                                         |
| `path`       | `string`  | `"/content-audit"` | The URL path where the audit dashboard will be accessible. Should start with a forward slash. |
| `showNavbar` | `boolean` | `true`             | Whether to show the audit dashboard link in the navbar                                        |

## Project Structure

```
docusaurus-plugin-content-audit/
├── src/                      # Source code
│   ├── index.ts             # Plugin entry point
│   ├── theme/               # Theme components
│   │   └── ContentAudit/    # Audit dashboard component
│   └── types.ts             # TypeScript type definitions
├── lib/                      # Compiled code (generated)
├── documentation/           # Project documentation
└── package.json             # Plugin package definition
```

## Development Tips

1. **Watch Mode**

   - Use `yarn watch` in the plugin directory for automatic rebuilding
   - In a separate terminal, use `yarn start` in the test site

2. **Debugging**

   - Check the browser console for client-side issues
   - Check the terminal running Docusaurus for build/server issues
   - Plugin logs will show up in the Docusaurus build output

3. **Common Issues**

   - If changes aren't reflecting, ensure you've rebuilt and reinstalled
   - Check that the plugin is properly listed in docusaurus.config.js
   - Verify the path in browser matches your configured path

## Adding New Features

When adding new features:

1. Update the plugin options interface in `src/index.ts`
2. Add any new theme components in `src/theme/`
3. Update this documentation with new configuration options
4. Test in the sample site before committing

## Testing

Currently, manual testing is done in the docusaurus-ex repository. Automated tests will be added according to the checklist in `CHECKLIST.md`.

## Future Development

See `CHECKLIST.md` for the complete roadmap of planned features and enhancements.

## Plugin Method References

The plugin system in Docusaurus provides several lifecycle methods and hooks that can be implemented. Below is a comprehensive reference of available methods:

### Core Plugin Methods

#### Constructor

```typescript
export default function myPlugin(
  context: LoadContext,
  options: PluginOptions
): Plugin | Promise<Plugin>
```

The `context` object provides:

```typescript
type LoadContext = {
  siteDir: string // Root directory of the site
  generatedFilesDir: string // Directory for generated files
  siteConfig: DocusaurusConfig // Site configuration
  outDir: string // Build output directory
  baseUrl: string // Base URL of the site
}
```

#### Content Lifecycle

```typescript
async loadContent(): Promise<ContentAuditContent> {
  // Load and process content
  // Return data to be passed to contentLoaded
}

async contentLoaded({
  content,
  actions
}): Promise<void> {
  // Handle loaded content
  // Use actions like addRoute
}
```

#### Build Lifecycle

```typescript
async postBuild(props): Promise<void> {
  // After build completion
}

async postStart(props): Promise<void> {
  // After development server starts
}
```

#### Server Configuration

```typescript
afterDevServer(app, server): void {
  // After dev server setup
}

beforeDevServer(app, server): void {
  // Before dev server setup
}

configureWebpack(
  config,
  isServer,
  utils,
  content
): Object | Function {
  // Modify webpack configuration
}
```

#### Theme and Assets

```typescript
getPathsToWatch(): string[] {
  // Return paths to watch for changes
}

getThemePath(): string {
  // Return path to theme components
}

getClientModules(): string[] {
  // Return client-side modules to import
}
```

#### Customization and Internationalization

```typescript
injectHtmlTags({content}): {
  headTags?: HtmlTags;
  preBodyTags?: HtmlTags;
  postBodyTags?: HtmlTags;
} {
  // Inject HTML tags
}

async getTranslationFiles({content}): Promise<TranslationFile[]> {
  // Return translation files
}

translateContent({
  content,
  translationFiles
}): TranslatedContent {
  // Translate plugin content
}

translateThemeConfig({
  themeConfig,
  translationFiles
}): TranslatedThemeConfig {
  // Translate theme configuration
}
```

#### Validation

```typescript
export function validateOptions({ options, validate }): PluginOptions {
  // Validate plugin options
  return validate(myValidationSchema, options)
}

export function validateThemeConfig({ themeConfig, validate }): ThemeConfig {
  // Validate theme configuration
  return validate(myValidationSchema, themeConfig)
}
```

### Current Implementation Status

In our plugin, we currently implement:

- `loadContent`: Processes markdown content and generates audit data
- `contentLoaded`: Sets up routes and global data
- `getThemePath`: Provides theme components
- `getTypeScriptThemePath`: Provides TypeScript theme components
- `getThemeConfig`: Configures navbar integration

Future implementations will include:

- Content validation methods
- Build lifecycle hooks for caching
- Webpack configuration for optimizations
- Translation support
- See `CHECKLIST.md` for the complete roadmap
