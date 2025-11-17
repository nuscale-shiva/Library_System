"""
Simulation Orchestrator
Coordinates agent interactions and streams events to frontend
"""

import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from simulation.agents import (
    create_librarian_agent,
    create_student_agent,
    create_avid_reader_agent,
    create_researcher_agent,
    create_casual_browser_agent,
    create_late_returner_agent,
    register_simulation_members,
    LibraryAgent
)


class EventType(Enum):
    """Types of events that can occur in the simulation."""
    AGENT_THINKING = "agent_thinking"
    AGENT_SPEAKING = "agent_speaking"
    AGENT_ACTION = "agent_action"
    SYSTEM_MESSAGE = "system_message"
    SCENARIO_START = "scenario_start"
    SCENARIO_END = "scenario_end"
    ERROR = "error"


@dataclass
class SimulationEvent:
    """An event that occurs during simulation."""
    event_id: str
    timestamp: datetime
    event_type: EventType
    agent_name: Optional[str]
    content: str
    details: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict:
        """Convert event to dictionary for JSON serialization."""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "agent_name": self.agent_name,
            "content": self.content,
            "details": self.details or {}
        }


class SimulationScenario:
    """Base class for simulation scenarios."""
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    async def run(self, agents: Dict[str, LibraryAgent], orchestrator: 'SimulationOrchestrator'):
        """Run the scenario with given agents."""
        raise NotImplementedError


class BusyDayScenario(SimulationScenario):
    """A busy day at the library with multiple patrons."""

    def __init__(self):
        super().__init__(
            "Busy Day",
            "A typical busy day at the library with students studying, readers browsing, and researchers working"
        )

    async def run(self, agents: Dict[str, LibraryAgent], orchestrator: 'SimulationOrchestrator'):
        """Run busy day scenario."""
        await orchestrator.emit_event(EventType.SCENARIO_START, None, f"Starting scenario: {self.name}")

        # Morning: Library opens
        await orchestrator.emit_event(EventType.SYSTEM_MESSAGE, None, "🌅 Library opens at 9:00 AM")
        await asyncio.sleep(0.5)

        # Librarian arrives and checks system
        librarian = agents.get("librarian")
        if librarian and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_THINKING, librarian.name, "Checking library statistics for the day...")
            response = await librarian.arun("Check how many books are currently borrowed and available")
            await orchestrator.emit_event(EventType.AGENT_ACTION, librarian.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Students arrive
        student = agents.get("student")
        if student and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_THINKING, student.name, "Looking for study materials...")
            response = await student.arun("Search for books about data structures and algorithms")
            await orchestrator.emit_event(EventType.AGENT_ACTION, student.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            # Student decides to borrow
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, student.name, "These look perfect for my exam!")
            response = await student.arun("Borrow the first available algorithms book")
            await orchestrator.emit_event(EventType.AGENT_ACTION, student.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Reader browsing
        reader = agents.get("reader")
        if reader and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_THINKING, reader.name, "Looking for a good novel...")
            response = await reader.arun("Search for fiction books or novels")
            await orchestrator.emit_event(EventType.AGENT_ACTION, reader.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Researcher working
        researcher = agents.get("researcher")
        if researcher and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_THINKING, researcher.name, "Need academic resources...")
            response = await researcher.arun("Search for academic papers or research books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, researcher.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Late returner arrives
        late_returner = agents.get("late_returner")
        if late_returner and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, late_returner.name, "Oh no, I forgot to return my books!")
            await orchestrator.emit_event(EventType.AGENT_THINKING, late_returner.name, "Checking my borrowed books...")
            response = await late_returner.arun("Check what books I have borrowed")
            await orchestrator.emit_event(EventType.AGENT_ACTION, late_returner.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            # Try to return
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, late_returner.name, "I should return these immediately!")
            response = await late_returner.arun("Return my first borrowed book")
            await orchestrator.emit_event(EventType.AGENT_ACTION, late_returner.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Browser exploring
        browser = agents.get("browser")
        if browser and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_THINKING, browser.name, "Just exploring what's available...")
            response = await browser.arun("Show me random interesting books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, browser.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Librarian checks end of day
        if librarian and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_THINKING, librarian.name, "Time to check today's activity...")
            response = await librarian.arun("Show me today's library statistics and any overdue books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, librarian.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        await orchestrator.emit_event(EventType.SYSTEM_MESSAGE, None, "🌙 Library closes at 8:00 PM")
        await orchestrator.emit_event(EventType.SCENARIO_END, None, f"Scenario '{self.name}' completed")


class ExamWeekScenario(SimulationScenario):
    """Exam week with many students looking for study materials."""

    def __init__(self):
        super().__init__(
            "Exam Week",
            "Finals week with many students frantically searching for study materials"
        )

    async def run(self, agents: Dict[str, LibraryAgent], orchestrator: 'SimulationOrchestrator'):
        """Run exam week scenario."""
        await orchestrator.emit_event(EventType.SCENARIO_START, None, f"Starting scenario: {self.name}")
        await orchestrator.emit_event(EventType.SYSTEM_MESSAGE, None, "📚 EXAM WEEK - Library Extended Hours")
        await asyncio.sleep(0.5)

        # Multiple students searching
        student = agents.get("student")
        if student and orchestrator.is_running:
            topics = [
                "calculus and linear algebra",
                "physics and quantum mechanics",
                "computer science and programming",
                "chemistry and organic compounds"
            ]

            for topic in topics[:2]:  # Only do 2 topics to save time
                if not orchestrator.is_running:
                    break
                await orchestrator.emit_event(EventType.AGENT_SPEAKING, student.name, f"I need books about {topic}!")
                response = await student.arun(f"Search for books about {topic}")
                await orchestrator.emit_event(EventType.AGENT_ACTION, student.name, response[:150] if len(response) > 150 else response)
                await asyncio.sleep(1)

        # Librarian helping
        librarian = agents.get("librarian")
        if librarian and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, librarian.name, "Let me help you find study materials!")
            response = await librarian.arun("Check which academic books are most popular this week")
            await orchestrator.emit_event(EventType.AGENT_ACTION, librarian.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        await orchestrator.emit_event(EventType.SCENARIO_END, None, f"Scenario '{self.name}' completed")


class BookClubScenario(SimulationScenario):
    """Book club meeting discussing latest reads."""

    def __init__(self):
        super().__init__(
            "Book Club Meeting",
            "Monthly book club gathering to discuss recent reads"
        )

    async def run(self, agents: Dict[str, LibraryAgent], orchestrator: 'SimulationOrchestrator'):
        """Run book club scenario."""
        await orchestrator.emit_event(EventType.SCENARIO_START, None, f"Starting scenario: {self.name}")
        await orchestrator.emit_event(EventType.SYSTEM_MESSAGE, None, "📖 Book Club Meeting - 3:00 PM")
        await asyncio.sleep(0.5)

        # Readers discussing books
        reader = agents.get("reader")
        if reader and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, reader.name, "Let's discuss this month's book!")
            response = await reader.arun("What fiction books are currently most borrowed?")
            await orchestrator.emit_event(EventType.AGENT_ACTION, reader.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await orchestrator.emit_event(EventType.AGENT_SPEAKING, reader.name, "I'd like to recommend a book for next month")
            response = await reader.arun("Search for highly rated fiction books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, reader.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        # Browser participating
        browser = agents.get("browser")
        if browser and orchestrator.is_running:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, browser.name, "I'm new here, what genres do you usually read?")
            response = await browser.arun("Show me different book categories available")
            await orchestrator.emit_event(EventType.AGENT_ACTION, browser.name, response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

        await orchestrator.emit_event(EventType.SCENARIO_END, None, f"Scenario '{self.name}' completed")


class SimulationOrchestrator:
    """Orchestrates the library simulation."""

    def __init__(self):
        self.agents: Dict[str, LibraryAgent] = {}
        self.events: List[SimulationEvent] = []
        self.is_running = False
        self.event_callbacks = []
        self.current_scenario: Optional[SimulationScenario] = None

        # Available scenarios
        self.scenarios = {
            "busy_day": BusyDayScenario(),
            "exam_week": ExamWeekScenario(),
            "book_club": BookClubScenario()
        }

    async def initialize_agents(self) -> Dict[str, str]:
        """Initialize all agents and register them as members."""
        print("🚀 Initializing simulation agents...")

        # Register simulation members
        member_ids = await register_simulation_members()

        # Create agents
        self.agents = {
            "librarian": create_librarian_agent(),
            "student": create_student_agent(),
            "reader": create_avid_reader_agent(),
            "researcher": create_researcher_agent(),
            "browser": create_casual_browser_agent(),
            "late_returner": create_late_returner_agent()
        }

        print(f"✅ Initialized {len(self.agents)} agents")
        return member_ids

    async def emit_event(
        self,
        event_type: EventType,
        agent_name: Optional[str],
        content: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """Emit a simulation event."""
        event = SimulationEvent(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            event_type=event_type,
            agent_name=agent_name,
            content=content,
            details=details
        )

        self.events.append(event)

        # Call registered callbacks
        for callback in self.event_callbacks:
            await callback(event)

        # Terminal output for debugging
        prefix = f"[{agent_name}]" if agent_name else "[SYSTEM]"
        print(f"{prefix} {content}")

    def add_event_callback(self, callback):
        """Add a callback for event streaming."""
        self.event_callbacks.append(callback)

    async def run_scenario(self, scenario_name: str):
        """Run a specific scenario."""
        if scenario_name not in self.scenarios:
            await self.emit_event(
                EventType.ERROR,
                None,
                f"Unknown scenario: {scenario_name}"
            )
            return

        self.current_scenario = self.scenarios[scenario_name]
        self.is_running = True

        try:
            await self.current_scenario.run(self.agents, self)
        except Exception as e:
            await self.emit_event(
                EventType.ERROR,
                None,
                f"Error in scenario: {str(e)}"
            )
        finally:
            self.is_running = False
            self.current_scenario = None

    async def run_continuous(self, duration_minutes: int = 5):
        """Run continuous simulation for specified duration."""
        self.is_running = True
        start_time = datetime.now()
        end_time = start_time + timedelta(minutes=duration_minutes)

        await self.emit_event(
            EventType.SYSTEM_MESSAGE,
            None,
            f"🎬 Starting continuous simulation for {duration_minutes} minutes (until {end_time.strftime('%H:%M:%S')})"
        )

        scenario_count = 0
        last_progress_update = 0

        while self.is_running and datetime.now() < end_time:
            time_elapsed = (datetime.now() - start_time).total_seconds()
            time_remaining = (end_time - datetime.now()).total_seconds()

            # Progress update every 30 seconds
            minutes_elapsed = int(time_elapsed / 60)
            if time_elapsed - last_progress_update >= 30 and time_elapsed > 0:
                last_progress_update = time_elapsed
                time_remaining_min = int(time_remaining / 60)
                time_remaining_sec = int(time_remaining % 60)
                await self.emit_event(
                    EventType.SYSTEM_MESSAGE,
                    None,
                    f"⏰ Progress: {minutes_elapsed}m {int(time_elapsed % 60)}s elapsed | {time_remaining_min}m {time_remaining_sec}s remaining | {scenario_count} interactions completed"
                )

            # Run quick interactions instead of full scenarios
            await self.run_quick_interaction()
            scenario_count += 1

            # Short pause between interactions
            wait_time = min(random.uniform(3, 8), time_remaining)
            if wait_time > 0:
                await asyncio.sleep(wait_time)

        # Final summary
        total_time = (datetime.now() - start_time).total_seconds()
        await self.emit_event(
            EventType.SYSTEM_MESSAGE,
            None,
            f"✅ Continuous simulation completed! Ran {scenario_count} interactions in {int(total_time/60)}m {int(total_time%60)}s"
        )
        self.is_running = False

    async def run_quick_interaction(self):
        """Run realistic library interactions between agents."""
        scenarios = [
            "student_needs_help", "book_club_discussion", "return_queue",
            "recommendation_chat", "study_group", "closing_rush",
            "new_arrival", "overdue_panic", "research_consultation"
        ]

        scenario = random.choice(scenarios)
        await self.emit_event(
            EventType.SYSTEM_MESSAGE,
            None,
            f"🏛️ Library Scene: {scenario.replace('_', ' ').title()}"
        )

        # Execute realistic scenarios
        if scenario == "student_needs_help":
            await self._student_help_scenario()
        elif scenario == "book_club_discussion":
            await self._book_club_chat()
        elif scenario == "return_queue":
            await self._return_queue_scenario()
        elif scenario == "recommendation_chat":
            await self._recommendation_conversation()
        elif scenario == "study_group":
            await self._study_group_scenario()
        elif scenario == "closing_rush":
            await self._closing_time_rush()
        elif scenario == "new_arrival":
            await self._new_member_scenario()
        elif scenario == "overdue_panic":
            await self._overdue_books_scenario()
        elif scenario == "research_consultation":
            await self._research_help_scenario()

    async def _student_help_scenario(self):
        """Student asks librarian for help finding books."""
        student = self.agents.get("student")
        librarian = self.agents.get("librarian")

        if student and librarian and self.is_running:
            # Student approaches desk
            await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                 "Excuse me, Ms. Johnson? I have an exam tomorrow...")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "Of course, Alex! What subject is your exam on?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                 "Data structures and algorithms. I need something comprehensive.")

            response = await librarian.arun("Help find comprehensive data structures and algorithms books")
            await self.emit_event(EventType.AGENT_ACTION, librarian.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                 "Thanks! I'll take the first one if it's available.")

            response = await student.arun("Borrow the data structures book the librarian recommended")
            await self.emit_event(EventType.AGENT_ACTION, student.name,
                                 response[:150] if len(response) > 150 else response)

    async def _book_club_chat(self):
        """Book club members discuss their latest read."""
        reader = self.agents.get("reader")
        browser = self.agents.get("browser")

        if reader and browser and self.is_running:
            await self.emit_event(EventType.AGENT_SPEAKING, reader.name,
                                 "Sam! Did you finish this month's book club selection?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, browser.name,
                                 "Not yet, Emma. I'm only halfway through. It's really engaging though!")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, reader.name,
                                 "I know! The plot twist in chapter 12 was incredible.")

            response = await reader.arun("Search for similar mystery novels for next month's book club")
            await self.emit_event(EventType.AGENT_ACTION, reader.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, browser.name,
                                 "Those sound interesting! Let me check what else is available.")

            response = await browser.arun("Browse mystery and thriller section")
            await self.emit_event(EventType.AGENT_ACTION, browser.name,
                                 response[:150] if len(response) > 150 else response)

    async def _return_queue_scenario(self):
        """Multiple people waiting to return books."""
        late_returner = self.agents.get("late_returner")
        student = self.agents.get("student")
        librarian = self.agents.get("librarian")

        if late_returner and student and librarian and self.is_running:
            await self.emit_event(EventType.SYSTEM_MESSAGE, None,
                                 "📚 A line forms at the returns desk")
            await asyncio.sleep(0.5)

            await self.emit_event(EventType.AGENT_SPEAKING, late_returner.name,
                                 "*nervously* I have several overdue books to return...")

            await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                 "*waiting in line* Me too, I need to return these before borrowing new ones.")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "No worries, Jamie. Let's check what you have out.")

            response = await late_returner.arun("Return all my overdue books and check if there are any fines")
            await self.emit_event(EventType.AGENT_ACTION, late_returner.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "All set! Alex, you're next.")

            response = await student.arun("Return my borrowed books")
            await self.emit_event(EventType.AGENT_ACTION, student.name,
                                 response[:150] if len(response) > 150 else response)

    async def _recommendation_conversation(self):
        """Patrons discuss book recommendations."""
        reader = self.agents.get("reader")
        researcher = self.agents.get("researcher")

        if reader and researcher and self.is_running:
            await self.emit_event(EventType.AGENT_SPEAKING, reader.name,
                                 "Dr. Chen, I noticed you're always reading academic texts. Do you ever read fiction?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, researcher.name,
                                 "Actually, I enjoy sci-fi when I have time. It often inspires my research.")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, reader.name,
                                 "You should try 'The Three-Body Problem'! It combines physics with amazing storytelling.")

            response = await reader.arun("Find 'The Three-Body Problem' or similar sci-fi books")
            await self.emit_event(EventType.AGENT_ACTION, reader.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, researcher.name,
                                 "That sounds fascinating! Let me check if it's available.")

            response = await researcher.arun("Search for science fiction books with scientific themes")
            await self.emit_event(EventType.AGENT_ACTION, researcher.name,
                                 response[:150] if len(response) > 150 else response)

    async def _study_group_scenario(self):
        """Students form a study group."""
        student = self.agents.get("student")
        browser = self.agents.get("browser")

        if student and browser and self.is_running:
            await self.emit_event(EventType.SYSTEM_MESSAGE, None,
                                 "💡 Study area is getting busy")
            await asyncio.sleep(0.5)

            await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                 "Hey, are you studying for finals too?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, browser.name,
                                 "Just trying to find some reference materials. What are you working on?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                 "Programming concepts. Want to join our study group? We're in the quiet section.")

            response = await student.arun("Find programming and computer science study materials")
            await self.emit_event(EventType.AGENT_ACTION, student.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, browser.name,
                                 "Sure! Let me grab some books first.")

            response = await browser.arun("Look for beginner programming books")
            await self.emit_event(EventType.AGENT_ACTION, browser.name,
                                 response[:150] if len(response) > 150 else response)

    async def _closing_time_rush(self):
        """Library is about to close, last-minute activities."""
        librarian = self.agents.get("librarian")
        student = self.agents.get("student")
        reader = self.agents.get("reader")

        if librarian and (student or reader) and self.is_running:
            await self.emit_event(EventType.SYSTEM_MESSAGE, None,
                                 "📢 Library closes in 15 minutes!")
            await asyncio.sleep(0.5)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "Attention everyone! We're closing in 15 minutes. Please bring any books you'd like to borrow to the desk.")
            await asyncio.sleep(0.8)

            if student:
                await self.emit_event(EventType.AGENT_SPEAKING, student.name,
                                     "Quick! I need to borrow this book before you close!")

                response = await student.arun("Quickly borrow any available book I need")
                await self.emit_event(EventType.AGENT_ACTION, student.name,
                                     response[:150] if len(response) > 150 else response)

            if reader:
                await self.emit_event(EventType.AGENT_SPEAKING, reader.name,
                                     "I'll return this one and grab the sequel!")

                response = await reader.arun("Return current book and borrow the next in the series")
                await self.emit_event(EventType.AGENT_ACTION, reader.name,
                                     response[:150] if len(response) > 150 else response)

    async def _new_member_scenario(self):
        """New member joins the library."""
        browser = self.agents.get("browser")
        librarian = self.agents.get("librarian")

        if browser and librarian and self.is_running:
            await self.emit_event(EventType.AGENT_SPEAKING, browser.name,
                                 "Hi, I'm new to the area. How do I join the library?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "Welcome! I can help you with that. We just need some basic information.")
            await asyncio.sleep(0.8)

            response = await librarian.arun("Help new member understand library services and popular books")
            await self.emit_event(EventType.AGENT_ACTION, librarian.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, browser.name,
                                 "Great! What books would you recommend for someone who likes mysteries?")

            response = await browser.arun("Browse mystery section and popular books")
            await self.emit_event(EventType.AGENT_ACTION, browser.name,
                                 response[:150] if len(response) > 150 else response)

    async def _overdue_books_scenario(self):
        """Member realizes they have overdue books."""
        late_returner = self.agents.get("late_returner")
        librarian = self.agents.get("librarian")

        if late_returner and librarian and self.is_running:
            await self.emit_event(EventType.AGENT_SPEAKING, late_returner.name,
                                 "*rushes in* Oh no! I just realized I've had books for weeks!")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "Don't worry, Jamie. Let's see what you have out.")

            response = await late_returner.arun("Check all my borrowed books and their due dates")
            await self.emit_event(EventType.AGENT_ACTION, late_returner.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, late_returner.name,
                                 "I'm so sorry! I completely forgot about these.")

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "It happens! Just try to return them as soon as possible.")

            response = await late_returner.arun("Return all overdue books immediately")
            await self.emit_event(EventType.AGENT_ACTION, late_returner.name,
                                 response[:150] if len(response) > 150 else response)

    async def _research_help_scenario(self):
        """Researcher needs specialized help."""
        researcher = self.agents.get("researcher")
        librarian = self.agents.get("librarian")

        if researcher and librarian and self.is_running:
            await self.emit_event(EventType.AGENT_SPEAKING, researcher.name,
                                 "Ms. Johnson, I need help accessing academic journals on machine learning.")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "Of course, Dr. Chen. Are you looking for recent publications?")
            await asyncio.sleep(0.8)

            await self.emit_event(EventType.AGENT_SPEAKING, researcher.name,
                                 "Yes, specifically on neural networks and deep learning from the last two years.")

            response = await researcher.arun("Search for recent machine learning and deep learning academic resources")
            await self.emit_event(EventType.AGENT_ACTION, researcher.name,
                                 response[:150] if len(response) > 150 else response)
            await asyncio.sleep(1)

            await self.emit_event(EventType.AGENT_SPEAKING, librarian.name,
                                 "Let me also check our digital database for you.")

            response = await librarian.arun("Help researcher find academic machine learning resources")
            await self.emit_event(EventType.AGENT_ACTION, librarian.name,
                                 response[:150] if len(response) > 150 else response)

    def stop(self):
        """Stop the simulation."""
        self.is_running = False
        print("🛑 Simulation stopped")

    def get_events(self, limit: Optional[int] = None) -> List[Dict]:
        """Get simulation events."""
        events = self.events[-limit:] if limit else self.events
        return [event.to_dict() for event in events]

    def clear_events(self):
        """Clear all events."""
        self.events = []


async def cleanup_simulation_data():
    """Clean up simulation data from database."""
    # This would connect to DB and delete simulation members/borrows
    # Identified by _sim@library.ai email pattern
    print("🧹 Cleaning up simulation data...")
    # Implementation would go here
    pass