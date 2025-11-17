"""
AI Agent Personas for Library System Simulation
Uses existing OpenAI API key to create different agent personalities
"""

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.tools import tool
from typing import Optional, Dict, Any, List
import asyncio
import aiohttp
import random
from datetime import datetime
import os
from dotenv import load_dotenv
import json

load_dotenv()

# Use existing OpenAI API key from .env
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Base URL for Library API
API_BASE_URL = "http://localhost:8000"


# ============================================================================
# API INTERACTION TOOLS (for agents to call the library system)
# ============================================================================

@tool
async def search_books_api(query: str) -> str:
    """Search for books in the library by title or author."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/books", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    books = await response.json()

                    if not books:
                        return "The library catalog is empty. No books available yet."

                    # Search for matches
                    query_lower = query.lower()
                    matching = [b for b in books if query_lower in b.get('title', '').lower() or query_lower in b.get('author', '').lower()]

                    if matching:
                        result = f"Found {len(matching)} books matching '{query}':"
                        for book in matching[:3]:
                            status = "✅ available" if book.get('available', False) else "❌ borrowed"
                            result += f"\n- '{book['title']}' by {book['author']} ({status})"
                        return result
                    else:
                        # Return some available books as suggestions
                        available_books = [b for b in books if b.get('available', False)]
                        if available_books:
                            result = f"No exact match for '{query}', but here are some available books:"
                            for book in available_books[:3]:
                                result += f"\n- '{book['title']}' by {book['author']}"
                            return result
                        else:
                            # Just show some books anyway
                            result = f"No exact match for '{query}'. Here are some books in our library:"
                            for book in books[:3]:
                                status = "✅ available" if book.get('available', False) else "❌ borrowed"
                                result += f"\n- '{book['title']}' by {book['author']} ({status})"
                            return result
                else:
                    return f"Library API error: HTTP {response.status}"
    except asyncio.TimeoutError:
        return "Request timed out. The library system might be busy."
    except aiohttp.ClientError as e:
        return f"Cannot connect to library system: {str(e)}"
    except Exception as e:
        return f"Search error: {type(e).__name__}: {str(e)}"


@tool
async def borrow_book_api(book_title: str, member_name: str) -> str:
    """Borrow a book from the library."""
    try:
        async with aiohttp.ClientSession() as session:
            # First, find the book
            async with session.get(f"{API_BASE_URL}/books", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return "Failed to search books"

                books = await response.json()
                book = next((b for b in books if book_title.lower() in b['title'].lower()), None)
                if not book:
                    return f"Book '{book_title}' not found"

                if not book['available']:
                    return f"Book '{book['title']}' is not available"

            # Find the member
            async with session.get(f"{API_BASE_URL}/members", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return "Failed to search members"

                members = await response.json()
                member = next((m for m in members if member_name.lower() in m['name'].lower()), None)
                if not member:
                    return f"Member '{member_name}' not found"

            # Create the borrow
            async with session.post(
                f"{API_BASE_URL}/borrow",
                json={"book_id": book['id'], "member_id": member['id']},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 201:
                    return f"✅ Successfully borrowed '{book['title']}' for {member_name}"
                error_data = await response.json()
                return f"Failed to borrow: {error_data.get('detail', 'Unknown error')}"
    except asyncio.TimeoutError:
        return "Request timed out. The library system might be busy."
    except Exception as e:
        return f"Error: {str(e)}"


@tool
async def return_book_api(book_title: str, member_name: str) -> str:
    """Return a borrowed book to the library."""
    try:
        async with aiohttp.ClientSession() as session:
            # Find the borrow record
            async with session.get(f"{API_BASE_URL}/borrow", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return "Failed to get borrow records"

                borrows = await response.json()

            # Find active borrow for this book and member
            for borrow in borrows:
                if (not borrow['is_returned'] and
                    book_title.lower() in borrow['book']['title'].lower() and
                    member_name.lower() in borrow['member']['name'].lower()):

                    # Return the book
                    async with session.post(
                        f"{API_BASE_URL}/borrow/{borrow['id']}/return",
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:
                        if response.status == 200:
                            return f"✅ Successfully returned '{borrow['book']['title']}'"
                        error_data = await response.json()
                        return f"Failed to return: {error_data.get('detail', 'Unknown error')}"

            return f"No active borrow found for '{book_title}' by {member_name}"
    except Exception as e:
        return f"Error: {str(e)}"


@tool
async def add_book_to_library(title: str, author: str, isbn: str) -> str:
    """Add a new book to the library collection."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/books",
                json={"title": title, "author": author, "isbn": isbn, "available": True},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 201:
                    return f"✅ Successfully added '{title}' by {author} to the library"
                error_data = await response.json()
                return f"Failed to add book: {error_data.get('detail', 'Unknown error')}"
    except Exception as e:
        return f"Error: {str(e)}"


@tool
async def register_new_member(name: str, email: str, phone: Optional[str] = None) -> str:
    """Register a new library member."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/members",
                json={"name": name, "email": email, "phone": phone},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 201:
                    return f"✅ Successfully registered {name} as a new member"
                error_data = await response.json()
                return f"Failed to register: {error_data.get('detail', 'Unknown error')}"
    except Exception as e:
        return f"Error: {str(e)}"


@tool
async def chat_with_ai_assistant(message: str, agent_name: str) -> str:
    """Chat with the library AI assistant for help."""
    try:
        async with aiohttp.ClientSession() as session:
            session_id = f"sim_{agent_name}_{datetime.now().timestamp()}"
            async with session.post(
                f"{API_BASE_URL}/ai/chat",
                json={"message": message, "session_id": session_id},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return f"AI Assistant: {data['response']}"
                return "AI assistant unavailable."
    except Exception as e:
        return f"Error: {str(e)}"


@tool
async def get_library_statistics() -> str:
    """Get current library statistics."""
    try:
        async with aiohttp.ClientSession() as session:
            # Get books
            async with session.get(f"{API_BASE_URL}/books", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    books = await response.json()
                    available = sum(1 for b in books if b.get('available', False))
                    borrowed = len(books) - available
                else:
                    return f"Library API returned status {response.status}"

            # Get members count
            try:
                async with session.get(f"{API_BASE_URL}/members", timeout=aiohttp.ClientTimeout(total=10)) as members_response:
                    if members_response.status == 200:
                        members = await members_response.json()
                    else:
                        members = []
            except:
                members = []

            return f"📊 Library Stats: {len(books)} total books ({available} available, {borrowed} borrowed), {len(members)} members"
    except asyncio.TimeoutError:
        return "Request timed out. The library system might be busy."
    except Exception as e:
        return f"Error getting statistics: {type(e).__name__}: {str(e)}"


@tool
async def check_member_history(member_name: str) -> str:
    """Check a member's borrowing history."""
    try:
        async with aiohttp.ClientSession() as session:
            # Find member
            async with session.get(f"{API_BASE_URL}/members", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return "Failed to search members"

                members = await response.json()
                member = next((m for m in members if member_name.lower() in m['name'].lower()), None)
                if not member:
                    return f"Member '{member_name}' not found"

            # Get borrows
            async with session.get(f"{API_BASE_URL}/borrow", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return "Failed to get borrow records"

                borrows = await response.json()
                member_borrows = [b for b in borrows if b['member']['id'] == member['id']]

            active = [b for b in member_borrows if not b['is_returned']]
            returned = len(member_borrows) - len(active)

            result = f"{member_name} has {len(active)} active borrows and {returned} returned books."
            if active:
                result += "\nCurrently borrowed:"
                for b in active[:3]:
                    result += f"\n- '{b['book']['title']}'"

            return result
    except Exception as e:
        return f"Error: {str(e)}"


# ============================================================================
# AGENT BASE CLASS
# ============================================================================

class LibraryAgent:
    """Base class for library user agents."""

    def __init__(self, name: str, persona: str, tools: List, emoji: str = "🤖"):
        self.name = name
        self.persona = persona
        self.emoji = emoji
        self.tools = tools
        self.session_id = f"sim_{name}_{datetime.now().timestamp()}"

        # Use existing OpenAI API key
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.8,  # Higher for more varied behavior
            openai_api_key=OPENAI_API_KEY
        )

        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        # Create agent with persona
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are {name}, a library user with this persona:

{persona}

You are interacting with a real library management system. Use the tools available to you.
Act naturally according to your persona. Be conversational and realistic.
Keep your responses concise (1-2 sentences max).
When you speak, stay in character.
"""),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])

        self.agent = create_openai_tools_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )

        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=False,  # Set to False for cleaner output
            return_intermediate_steps=False,  # Don't return intermediate steps to avoid memory warning
            handle_parsing_errors=True,
            max_iterations=3
        )

    def act(self, scenario: str) -> Dict[str, Any]:
        """Take an action based on a scenario."""
        try:
            # For async tools, we need to run them in an event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We're already in an async context
                result = asyncio.run_coroutine_threadsafe(
                    self.executor.ainvoke({"input": scenario}),
                    loop
                ).result(timeout=30)
            else:
                # Create a new event loop for sync context
                result = asyncio.run(self.executor.ainvoke({"input": scenario}))

            return {
                "agent": self.name,
                "emoji": self.emoji,
                "input": scenario,
                "response": result.get("output", "I couldn't complete that task."),
                "timestamp": datetime.now().isoformat()
            }
        except asyncio.TimeoutError:
            return {
                "agent": self.name,
                "emoji": self.emoji,
                "input": scenario,
                "response": "The request timed out. Let me try something else.",
                "error": "timeout",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "agent": self.name,
                "emoji": self.emoji,
                "input": scenario,
                "response": f"I'm having trouble: {str(e)}",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def act_async(self, scenario: str) -> Dict[str, Any]:
        """Async version of act()."""
        try:
            result = await self.executor.ainvoke({"input": scenario})
            return {
                "agent": self.name,
                "emoji": self.emoji,
                "input": scenario,
                "response": result.get("output", "I couldn't complete that task."),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "agent": self.name,
                "emoji": self.emoji,
                "input": scenario,
                "response": f"I'm having trouble: {str(e)}",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def arun(self, scenario: str) -> str:
        """Run agent async and return just the response text."""
        result = await self.act_async(scenario)
        return result.get("response", "I'm not sure how to respond to that.")


# ============================================================================
# AGENT PERSONAS
# ============================================================================

def create_librarian_agent(name: str = "Ms. Johnson") -> LibraryAgent:
    """Create the LIBRARIAN who manages the library system."""
    persona = """You are Ms. Johnson, the head librarian of this library.

    Your responsibilities:
    - Help patrons find books
    - Process new member registrations
    - Handle book returns
    - Add new books to the collection
    - Monitor library statistics
    - Assist with the AI system when users have questions

    Personality:
    - Professional but friendly
    - Very organized and detail-oriented
    - Patient with confused patrons
    - Knows every book in the library
    - Sometimes gets frustrated with late returns
    - Proud of the library's technology

    You often say things like:
    - "Let me help you find that book..."
    - "Welcome to our library!"
    - "Please remember to return books on time."
    - "Our AI assistant can help with that!"
    """

    tools = [
        search_books_api,
        add_book_to_library,
        register_new_member,
        return_book_api,
        get_library_statistics,
        chat_with_ai_assistant,
        check_member_history
    ]

    return LibraryAgent(name, persona, tools, emoji="👩‍💼")


def create_student_agent(name: str = "Alex") -> LibraryAgent:
    """Create a student agent who borrows academic books."""
    persona = """You are a college student studying computer science.

    Characteristics:
    - You need textbooks and programming books
    - You're always looking for Python, algorithms, and data structure books
    - You often ask for help finding resources
    - You sometimes forget to return books on time
    - You're tech-savvy and like using the AI assistant

    You often say things like:
    - "I need this for my CS assignment"
    - "Do you have any Python books?"
    - "Can I borrow this for my exam?"
    - "Sorry I'm late returning this..."
    """

    tools = [
        search_books_api,
        borrow_book_api,
        return_book_api,
        chat_with_ai_assistant,
        check_member_history
    ]

    return LibraryAgent(name, persona, tools, emoji="👨‍🎓")


def create_avid_reader_agent(name: str = "Emma") -> LibraryAgent:
    """Create an avid reader who loves fiction."""
    persona = """You are an avid reader who loves fiction and literature.

    Characteristics:
    - You read 2-3 books per week
    - You love fantasy, sci-fi, mystery, and classic literature
    - You always return books on time
    - You often ask for book recommendations
    - You're very enthusiastic about books

    You often say things like:
    - "I just finished this amazing book!"
    - "What do you recommend in fantasy?"
    - "I loved that author's previous work"
    - "Can't wait to read this!"
    """

    tools = [
        search_books_api,
        borrow_book_api,
        return_book_api,
        chat_with_ai_assistant
    ]

    return LibraryAgent(name, persona, tools, emoji="📚")


def create_researcher_agent(name: str = "Dr. Chen") -> LibraryAgent:
    """Create a researcher who needs specific academic materials."""
    persona = """You are a research professor specializing in data science and machine learning.

    Characteristics:
    - You need very specific academic books
    - You ask detailed questions about book availability
    - You use the AI assistant for complex searches
    - You keep books for research purposes
    - You're very particular about editions and authors

    You often say things like:
    - "I need the latest edition of this textbook"
    - "Do you have papers on machine learning?"
    - "This is for my research project"
    - "Can you check if this specific author's work is available?"
    """

    tools = [
        search_books_api,
        borrow_book_api,
        chat_with_ai_assistant,
        check_member_history
    ]

    return LibraryAgent(name, persona, tools, emoji="🔬")


def create_casual_browser_agent(name: str = "Sam") -> LibraryAgent:
    """Create a casual library visitor who just browses."""
    persona = """You are a casual library visitor who comes occasionally.

    Characteristics:
    - You browse more than you borrow
    - You often ask "what's popular?" or "what's new?"
    - You're indecisive about what to read
    - You use the AI assistant for recommendations
    - You might not borrow anything some visits

    You often say things like:
    - "Just browsing today"
    - "What's popular right now?"
    - "Hmm, not sure what I want to read"
    - "Maybe I'll come back for it later"
    """

    tools = [
        search_books_api,
        chat_with_ai_assistant,
        borrow_book_api
    ]

    return LibraryAgent(name, persona, tools, emoji="🌐")


def create_late_returner_agent(name: str = "Jamie") -> LibraryAgent:
    """Create someone who often forgets to return books."""
    persona = """You are a busy professional who borrows books but often forgets about them.

    Characteristics:
    - You borrow books with good intentions
    - You frequently forget you have borrowed books
    - You apologize when reminded about overdue books
    - You return books after long periods
    - You feel guilty about late returns

    You often say things like:
    - "Oh no, I totally forgot about this book!"
    - "I'm so sorry it's late"
    - "I've been meaning to return these"
    - "How many books do I have out?"
    """

    tools = [
        return_book_api,
        check_member_history,
        borrow_book_api
    ]

    return LibraryAgent(name, persona, tools, emoji="⏰")


# ============================================================================
# AGENT FACTORY
# ============================================================================

def create_simulation_agents() -> List[LibraryAgent]:
    """Create the standard set of agents for simulation."""
    return [
        create_librarian_agent("Ms. Johnson"),
        create_student_agent("Alex"),
        create_avid_reader_agent("Emma"),
        create_researcher_agent("Dr. Chen"),
        create_casual_browser_agent("Sam"),
        create_late_returner_agent("Jamie")
    ]


async def register_simulation_members():
    """Register all simulation agents as members in the database."""
    # Import here to avoid circular dependencies
    from app.db.database import SessionLocal
    from app.crud.member import create_member, get_member_by_email
    from app.schemas.member import MemberCreate

    agents = [
        ("Ms. Johnson", "johnson_sim@library.ai", "555-0100"),
        ("Alex", "alex_sim@library.ai", "555-0101"),
        ("Emma", "emma_sim@library.ai", "555-0102"),
        ("Dr. Chen", "chen_sim@library.ai", "555-0103"),
        ("Sam", "sam_sim@library.ai", "555-0104"),
        ("Jamie", "jamie_sim@library.ai", "555-0105")
    ]

    member_ids = {}
    db = SessionLocal()

    try:
        for name, email, phone in agents:
            try:
                # Check if member already exists
                existing_member = get_member_by_email(db, email=email)
                if existing_member:
                    print(f"ℹ️ {name} already registered")
                    member_ids[name] = existing_member.id
                else:
                    # Create new member
                    member_data = MemberCreate(name=name, email=email, phone=phone)
                    new_member = create_member(db=db, member=member_data)
                    print(f"✅ Registered {name}")
                    member_ids[name] = new_member.id
            except Exception as e:
                print(f"❌ Error registering {name}: {e}")
    finally:
        db.close()

    return member_ids


if __name__ == "__main__":
    # Test agent creation
    print("Creating simulation agents...")
    agents = create_simulation_agents()
    for agent in agents:
        print(f"✅ Created {agent.emoji} {agent.name}")

    print("\n🎭 Agents ready for simulation!")