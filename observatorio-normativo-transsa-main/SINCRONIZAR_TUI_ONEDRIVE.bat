@echo off
cd /d "%~dp0"
if not exist "_local" mkdir "_local"
if not exist "_local\rutas_tui.json" copy "config\rutas_tui.example.json" "_local\rutas_tui.json" >nul
py scripts\sincronizar_tui_local.py
pause
