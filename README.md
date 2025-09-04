# Programs for Iwahswap

## What is Iwahswap
Iwahswap is a puzzle developed in a creative exchange between Iwahiro (Hirokazu Iwasawa), Goetz Schwandtner, Bram Cohen and Oscar van Deventer.
- https://www.youtube.com/watch?v=3rFQOCd4fXE
- https://twistypuzzles.com/forum/viewtopic.php?t=40126%29

Iwahswap is said to have a hyper-exponential number of moves for n pieces to solve.

## things I made

- Iwahswap Simulator
  - https://koteitan.github.io/iwahswap/
- Number of moves calculator
  - https://github.com/koteitan/iwahswap/blob/main/iwahswap.py

---

# Iwahswap Simulator

Iwahswap Simulator is a simulator of Iwahswap puzzle. It is implemented in JavaScript and runs in web browsers. 

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
./iwahswap.py <n> <k>
./hanoi.py <n> <n>
```
where n is the number of pieces and k is the maximum number of the recurrence relations to be calculated.

## example
```bash
./iwahswap.py 5 4

M(1) = 4 = 4
M(2) = 3*4 + 3*1 = 15
M(3) = 2*3*4 + 3*1 + 2*1 + 3*4 + 3*1 = 47
M(4) = 1*2*3*4 + 3*1 + 2*1 + 1*3*4 + 3*1 + 1*1 = 48

./iwahswap.py 6 5

M(1) = 5 = 5
M(2) = 4*5 + 4*1 + 5 = 29
M(3) = 3*4*5 + 4*1 + 3*5 + 3*1 = 90
M(4) = 2*3*4*5 + 4*1 + 3*5 + 3*1 + 2*1 + 3*4*5 + 4*1 + 3*5 + 3*1 = 272
M(5) = 1*2*3*4*5 + 4*1 + 3*5 + 3*1 + 2*1 + 1*3*4*5 + 4*1 + 3*5 + 3*1 + 1*1 = 273

./iwahswap.py 7 6

M(1) = 6 = 6
M(2) = 5*6 + 5*1 = 35
M(3) = 4*5*6 + 5*1 + 4*1 + 5*6 + 5*1 = 179
M(4) = 3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 = 540
M(5) = 2*3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 + 2*1 + 3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 = 1622
M(6) = 1*2*3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 + 2*1 + 1*3*4*5*6 + 5*1 + 4*1 + 3*5*6 + 5*1 + 3*1 + 1*1 = 1623

./hanoi.py 5 5

M(1) = 1 = 1
M(2) = 2*1 + 1 = 3
M(3) = 2*2*1 + 2*1 + 1 = 7
M(4) = 2*2*2*1 + 2*1 + 2*1 + 1 = 15
M(5) = 2*2*2*2*1 + 2*1 + 2*1 + 2*1 + 1 = 31
```

## Tips
Add and Mul functions by sympy are useful to expand the recurrence relations to keep the factorial expressions. This code uses them to expand the expressions into standard form.

### expand.py
expand.py is a useful library to observe the factorial patterns given by the of the recurrence relations.
- apply_distributive_law(): apply the distributive law to the expression
- pretty_print(): pretty print the expression

