"""Filesystem infrastructure layer.

Implements storage adapters for the filesystem using the domain ports.
Provides concrete implementations for book and chapter persistence.
"""

from .library import FilesystemLibraryRepository

__all__ = [
    "FilesystemLibraryRepository",
]
