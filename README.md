# Puzzle Graph Visualizer

A framework for visualizing various puzzle state spaces as interactive graphs with BFS solver.

## Overview

Puzzle Graph Visualizer is a web-based framework that allows you to:
- Play various puzzles interactively
- Visualize the complete state space as a force-directed graph
- Explore optimal solutions using BFS (Breadth-First Search)
- Jump to any state in the graph
- See the shortest path from any state to the goal

## Live Demo

- Main site: https://koteitan.github.io/puzzle-graph-viz/
- Iwahswap Simulator: https://koteitan.github.io/puzzle-graph-viz/iwahswap/
- Hanoi Tower: https://koteitan.github.io/puzzle-graph-viz/hanoi/

## Implemented Puzzles

### Iwahswap
A puzzle developed in a creative exchange between Iwahiro (Hirokazu Iwasawa), Goetz Schwandtner, Bram Cohen and Oscar van Deventer.
- https://www.youtube.com/watch?v=3rFQOCd4fXE
- https://twistypuzzles.com/forum/viewtopic.php?t=40126

Iwahswap is said to have a hyper-exponential number of moves for n pieces to solve.

### Hanoi Tower
The classic Tower of Hanoi puzzle with 6 disks. Move all disks from the first tower to the last, following the rule that larger disks cannot be placed on smaller ones.

## Framework Features

- **Abstract Architecture**: Modular design with AbstractGame and AbstractRenderer base classes
- **BFS Solver**: Breadth-first search explores the complete state space
- **Interactive Graph**: Force-directed graph visualization with physics simulation
- **Graph Navigation**: Jump to any state, drag nodes, zoom and pan
- **Auto-solver**: Step-by-step optimal solution guidance
- **Extensible**: Easy to add new puzzles (see HowToAddYourPuzzle.md) 

---
# Number of moves calculator

## What is this code
I estimated the number of moves for the k pieces alignment from one side to the other side in the all n pieces as follows.
```
M(1) =  n-1
M(k) = (n-k)(M(k-1)+1)          if n-k is odd  and k>1
M(k) = (n-k)(M(k-1)+1) + M(k-1) if n-k is even and k>1
```
This code is a python script to calculate them.

## Requirements
- python
- sympy

## Usage
```bash
python/iwahswap.py <n> <k>
python/hanoi.py <n> <n>
```
where n is the number of pieces and k is the maximum number of the recurrence relations to be calculated.

## example
```bash
python/iwahswap.py 5 4

M(1) = 4 = 4
M(2) = 3*4 + 3*1 = 15
M(3) = 2*3*4 + 3*1 + 2*1 + 3*4 + 3*1 = 47
M(4) = 1*2*3*4 + 3*1 + 2*1 + 1*3*4 + 3*1 + 1*1 = 48

python/iwahswap.py 6 5

M(1) = 5 = 5
M(2) = 4*5 + 4*1 + 5 = 29
M(3) = 3*4*5 + 4*1 + 3*5 + 3*1 = 90
M(4) = 2*3*4*5 + 4*1 + 3*5 + 3*1 + 2*1 + 3*4*5 + 4*1 + 3*5 + 3*1 = 272
M(5) = 1*2*3*4*5 + 4*1 + 3*5 + 3*1 + 2*1 + 1*3*4*5 + 4*1 + 3*5 + 3*1 + 1*1 = 273

python/iwahswap.py 7 6

M(1) = 6 = 6
M(2) = 5*6 + 5*1 = 35
M(3) = 4*5*6 + 5*1 + 4*1 + 5*6 + 5*1 = 179
M(4) = 3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 = 540
M(5) = 2*3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 + 2*1 + 3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 = 1622
M(6) = 1*2*3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 + 2*1 + 1*3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 + 1*1 = 1623

python/hanoi.py 5 5

M(1) = 1 = 1
M(2) = 2*1 + 1 = 3
M(3) = 2*2*1 + 2*1 + 1 = 7
M(4) = 2*2*2*1 + 2*1 + 2*1 + 1 = 15
M(5) = 2*2*2*2*1 + 2*1 + 2*1 + 2*1 + 1 = 31
```

## Tips
Add and Mul functions by sympy are useful to expand the recurrence relations to keep the factorial expressions. This code uses them to expand the expressions into standard form.

### expand.py
python/expand.py is a useful library to observe the factorial patterns given by the of the recurrence relations.
- [expand.py](https://github.com/koteitan/puzzle-graph-viz/blob/main/python/expand.py)
- apply_distributive_law(): apply the distributive law to the expression
- pretty_print(): pretty print the expression

