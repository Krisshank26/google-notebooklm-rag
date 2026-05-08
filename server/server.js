import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai" 
import { GoogleGenAI } from "@google/genai" 
import dotenv from "dotenv" 
/* import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf" */ 
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf" 
import { QdrantVectorStore } from "@langchain/qdrant" 
import express from "express" 
import multer from "multer" 
import { Document } from "@langchain/core/documents" 
/* import path from "path" */ 
import cors from "cors" 
import fs from "fs" 
/* import { QdrantClient } from "@qdrant/js-client-rest" */ 

dotenv.config() 

const app= express() 

app.use(express.json() ) 

app.use(cors({ 
    origin: "https://google-notebooklm-rag-three.vercel.app", 
    credentials: true 
} ) ) 

const PORT= process.env.PORT || 8080 

const storage= multer.memoryStorage() 

const upload= multer({ 
    storage: storage 
} ) 

let collectionName= "document_collection" 

app.post("/api/upload", upload.single("document" ), async (req, res )=> 
{ 
    try { 
        let file= req.file 
        
        collectionName= req.file.originalname 

        if(file.mimetype=== "application/pdf" ) 
        { 
            const fileBlob= new Blob([file["buffer" ] ], {type: "application/pdf" } ) 

            /* console.log(fileBlob ) */ 

            const loader= new WebPDFLoader(fileBlob ) 

            const docs= await loader.load() 

            await indexing(docs ) 

            res.send({message: "Document has been processed completely here " } ) 
        } 
        else if(file.mimetype=== "text/plain" ) 
        { 
            const textContent= fs.readFileSync(file.path ) 

            const doc= new Document( 
                { 
                    pageContent: textContent, 
                    metadata: 
                    { 
                        source: req.file.originalname, 
                        mimetype: req.file.mimetype, 
                        size: req.file.size 
                    } 
                } 
            ) 

            await indexing(doc ) 

            res.send({message: "Document has been processed completely here " } ) 
        } 
        else 
        { 
            res.status(415 ).send({message: "File type is not supported here " } ) 
        } 
    } catch (error ) 
    { 
        console.log(error ) 
        res.status(500 ).send({message: "Internal Server Error Here: "+ error } ) 
    } 
} ) 

app.get("/api/query", async (req, res )=> 
{ 
    try { 
        const query= req.query.question 

        const responseData= await retrieval(query ) 

        res.send({modelResponse: responseData } ) 

    } catch (error ) 
    { 
        res.status(500 ).send({message: "Internal Server Error Here: "+ error } ) 
    } 
} ) 

const embeddings= new GoogleGenerativeAIEmbeddings({ 
    apiKey: process.env.GEMINI_API_KEY, 
    model: "gemini-embedding-001" 
} ) 

async function indexing(docs ) 
{ 
    try { 

        console.log("Documents are "+ embeddings ) 

        const vectorStore= await QdrantVectorStore.fromDocuments(docs, embeddings, { 
            url: process.env.QDRANT_URL, 
            apiKey: process.env.QDRANT_API_KEY, 
            collectionName: collectionName 
        } ) 

        console.log("Indexing is Completed "+ vectorStore ) 

        /* await retrieval() */ 
    } catch (error ) 
    { 
        console.log("Internal Server Error: "+ error ) 
        throw new Error("Internal Server Error: "+ error ) 
    } 
} 

async function retrieval(userQuery ) 
{ 
    console.log(userQuery ) 

    try { 
        const vectorStore= await QdrantVectorStore.fromExistingCollection(embeddings, { 
            url: process.env.QDRANT_URL, 
            apiKey: process.env.QDRANT_API_KEY, 
            collectionName: collectionName 
        } ) 

        const retrieveDocuments= vectorStore.asRetriever({ 
            k: 3 
        } ) 

        const searchedChunks= await retrieveDocuments.invoke(userQuery ) 

        /* console.log("Searched Chunks Here: "+ searchedChunks ) */ 

        const system_prompt= `You are an AI Assistant who helps resolving the user query based on the avaliable context provided to you from PDF file with the content and page number. 
        
        Rule : 

        - Only answer in Plain Text File format in a structured form, and in clean way. 

        - Only answer based on the avaliable context from the file only, and answer questions not related to file, with minimal out of context answers. 

        context: ${(JSON.stringify(searchedChunks ) ) } 

        ` 

        const client= new GoogleGenAI( 
            { 
                apiKey: process.env.GEMINI_API_KEY, 
            } 
        ) 

        const response= await client.models.generateContent({ 
            model: "gemini-3-flash-preview", 
            config: { 
                systemInstruction: system_prompt 
            }, 
            contents: userQuery 
        } ) 

        console.log("Model has retrieved the Information from the Document Given Here " ) 

        return response.text 
    } catch (error ) 
    { 
        console.log("Internal Server Error "+ error ) 
        throw new Error("Internal Server Error "+ error ) 
    } 
} 

app.listen(PORT, ()=> 
{ 
    console.log(`Server is running on http://localhost:${PORT }` ) 
} ) 