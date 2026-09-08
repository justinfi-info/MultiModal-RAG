from __future__ import annotations

from typing import Any

from mem0 import Memory

try:
    from src.config import get_config
except ImportError:  # pragma: no cover
    from config import get_config


def create_memory() -> Memory:
    """Initialize and return a configured mem0 Memory instance."""
    return Memory.from_config(get_config())


def add_memory(memory: Memory, messages: list[dict[str, str]], user_id: str) -> None:
    """Store a conversation turn in memory."""
    memory.add(messages, user_id=user_id)


def search_memory(memory: Memory, query: str, user_id: str) -> list[dict[str, Any]]:
    """Retrieve relevant stored memories for a user query."""
    for func in (
        lambda: memory.search(query, user_id=user_id),
        lambda: memory.search(query, filters={"user_id": user_id}),
    ):
        try:
            results = func()
            if isinstance(results, dict):
                return results.get("results", [])
            if isinstance(results, list):
                return results
        except TypeError:
            continue
    return []


def list_memories(memory: Memory, user_id: str) -> list[dict[str, Any]]:
    """Return all stored memories for a given user."""
    for func in (
        lambda: memory.get_all(user_id=user_id),
        lambda: memory.get_all(filters={"user_id": user_id}),
    ):
        try:
            results = func()
            if isinstance(results, dict):
                return results.get("results", results.get("memories", []))
            if isinstance(results, list):
                return results
        except TypeError:
            continue
    return []
