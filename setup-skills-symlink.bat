@echo off
REM Set up skills junction for Claude Code (no admin required!)
REM This creates a single source of truth - changes in .agent/skills/ will reflect in .claude/skills/

cd /d "%~dp0"

echo Checking for existing .claude\skills folder...

if exist ".claude\skills" (
    echo Removing existing .claude\skills folder...
    rmdir /s /q ".claude\skills" 2>nul
    rmdir ".claude\skills" 2>nul
)

echo Creating .claude directory if it doesn't exist...
if not exist ".claude" mkdir ".claude"

echo Creating junction .claude\skills -> .agent\skills...
REM Using junction (/J) instead of symlink (/D) - works without admin privileges
mklink /J ".claude\skills" ".agent\skills"

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Junction created successfully.
    echo Changes to .agent\skills will automatically appear in .claude\skills
    echo.
    echo NOTE: Junctions work automatically - no admin needed!
) else (
    echo.
    echo FAILED! Something went wrong creating the junction.
    echo Try manually running: mklink /J .claude\skills .agent\skills
)

pause
