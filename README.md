# SYS400 // CRT Terminal

A retro DOS-style terminal emulator rendered as an old-school monochrome CRT monitor, built with plain HTML/CSS/JS — no frameworks, no build step.

Features scanlines, screen flicker, vignette, noise, and a switchable phosphor color (green/amber), plus a small set of fake-DOS commands and an ASCII Snake game.

## Running it

Just open `index.html` in a browser, or serve the folder statically:

```bash
npx serve .
```

## Usage

Type commands at the `C:\SYS400>` prompt, or use the F-key shortcuts at the bottom of the screen (F1–F4, F12).

Run `help` to list all commands, or `man <command>` for details on one.

Notable commands:

- `home` / `about` / `projects` / `contact` — load content modules
- `show <about|projects|contact|logo|cat>` — render ASCII art
- `art` — cycle through an ASCII art gallery
- `games`, `snake` — open the games menu / play ASCII Snake (arrow keys, Esc to quit)
- `cd`, `ls`, `dir`, `type` — fake DOS-style filesystem navigation
- `color <green|amber>` — switch phosphor color (also via the `[ COLOR ]` button)
- `sysinfo`, `mem`, `vol`, `ver`, `ipconfig`, `ping`, `date`, `time`, `whoami`, `echo`
- `clear` / `cls` — clear the screen buffer
- `exit` / `logoff` — restart the terminal session

## Project structure

- [index.html](index.html) — page structure (CRT bezel, screen layers, command line, F-key nav)
- [style.css](style.css) — CRT visual effects (scanlines, flicker, vignette, phosphor themes)
- [script.js](script.js) — terminal state, command registry, content sections, ASCII art, and the Snake game
