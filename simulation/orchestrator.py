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
        await asyncio.sleep(1)

        # Librarian arrives and checks system
        librarian = agents.get("librarian")
        if librarian:
            await orchestrator.emit_event(EventType.AGENT_THINKING, librarian.name, "Checking library statistics for the day...")
            response = await librarian.arun("Check how many books are currently borrowed and available")
            await orchestrator.emit_event(EventType.AGENT_ACTION, librarian.name, response)
            await asyncio.sleep(2)

        # Students arrive
        student = agents.get("student")
        if student:
            await orchestrator.emit_event(EventType.AGENT_THINKING, student.name, "Looking for study materials...")
            response = await student.arun("Search for books about data structures and algorithms")
            await orchestrator.emit_event(EventType.AGENT_ACTION, student.name, response)
            await asyncio.sleep(2)

            # Student decides to borrow
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, student.name, "These look perfect for my exam!")
            response = await student.arun("Borrow the first available algorithms book")
            await orchestrator.emit_event(EventType.AGENT_ACTION, student.name, response)
            await asyncio.sleep(2)

        # Reader browsing
        reader = agents.get("reader")
        if reader:
            await orchestrator.emit_event(EventType.AGENT_THINKING, reader.name, "Looking for a good novel...")
            response = await reader.arun("Search for fiction books or novels")
            await orchestrator.emit_event(EventType.AGENT_ACTION, reader.name, response)
            await asyncio.sleep(2)

        # Researcher working
        researcher = agents.get("researcher")
        if researcher:
            await orchestrator.emit_event(EventType.AGENT_THINKING, researcher.name, "Need academic resources...")
            response = await researcher.arun("Search for academic papers or research books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, researcher.name, response)
            await asyncio.sleep(2)

        # Late returner arrives
        late_returner = agents.get("late_returner")
        if late_returner:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, late_returner.name, "Oh no, I forgot to return my books!")
            await orchestrator.emit_event(EventType.AGENT_THINKING, late_returner.name, "Checking my borrowed books...")
            response = await late_returner.arun("Check what books I have borrowed")
            await orchestrator.emit_event(EventType.AGENT_ACTION, late_returner.name, response)
            await asyncio.sleep(2)

            # Try to return
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, late_returner.name, "I should return these immediately!")
            response = await late_returner.arun("Return my first borrowed book")
            await orchestrator.emit_event(EventType.AGENT_ACTION, late_returner.name, response)
            await asyncio.sleep(2)

        # Browser exploring
        browser = agents.get("browser")
        if browser:
            await orchestrator.emit_event(EventType.AGENT_THINKING, browser.name, "Just exploring what's available...")
            response = await browser.arun("Show me random interesting books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, browser.name, response)
            await asyncio.sleep(2)

        # Librarian checks end of day
        if librarian:
            await orchestrator.emit_event(EventType.AGENT_THINKING, librarian.name, "Time to check today's activity...")
            response = await librarian.arun("Show me today's library statistics and any overdue books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, librarian.name, response)
            await asyncio.sleep(2)

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
        await asyncio.sleep(1)

        # Multiple students searching
        student = agents.get("student")
        if student:
            topics = [
                "calculus and linear algebra",
                "physics and quantum mechanics",
                "computer science and programming",
                "chemistry and organic compounds"
            ]

            for topic in topics:
                await orchestrator.emit_event(EventType.AGENT_SPEAKING, student.name, f"I need books about {topic}!")
                response = await student.arun(f"Search for books about {topic}")
                await orchestrator.emit_event(EventType.AGENT_ACTION, student.name, response)
                await asyncio.sleep(2)

        # Librarian helping
        librarian = agents.get("librarian")
        if librarian:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, librarian.name, "Let me help you find study materials!")
            response = await librarian.arun("Check which academic books are most popular this week")
            await orchestrator.emit_event(EventType.AGENT_ACTION, librarian.name, response)
            await asyncio.sleep(2)

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
        await asyncio.sleep(1)

        # Readers discussing books
        reader = agents.get("reader")
        if reader:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, reader.name, "Let's discuss this month's book!")
            response = await reader.arun("What fiction books are currently most borrowed?")
            await orchestrator.emit_event(EventType.AGENT_ACTION, reader.name, response)
            await asyncio.sleep(2)

            await orchestrator.emit_event(EventType.AGENT_SPEAKING, reader.name, "I'd like to recommend a book for next month")
            response = await reader.arun("Search for highly rated fiction books")
            await orchestrator.emit_event(EventType.AGENT_ACTION, reader.name, response)
            await asyncio.sleep(2)

        # Browser participating
        browser = agents.get("browser")
        if browser:
            await orchestrator.emit_event(EventType.AGENT_SPEAKING, browser.name, "I'm new here, what genres do you usually read?")
            response = await browser.arun("Show me different book categories available")
            await orchestrator.emit_event(EventType.AGENT_ACTION, browser.name, response)
            await asyncio.sleep(2)

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
        end_time = datetime.now() + timedelta(minutes=duration_minutes)

        await self.emit_event(
            EventType.SYSTEM_MESSAGE,
            None,
            f"Starting continuous simulation for {duration_minutes} minutes"
        )

        scenarios = list(self.scenarios.keys())

        while datetime.now() < end_time and self.is_running:
            # Pick random scenario
            scenario_name = random.choice(scenarios)
            await self.run_scenario(scenario_name)

            # Wait between scenarios
            if self.is_running:
                await asyncio.sleep(random.uniform(5, 15))

        await self.emit_event(
            EventType.SYSTEM_MESSAGE,
            None,
            "Continuous simulation completed"
        )
        self.is_running = False

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