# Detailed Roadmap for Docusaurus‑Plugin‑ChatPage

### Phase 1: Ingestion Pipeline Development (Build Time)

#### 1.1 Define Data Sources

- **Documentation Sources:**

  Identify the documentation pages (HTML, Markdown) and any GitHub codebase sections you want to include.

- **Loaders:**

  Use tools like LangChain’s **RecursiveURLLoader** and **SitemapLoader** to scrape the content during build time.

#### 1.2 Content Processing

- **Text Splitting:**

  Use LangChain’s **RecursiveCharacterTextSplitter** (or your own implementation) to divide the raw HTML/Markdown content into smaller, manageable chunks (e.g., 500–1000 tokens each).

  - **Store Metadata:** For each chunk, keep track of additional metadata (such as the source URL, title, and position in the document) to help provide context in the chat responses.

#### 1.3 Compute Embeddings

- **Embedding Calculation:**

  For each text chunk, call the OpenAI Embedding API (or another provider) to compute a vector representation.

  - **Security Note:** Since this is done at build time, the API key used for generating embeddings is not exposed at runtime.

- **Data Structure:**

  Organize the data as an array of objects, each containing:

  - The chunk’s text
  - Its metadata (source, title, etc.)
  - The computed embedding vector (typically an array of numbers)

#### 1.4 Persisting the Data

- **Serialize as JSON:**

  Once all chunks have been processed and their embeddings computed, serialize the entire vector index as a JSON object.

- **Integrate with Docusaurus Build:**

  Within your plugin’s `loadContent()` lifecycle hook, run the ingestion pipeline and return the processed data.

- **Using createData:**

  In the `contentLoaded()` lifecycle hook, use Docusaurus’s `createData` API to write the JSON object to a file (e.g., `embeddings.json`).

  - This JSON file will be bundled as a static asset with your site, making it accessible on the client without the need for a live database.

_Pseudocode Example for Build-Time Ingestion:_

```js
// plugins/docusaurus-plugin-chat-page/index.js
async function runIngestionPipeline() {
  // 1. Fetch documentation pages
  const docs = await RecursiveURLLoader("https://docs.example.com/sitemap.xml")

  // 2. Split docs into chunks
  const chunks = RecursiveCharacterTextSplitter.split(docs, {
    chunkSize: 1000,
    overlap: 100,
  })

  // 3. Compute embeddings for each chunk using OpenAI API
  const processedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await computeEmbedding(chunk.text) // Call OpenAI API
      return { text: chunk.text, metadata: chunk.metadata, embedding }
    })
  )

  return { chunks: processedChunks }
}

module.exports = function (context, options) {
  return {
    name: "docusaurus-plugin-chat-page",
    async loadContent() {
      const processedData = await runIngestionPipeline()
      return processedData
    },
    async contentLoaded({ content, actions }) {
      const { createData, addRoute } = actions
      // Write processed embeddings to a JSON file that will be served statically.
      const embeddingsPath = await createData(
        "embeddings.json",
        JSON.stringify(content)
      )

      // Register the chat route and pass the JSON asset to the chat page.
      addRoute({
        path: "/chat",
        component: "@site/src/components/ChatPage",
        modules: { embeddings: embeddingsPath },
        exact: true,
      })
    },
  }
}
```

---

### Phase 2: Plugin Development and Integration

#### 2.1 Create the Plugin

- **Folder Structure:**

  Set up a folder (e.g., `plugins/docusaurus-plugin-chat-page`) containing your plugin’s source code.

- **Lifecycle Hooks:**

  Implement the necessary lifecycle methods:

  - `loadContent()`: Run your ingestion pipeline.
  - `contentLoaded()`: Persist the JSON file and register your custom chat route.

#### 2.2 Configuration Options

- **User Configuration:**

  In your plugin options (set via `docusaurus.config.js`), allow maintainers to supply:

  - An OpenAI API key (if necessary for runtime operations like answer generation)
  - Optional settings (e.g., number of top results to retrieve, threshold for similarity search)

- **Example Configuration:**

```js
// docusaurus.config.js
module.exports = {
  // ...
  plugins: [
    [
      require.resolve("./plugins/docusaurus-plugin-chat-page"),
      {
        openaiApiKey: process.env.OPENAI_API_KEY,
        topK: 5, // Number of similar chunks to retrieve
      },
    ],
  ],
}
```

---

### Phase 3: Client‑Side Chat Component Development

#### 3.1 Building the Chat UI

- **React Component:**

  Develop a React component (e.g., `ChatPage.jsx`) that:

  - Renders the chat history and input field.
  - Maintains conversation state (using React state or Context API).
  - Displays results as they stream in.

- **UI Considerations:**

  Ensure responsiveness and an intuitive chat interface that matches your documentation’s theme.

#### 3.2 Loading the Static Embeddings

- **Dynamic Import:**

  In the ChatPage component, import or fetch the JSON file (the embeddings file) that was generated at build time.

  - This might be done via Webpack’s module resolution (the `modules.embeddings` prop) or by fetching the static file from the site’s assets.

#### 3.3 Handling User Queries

- **Query Processing:**

  1. **Conversation Context:**

     Gather the current chat history along with the new user query.

  2. **Rephrase the Query:**

     Optionally, use an LLM (via a prompt) to convert the conversation and new query into a standalone question.

- **Embedding the Query:**

  - **Compute Query Embedding:**

    Before performing similarity search, the user’s standalone query must be converted into its vector representation.

    - **Client‑Side Approach:**

      If feasible, use a lightweight client‑side embedding model (e.g., TensorFlow.js) to compute the query’s embedding without a backend.

      - _Note:_ Many embeddings models are large; if a lightweight model isn’t available, consider a minimal proxy function or serverless endpoint. However, if your goal is to keep it backend‑free, a small client‑side model or pre‑computed embeddings for common queries might be used.

- **Similarity Search:**

  - **Client‑Side Vector Search:**

    Use a library like [client‑vector‑search](https://github.com/yusufhilmi/client-vector-search) or [entity‑db](https://github.com/babycommando/entity-db) to perform a cosine similarity search over the pre‑computed embeddings.

  - **Retrieve Top K:**

    Fetch the top K document chunks that are most similar to the query embedding.

#### 3.4 Generating the Final Answer

- **Prompt Construction:**

  Concatenate the retrieved document chunks (as context) with the standalone query (and optionally the conversation history) to create a prompt.

- **LLM Call:**

  Using the OpenAI API key (supplied via configuration), call the OpenAI Chat API to generate an answer.

  - **Streaming:**

    If desired, implement response streaming to display tokens as they arrive.

- **Display the Answer:**

  Update the chat UI to show the generated answer along with the conversation history.

---

### Phase 4: Testing, Optimization, and Deployment

#### 4.1 Testing

- **Unit Testing:**

  Write tests for:

  - The ingestion pipeline (ensuring proper document splitting and embedding computation).
  - The JSON file generation using Docusaurus’s createData.
  - The client-side vector search logic.

- **Integration Testing:**

  Validate that the plugin’s lifecycle hooks properly intercept the Docusaurus build, generate the JSON file, and register the chat route.

- **User Acceptance Testing:**

  Conduct beta tests with actual documentation maintainers and end‑users. Collect feedback on response quality, speed, and UI/UX.

#### 4.2 Optimization

- **Build Performance:**

  Monitor the additional build time required for the ingestion pipeline. Optimize by caching results where possible.

- **Client-Side Performance:**

  Ensure that loading and querying the JSON file is efficient. If the vectorstore is large, consider lazy loading or partitioning strategies.

#### 4.3 Documentation & Deployment

- **Documentation:**

  Create detailed usage guides, configuration instructions, and troubleshooting tips.

- **Packaging:**

  Package your plugin (e.g., publish on npm) and include integration examples in your documentation.

- **Deployment:**

  Release the plugin as a beta, gather feedback, and iterate on the solution before a full release.

---

### Summary

1. **Build-Time Ingestion:**
   - Fetch documentation content → Split it into chunks → Compute embeddings using the OpenAI API → Serialize results as JSON via Docusaurus’s createData API.
2. **Plugin Integration:**
   - Implement loadContent() and contentLoaded() to run the ingestion pipeline during the Docusaurus build and register a custom chat route.
3. **Client-Side Chat Processing:**
   - Load the JSON vectorstore → On user query, compute a query embedding (or use a client‑side model) → Perform a similarity search → Retrieve relevant chunks → Construct a prompt and generate an answer using OpenAI’s Chat API.
4. **Testing & Deployment:**
   - Test each module, optimize for performance, document usage, and finally publish the plugin.

This detailed roadmap provides a clear path for developing a backend‑free, plug‑and‑play chat page plugin for Docusaurus that leverages a build‑time ingestion pipeline and client‑side retrieval‑augmented generation using minimal runtime configuration.
