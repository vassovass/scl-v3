@echo off
REM Run this script as Administrator to set up skills symlink for Claude Code
REM This creates a single source of truth - changes in .agent/skills/ will reflect in .claude/skills/

cd /d "%~dp0"

echo Checking for existing .claude\skills folder...

if exist ".claude\skills" (
    echo Removing existing .claude\skills folder...
    rmdir /s /q ".claude\skills"
)

echo Creating .claude directory if it doesn't exist...
if not exist ".claude" mkdir ".claude"

echo Creating symlink .claude\skills -> .agent\skills...
mklink /D ".claude\skills" ".agent\skills"

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Symlink created successfully.
    echo Changes to .agent\skills will automatically appear in .claude\skills
) else (
    echo.
    echo FAILED! You need to run this script as Administrator.
    echo Right-click this file and select "Run as administrator"
)

pause
