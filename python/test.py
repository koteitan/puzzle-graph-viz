from sympy import Integer, Add, Mul

# 分配法則の適用（再帰的に展開）
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

# 整形出力：括弧の省略（+ と ⋅ のみ）
def pretty_print(expr):
    if isinstance(expr, Integer):
        return str(expr)
    elif isinstance(expr, Mul):
        return '⋅'.join(pretty_print(arg) for arg in expr.args)
    elif isinstance(expr, Add):
        return ' + '.join(pretty_print(arg) for arg in expr.args)
    else:
        return str(expr)

# --- 元の式 1 + 2 × (3 + 4) ---
expr = Add(
    Integer(1),
    Mul(Integer(2), Add(Integer(3), Integer(4), evaluate=False), evaluate=False),
    evaluate=False
)

# 分配法則を適用
distributed = apply_distributive_law(expr)

# 整形して出力
print(pretty_print(distributed))  # 期待される出力: 1 + 2⋅3 + 2⋅4

