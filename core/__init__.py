"""Núcleo de Transsa Urban Intelligence.

Este paquete contiene el modelo canónico, persistencia y utilidades comunes.
No depende del portal ni de una fuente específica.
"""

from .models import CanonicalEvent

__all__ = ["CanonicalEvent"]
