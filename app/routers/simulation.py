"""
Simulation API Router
Handles A2A simulation endpoints with SSE streaming
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import asyncio
import json
from datetime import datetime

from simulation.orchestrator import SimulationOrchestrator, EventType

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

# Global orchestrator instance
orchestrator: Optional[SimulationOrchestrator] = None
simulation_task: Optional[asyncio.Task] = None


class SimulationStartRequest(BaseModel):
    """Request to start simulation."""
    scenario: str = "busy_day"  # busy_day, exam_week, book_club, continuous
    duration_minutes: Optional[int] = 5  # For continuous mode


class SimulationResponse(BaseModel):
    """Response for simulation operations."""
    status: str
    message: str
    details: Optional[dict] = None


@router.post("/start")
async def start_simulation(
    request: SimulationStartRequest,
    background_tasks: BackgroundTasks
) -> SimulationResponse:
    """Start a new simulation."""
    global orchestrator, simulation_task

    # Check if simulation is already running
    if orchestrator and orchestrator.is_running:
        # Try to stop it first
        orchestrator.stop()
        if simulation_task and not simulation_task.done():
            simulation_task.cancel()
            try:
                await simulation_task
            except asyncio.CancelledError:
                pass
        # Reset for new simulation
        orchestrator = None
        simulation_task = None

    try:
        # Create new orchestrator
        orchestrator = SimulationOrchestrator()

        # Initialize agents
        member_ids = await orchestrator.initialize_agents()

        # Start simulation in background
        if request.scenario == "continuous":
            simulation_task = asyncio.create_task(
                orchestrator.run_continuous(request.duration_minutes or 5)
            )
        else:
            simulation_task = asyncio.create_task(
                orchestrator.run_scenario(request.scenario)
            )

        return SimulationResponse(
            status="started",
            message=f"Simulation '{request.scenario}' started successfully",
            details={
                "scenario": request.scenario,
                "agents": len(orchestrator.agents),
                "member_ids": member_ids
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start simulation: {str(e)}"
        )


@router.post("/stop")
async def stop_simulation() -> SimulationResponse:
    """Stop the running simulation."""
    global orchestrator, simulation_task

    if not orchestrator or not orchestrator.is_running:
        raise HTTPException(
            status_code=400,
            detail="No simulation is currently running"
        )

    # Stop simulation
    orchestrator.stop()

    # Cancel task if running
    if simulation_task and not simulation_task.done():
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass

    return SimulationResponse(
        status="stopped",
        message="Simulation stopped successfully"
    )


@router.get("/status")
async def get_simulation_status() -> SimulationResponse:
    """Get current simulation status."""
    global orchestrator

    if not orchestrator:
        return SimulationResponse(
            status="idle",
            message="No simulation has been started"
        )

    return SimulationResponse(
        status="running" if orchestrator.is_running else "idle",
        message="Simulation status retrieved",
        details={
            "is_running": orchestrator.is_running,
            "current_scenario": orchestrator.current_scenario.name if orchestrator.current_scenario else None,
            "event_count": len(orchestrator.events),
            "agents": list(orchestrator.agents.keys())
        }
    )


@router.get("/events")
async def get_events(limit: Optional[int] = 100):
    """Get simulation events."""
    global orchestrator

    if not orchestrator:
        return {"events": []}

    return {"events": orchestrator.get_events(limit)}


async def event_generator() -> AsyncGenerator[str, None]:
    """Generate server-sent events for real-time streaming."""
    global orchestrator

    if not orchestrator:
        yield f"data: {json.dumps({'error': 'No simulation running'})}\n\n"
        return

    # Queue for events
    event_queue = asyncio.Queue()

    # Callback to add events to queue
    async def event_callback(event):
        await event_queue.put(event)

    # Register callback
    orchestrator.add_event_callback(event_callback)

    try:
        # Send initial connection event
        yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.now().isoformat()})}\n\n"

        # Stream events as they come
        while orchestrator and orchestrator.is_running:
            try:
                # Wait for event with timeout
                event = await asyncio.wait_for(event_queue.get(), timeout=1.0)
                event_data = event.to_dict()

                # Format as SSE
                yield f"data: {json.dumps(event_data)}\n\n"

            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                yield f": heartbeat\n\n"

        # Send completion event
        yield f"data: {json.dumps({'type': 'completed', 'timestamp': datetime.now().isoformat()})}\n\n"

    except asyncio.CancelledError:
        yield f"data: {json.dumps({'type': 'cancelled', 'timestamp': datetime.now().isoformat()})}\n\n"


@router.get("/stream")
async def stream_events():
    """Stream simulation events via SSE."""
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable Nginx buffering
        }
    )


@router.post("/cleanup")
async def cleanup_simulation_data() -> SimulationResponse:
    """Clean up simulation data from database."""
    try:
        from simulation.orchestrator import cleanup_simulation_data
        await cleanup_simulation_data()

        return SimulationResponse(
            status="success",
            message="Simulation data cleaned up successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cleanup simulation data: {str(e)}"
        )


@router.get("/scenarios")
async def get_available_scenarios():
    """Get list of available simulation scenarios."""
    return {
        "scenarios": [
            {
                "id": "busy_day",
                "name": "Busy Day",
                "description": "A typical busy day at the library with multiple patrons"
            },
            {
                "id": "exam_week",
                "name": "Exam Week",
                "description": "Finals week with many students searching for study materials"
            },
            {
                "id": "book_club",
                "name": "Book Club Meeting",
                "description": "Monthly book club gathering to discuss recent reads"
            },
            {
                "id": "continuous",
                "name": "Continuous Simulation",
                "description": "Run multiple scenarios continuously for a specified duration"
            }
        ]
    }