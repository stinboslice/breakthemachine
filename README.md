# Break the Machine

Break the Machine is a browser based dark fantasy roguelike and deterministic simulation engine.

The player enters the Extraction Machine, chooses an ELF class, selects buffs, navigates hidden hallway outcomes, fights enemies, defeats minibosses, and decides whether to extract or continue deeper into risk.

The project is designed as both a playable game and a structured event system. Every meaningful run action can become replayable data.

## Core Concept

You do not beat the system by playing harder.

You beat it by seeing it clearly.

Break the Machine models extraction loops, volatility, decision pressure, belief, greed, risk, and survival through gameplay.

## Current Features

• Class selection  
• Character detail confirmation panel  
• Buff selection  
• Weapon tier selection  
• Hallway route choices  
• Rogue scan mechanic  
• Room outcomes  
• Turn based combat  
• Enemy waves  
• Miniboss encounters  
• Final boss flow  
• Dialogue system  
• Portrait system  
• Scene based audio  
• Level music loops  
• Exportable event log foundation  
• Mobile browser deployment  

## Tech Stack

• Phaser 3  
• Vite  
• JavaScript  
• HTML  
• CSS  
• JSON data files  
• Static assets  

No backend is required for the current playable build.

## Project Structure

```text
public/
  assets/
    audio/
    backgrounds/
    effects/
    icons/
    portraits/
    sprites/
    ui/
  data/
    buffs.json
    classes.json
    dialogue.json
    enemies.json
    hallways.json
    levels.json
    room_rewards.json
    specials.json
    ui.json
    weapons.json

src/
  game/
    scenes/
    systems/
    assets/
