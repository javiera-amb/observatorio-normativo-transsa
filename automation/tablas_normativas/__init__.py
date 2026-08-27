"""Motor determinístico de auditoría y normalización de tablas normativas IPT."""

from .engine import FIELDS, audit_table, process_file

__all__ = ["FIELDS", "audit_table", "process_file"]
