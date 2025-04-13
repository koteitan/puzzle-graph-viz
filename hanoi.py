#!/usr/bin/python3

from sympy import Integer, Add, Mul
from expand import get_args, show_results

def build_M_all(n, k_max):
    M = {}
    M[1] = Integer(1)
    for k in range(2, k_max + 1):
        # M(k) = 2M(k-1) + 1
        prev = M[k - 1]
        expr = Add(Mul(Integer(2), prev, evaluate=False), Integer(1), evaluate=False)
        M[k] = expr
    return M

if __name__ == '__main__':
    n, k_max = get_args()
    M_all = build_M_all(n, k_max)
    show_results(M_all)
