#!/usr/bin/env python3
# Description: An example of deploying a chatbot with streaming responses using FastAPI.

import os
import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

# --- Configuration ---
# Make sure to set your OPENAI_API_KEY environment variable.

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Streaming Chatbot Server",
    description="A simple server that streams responses from a LangChain chatbot.",
)

# --- Chatbot Initialization ---
# Initialize the language model with streaming enabled
llm = ChatOpenAI(model_name="gpt-4.1-mini", temperature=0, streaming=True)

# --- API Endpoint ---

async def stream_chat_responses(message: str):
    """Asynchronously streams responses from the LLM."""
    try:
        # Use aiter to handle the async stream from the LLM
        async for chunk in llm.astream([HumanMessage(content=message)]):
            # The content of the chunk is what we want to send to the client
            content = chunk.content
            if content:
                yield content
                await asyncio.sleep(0.05) # Small delay for demonstration
    except Exception as e:
        print(f"An error occurred during streaming: {e}")
        yield f"Error: {e}"

@app.post("/chat/stream")
async def chat_stream(request: dict):
    """
    Endpoint to receive a message and stream back the chatbot's response.
    Expects a JSON body with a 'message' key.
    e.g., curl -X POST http://127.0.0.1:8000/chat/stream -H "Content-Type: application/json" -d '{"message": "Hello"}'
    """
    message = request.get("message")
    if not message:
        return {"error": "Message not provided"}, 400

    return StreamingResponse(
        stream_chat_responses(message),
        media_type="text/event-stream"
    )

@app.get("/")
def read_root():
    """Root endpoint to confirm the server is running."""
    return {"message": "Welcome to the Streaming Chatbot Server! Use the /chat/stream endpoint to interact."}

# --- Main Execution ---

if __name__ == "__main__":
    import uvicorn

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set.")
        print("Please set it before running the script.")
    else:
        print("Starting FastAPI server...")
        print("Access the API at http://127.0.0.1:8000")
        # To run this script, you need to install uvicorn and fastapi:
        # pip install uvicorn fastapi
        uvicorn.run(app, host="127.0.0.1", port=8000)
