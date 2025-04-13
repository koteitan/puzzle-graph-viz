# What is Iwahswap
Iwahswap is a puzzle developed in a creative exchange between Iwahiro (Hirokazu Iwasawa), Goetz Schwandtner, Bram Cohen and Oscar van Deventer.
- https://www.youtube.com/watch?v=3rFQOCd4fXE
- https://twistypuzzles.com/forum/viewtopic.php?t=40126%29

# What is this code
This code is a python script to calculate the number of moves of Iwahswap.
Add and Mul functions by sympy are useful to expand the recurrence relations.

## expand.py
expand.py is a useful library to observe the factorial patterns given by the of the recurrence relations.
- apply_distributive_law()
  - apply the distributive law to the expression
- pretty_print*()
  - pretty print the expression

# Requirements
- python
- sympy

# Usage
```bash
./iwahswap.py <n> <k>
./hanoi.py <n> <n>
```
where n is the number of pieces and k is the maximum number of the recurrence relations to be calculated.



# example
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

