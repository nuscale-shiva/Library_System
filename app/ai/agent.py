from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from app.ai.tools import get_all_tools
from app.ai.rag import recommend_books
from app.ai.prompts import SYSTEM_PROMPT
import os
from typing import Dict, Any, List

try:
    from langfuse.callback import CallbackHandler
except ImportError:
    try:
        from langfuse import CallbackHandler
    except ImportError:
        CallbackHandler = None

class LibraryAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

        self.langfuse_handler = None
        if CallbackHandler and os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
            try:
                self.langfuse_handler = CallbackHandler(
                    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
                    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
                    host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
                )
            except Exception as e:
                print(f"Warning: Could not initialize Langfuse: {e}")

        self.tools = get_all_tools() + [recommend_books]

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])

        self.agent = create_openai_tools_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )

        self.sessions: Dict[str, ConversationBufferMemory] = {}

    def get_or_create_memory(self, session_id: str) -> ConversationBufferMemory:
        """Get or create memory for a session."""
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
        return self.sessions[session_id]

    def process_message(self, message: str, session_id: str = "default") -> Dict[str, Any]:
        """Process a user message and return the agent's response with tool call information."""
        memory = self.get_or_create_memory(session_id)

        agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=memory,
            verbose=True,
            return_intermediate_steps=True,
            handle_parsing_errors=True
        )

        try:
            callbacks = [self.langfuse_handler] if self.langfuse_handler else []

            result = agent_executor.invoke(
                {"input": message},
                config={"callbacks": callbacks}
            )

            tool_calls = []
            if "intermediate_steps" in result:
                for step in result["intermediate_steps"]:
                    if len(step) >= 2:
                        action, observation = step
                        tool_calls.append({
                            "tool": action.tool,
                            "input": action.tool_input,
                            "output": observation
                        })

            return {
                "response": result["output"],
                "tool_calls": tool_calls,
                "session_id": session_id
            }

        except Exception as e:
            return {
                "response": f"I encountered an error processing your request: {str(e)}",
                "tool_calls": [],
                "session_id": session_id,
                "error": str(e)
            }

    def clear_session(self, session_id: str):
        """Clear a specific session's memory."""
        if session_id in self.sessions:
            del self.sessions[session_id]

library_agent = LibraryAgent()
