# Google NotebookLM RAG Application

A full-stack Retrieval-Augmented Generation (RAG) application that allows users to upload documents (PDF/TXT) and engage in a grounded, context-aware conversation with the content.

## 🚀 Live Project
**Link:** [https://google-notebooklm-rag-three.vercel.app] 

---

## 📌 Problem Statement
The goal was to build a version of Google's **NotebookLM** that facilitates "conversations with documents." The system must:
- Accept document uploads (PDF or plain text).
- Intelligently process and store content in a vector database.
- Provide answers based **strictly** on the document content using an LLM, preventing general-knowledge hallucinations.

## 🛠️ Tech Stack & Implementation
- **LLM & Embeddings:** Google Gemini (`gemini-3-flash-preview`) and `gemini-embedding-2`.
- **Backend:** Node.js with Express.
- **Orchestration:** LangChain for document loading, chunking, and RAG workflow management.
- **Vector Database:** Qdrant (Cloud) for storing and retrieving high-dimensional embeddings.
- **Frontend:** JavaScript, HTML5, and CSS3. 

## 💻 Frontend Solution (`script.js`)
The `script.js` file handles the user interface and asynchronous communication with the API:

1.  **File Validation:** Checks for valid `.pdf` or `.txt` formats and sizes before allowing upload.
2.  **Asynchronous Uploads:** Uses the `FormData` API and `fetch` to stream files to the `/api/upload` endpoint without page reloads.
3.  **State Management:** Implements dynamic "Status Pills" (Ready, Uploading, Processing) and a message system to guide the user through the RAG lifecycle.
4.  **Chat Interface:** - Prevents default form submissions to maintain the SPA (Single Page Application) feel.
    - Captures user input, encodes it for safety, and fetches grounded answers from the `/api/query` endpoint.
    - Dynamically appends chat bubbles for both user and AI messages with auto-scrolling.

## 🔄 RAG Pipeline
1.  **Ingestion:** Files are received via `multer` in memory.
2.  **Chunking & Embedding:** Documents are loaded using `WebPDFLoader` and converted into vectors using Google GenAI embeddings.
3.  **Indexing:** Vectors are stored in a dynamically named collection in Qdrant.
4.  **Retrieval:** When a user asks a question, the top 3 most relevant context chunks are retrieved.
5.  **Generation:** The LLM receives the chunks via a strict system prompt to ensure the final answer is grounded in the provided source.

## ⚠️ Limitations
- **Session Continuity:** A new vector collection is generated for every upload; refreshing the page resets the session as there is no persistent user account system.
- **Regional Restrictions:** The Google Gemini API `v1beta` models (used for embeddings) are subject to regional availability, which may affect deployment performance on certain cloud providers like Render.
- **File Types:** Currently restricted to `.pdf` and `.txt` files only.
- **Chunking Strategy:** Uses standard document loading; more advanced semantic chunking could improve retrieval for complex documents.
