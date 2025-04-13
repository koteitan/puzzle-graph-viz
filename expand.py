from sympy import Integer, Add, Mul
import sys

def apply_distributive_law(expr):
    if isinstance(expr, Mul):
        left, right = expr.args
        if isinstance(right, Add):
            return Add(*[apply_distributive_law(Mul(left, term, evaluate=False)) for term in right.args], evaluate=False)
        elif isinstance(left, Add):
            return Add(*[apply_distributive_law(Mul(term, right, evaluate=False)) for term in left.args], evaluate=False)
        else:
            return Mul(apply_distributive_law(left), apply_distributive_law(right), evaluate=False)
    elif isinstance(expr, Add):
        return Add(*[apply_distributive_law(arg) for arg in expr.args], evaluate=False)
    else:
        return expr

def pretty_print(expr):
    if isinstance(expr, Integer):
        return str(expr)
    elif isinstance(expr, Mul):
        return '*'.join(pretty_print(arg) for arg in expr.args)
    elif isinstance(expr, Add):
        return ' + '.join(pretty_print(arg) for arg in expr.args)
    else:
        return str(expr)

def get_args():
    if len(sys.argv) != 3:
        print("usage: ./script.py <n> <k_max>")
        sys.exit(1)
    try:
        n = int(sys.argv[1])
        k_max = int(sys.argv[2])
    except ValueError:
        print("error: n and k_max must be integers")
        sys.exit(1)
    return n, k_max

def show_results(M_all):
    for k in range(1, len(M_all) + 1):
        expr = apply_distributive_law(M_all[k])
        print(f"M({k}) = {pretty_print(expr)} = {int(expr)}")
