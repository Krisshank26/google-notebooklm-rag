const API_BASE = "https://google-notebooklm-rag-1.onrender.com/api"; 
const UPLOAD_ENDPOINT = `${API_BASE}/upload`; 
const QUERY_ENDPOINT = `${API_BASE}/query`; 

const documentInput = document.getElementById("documentInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileInfo = document.getElementById("fileInfo");
const uploadMessage = document.getElementById("uploadMessage");
const chatBox = document.getElementById("chatBox");
const queryForm = document.getElementById("queryForm");
const queryInput = document.getElementById("queryInput");
const serverStatus = document.getElementById("serverStatus");

let uploadedSuccessfully = false;

function setStatus(text, state) {
  serverStatus.textContent = text;
  serverStatus.className = `status-pill ${state}`; 
}

function showUploadMessage(text, type = "") {
  uploadMessage.textContent = text;
  uploadMessage.className = `message-line ${type}`;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `msg ${role}`;
  bubble.innerHTML = escapeHtml(text);
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(text) {
  addMessage("system", text);
}

function resetChatHint() {
  if (!chatBox.querySelector(".msg")) {
    const empty = document.createElement("div");
    empty.className = "chat-empty";
    empty.textContent = "Upload a document and start asking questions here.";
    chatBox.appendChild(empty);
  }
}

resetChatHint();

documentInput.addEventListener("change", () => {
  const file = documentInput.files && documentInput.files[0];
  uploadedSuccessfully = false;

  if (!file) {
    fileInfo.textContent = "No file selected.";
    return;
  }

  const name = file.name.toLowerCase();
  const valid = name.endsWith(".pdf") || name.endsWith(".txt");

  if (!valid) {
    fileInfo.textContent = `Invalid format: ${file.name}. Only PDF and plain text (.txt) are allowed.`;
    fileInfo.style.color = "var(--danger)";
    showUploadMessage("Please choose a PDF or TXT file.", "error");
    return;
  }

  fileInfo.style.color = "var(--muted)";
  fileInfo.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
  showUploadMessage("");
});

uploadBtn.addEventListener("click", async (e ) => { 
  
  const file = documentInput.files && documentInput.files[0] ; 

  console.log(file ) 

  if (!file) {
    showUploadMessage("Please select a document first.", "error");
    setStatus("No file", "error");
    return;
  }

  const name = file.name.toLowerCase();
  const valid = name.endsWith(".pdf") || name.endsWith(".txt");

  if (!valid) {
    showUploadMessage("Invalid format. Only PDF and plain text files are allowed.", "error");
    setStatus("Rejected", "error");
    return;
  } 

  const formData = new FormData();
  formData.append("document", file);

  try {
    setStatus("Uploading...", "loading");
    uploadBtn.disabled = true;
    showUploadMessage("Uploading and processing the document on the server...", "") ; 

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    }); 

    /* console.log(response ) */ 

    const data = await response.json().catch(() => null) ; 

    if (!response.ok) { 
      const message = data?.message || "Upload failed." ; 
      throw new Error(message) ; 
    } 

    uploadedSuccessfully = true ; 
    const message = data?.message || "Document uploaded and processed successfully.";
    showUploadMessage(message, "success");
    setStatus("Processed", "success");
    addSystemMessage(message); 
    addSystemMessage("You can now ask questions about the uploaded document."); 
  } catch (error) {
    uploadedSuccessfully = false;
    showUploadMessage(error.message || "Something went wrong during upload.", "error");
    setStatus("Error", "error");
    addSystemMessage(`Upload error: ${error.message || "Unknown error"}`);
  } finally {
    uploadBtn.disabled = false;
  }
});

queryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = queryInput.value.trim();
  if (!question) return;

  addMessage("user", question);
  queryInput.value = "";

  if (!uploadedSuccessfully) {
    addSystemMessage("Please upload a valid document first.");
    return;
  }

  try {
    setStatus("Thinking...", "loading");

    const url = `${QUERY_ENDPOINT}?question=${encodeURIComponent(question)}`;
    const response = await fetch(url, { method: "GET" }); 
    const data = await response.json().catch(() => null); 

    console.log(data ) 

    if (!response.ok) {
      const message = data?.message || "Query failed.";
      throw new Error(message);
    }

    const answer = data?.answer || data?.response || data?.message || data?.modelResponse || "No answer returned by server.";
    addMessage("model", answer);
    setStatus("Ready", "success");
  } catch (error) {
    addSystemMessage(`Query error: ${error.message || "Unknown error"}`);
    setStatus("Error", "error");
  }
}); 
