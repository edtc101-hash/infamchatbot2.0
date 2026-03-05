#!/usr/bin/env python3
# Description: A simple example of a chatbot using LangChain and OpenAI.

import os
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

# --- Configuration ---
# Make sure to set your OPENAI_API_KEY environment variable.
# You can get one from https://platform.openai.com/account/api-keys

# --- Initialization ---

def initialize_chatbot():
    """Initializes the chatbot components."""
    # Initialize the language model
    # Using a model with a high context window is recommended for chat.
    llm = ChatOpenAI(model_name="gpt-4.1-mini", temperature=0)

    # Initialize conversation memory
    # This memory stores the history of the conversation.
    memory = ConversationBufferMemory()

    # Initialize the conversation chain
    # This chain combines the LLM and the memory.
    conversation = ConversationChain(
        llm=llm,
        memory=memory,
        verbose=True  # Set to False in production
    )
    return conversation

# --- Main Execution ---

def main():
    """Main function to run the chatbot interaction."""
    print("Chatbot initialized. Type 'exit' to end the conversation.")
    
    # Get the initialized conversation chain
    chatbot = initialize_chatbot()

    while True:
        try:
            # Get user input
            user_input = input("You: ")

            # Check for exit condition
            if user_input.lower() == 'exit':
                print("Chatbot session ended.")
                break

            # Get the chatbot's response
            response = chatbot.predict(input=user_input)
            print(f"Bot: {response}")

        except KeyboardInterrupt:
            print("\nChatbot session ended by user.")
            break
        except Exception as e:
            print(f"An error occurred: {e}")
            break

if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set.")
        print("Please set it before running the script.")
    else:
        main()
