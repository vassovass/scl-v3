# Light Mode Design Research & Specification

## 1. Executive Summary
The "Yellow/Orange" interface previously visible was a **technical bug**, not a design choice. The CSS variables were incorrectly formatted (RGB values where HSL was expected), causing the browser to render invalid colors.

This document outlines the **Standard Industry Light Mode** for fitness applications, which we have implemented to replace the broken state.

## 2. Industry Standards (Fitness & SaaS)

| App | Background | Surface/Card | Text | Primary Accent |
| :--- | :--- | :--- | :--- | :--- |
| **Strava** | White (`#FFFFFF`) | White / Light Gray (`#F0F0F0`) | Black / Dark Grey | International Orange (`#FC4C02`) |
| **Nike Run Club** | White (`#FFFFFF`) | Off-White (`#F5F5F5`) | Black | Volt Green (`#CBF22C`) |
| **Apple Fitness** | White (`#FFFFFF`) | Light Gray (`#F2F2F7`) | Black | Activity Ring Colors |
| **StepLeague (Proposed)** | White (`#FFFFFF`) | White / Slate-50 (`#F8FAFC`) | Slate-950 (`#020617`) | Sky Blue (`#0EA5E9`) |

## 3. Dark Mode Research (Consolidated)
The user requested "test of time" dark mode colors. Our research into Strava, Nike, and Linear/Vercel shows two dominant paths:

1.  **OLED Black (`#000000`)**: Used by Apple Fitness and Nike for maximum battery saving and contrast.
2.  **Deep Blue/Gray (`#0A0A0A` - `#0F172A`)**: Used by modern SaaS (Linear, Vercel, Shadcn) to reduce eye strain and provide better depth.

**Decision**: We will Stick to **Option 2 (Deep Slate)** but refine the values to strict HSL. This aligns with the "Linear/Shadcn" aesthetic which is considered the "Gold Standard" for modern web apps.

### Dark Mode Palette (Refined HSL)
- **Background**: `hsl(222.2 84% 4.9%)` (Slate 950 - #020617) - *Rich, deep blue-black*
- **Surface**: `hsl(222.2 47.4% 11.2%)` (Slate 900 - #0f172a) - *Slightly lighter for cards*
- **Text**: `hsl(210 40% 98%)` (Slate 50 - #f8fafc) - *Off-white for readability*

## 4. The Fix (Already Applied Locally)

We have updated the CSS variables to use standard **HSL values** that align with Shadcn and Tailwind best practices.

### Light Mode Palette
- **Background**: `hsl(0 0% 100%)` (Pure White)
- **Foreground (Text)**: `hsl(222.2 84% 4.9%)` (Deep Slate - High Legibility)
- **Primary (Action)**: `hsl(199 89% 48%)` (StepLeague Sky Blue - Existing Brand)
- **Muted/Borders**: `hsl(214.3 31.8% 91.4%)` (Slate 200 - Subtle Separation)

### Visual Result
- **Clean**: No more "yellow" or broken colors.
- **Accessible**: High contrast ratio between text and background.
- **Brand Aligned**: Keeps your specific "Sky Blue" and "Slate" aesthetic, just inverted for light mode.

## 4. Recommendation
**Git Push the current fix.** 
This will restore the app to a professional, working state. Once the baseline is fixed (clean white UI), we can iterate on specific colors if you wish to deviate from the standard "Slate/Sky" look.
