#!/usr/bin/python3

from sympy import Integer, Add, Mul
from expand import get_args, show_results

def build_M_all(n, k_max):
    M = {}
    M[1] = Integer(n - 1)
    for k in range(2, k_max + 1):
        prev = M[k - 1]
        nk = n - k
        if nk % 2 == 1:
            # M(k) = (n-k)(M(k-1)+1)          if n-k is odd  and k>1
            expr =     Mul(Integer(nk), Add(prev, Integer(1), evaluate=False), evaluate=False)
        else:
            # M(k) = (n-k)(M(k-1)+1) + M(k-2) if n-k is even and k>1
            expr = Add(Mul(Integer(nk), Add(prev, Integer(1), evaluate=False), evaluate=False), prev, evaluate=False)
        M[k] = expr
    return M

if __name__ == '__main__':
    n, k_max = get_args()
    M_all = build_M_all(n, k_max)
    show_results(M_all)
