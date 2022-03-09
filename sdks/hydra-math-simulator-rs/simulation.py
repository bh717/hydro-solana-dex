from decimal import *
getcontext().prec = 40
getcontext().rounding = ROUND_CEILING

class Curve:
  """
  Python model of HMM token swap math.
  """

  def __init__(self, x0, y0, c_numer, c_denom, i):
    """
    x0: current token x balance in pool
    y0: current token y balance in pool
    c_numer: compensation coefficient numerator
    c_denom: compensation coefficient denominator
    i: oracle price
    """
    self.x0 = Decimal(x0)
    self.y0 = Decimal(y0)
    if c_denom == 0:
        self.c = Decimal(0)
    else:
        self.c = Decimal(c_numer)/Decimal(c_denom)
    self.i = Decimal(i)

  def to_int_signed(self, decimal, rounding=ROUND_CEILING):
    is_signed = decimal.is_signed()
    return (int(decimal.copy_abs().to_integral(rounding)), decimal.is_signed())

  def to_int(self, decimal):
      return int(decimal.to_integral())

  def k(self):
    """
    k for a constant product curve
    """
    k = self.x0 * self.y0
    return k

  def sim_k(self):
    return self.to_int(self.k())

  def delta_y_amm(self, delta_x):
    """
    Δy = K/X₀ - K/(X₀ + Δx)
    k/(self.x0 + delta_x) - k/self.x0
    """
    k = self.k()
    return k/(self.x0 + delta_x) - k/self.x0

  def sim_delta_y_amm(self, delta_x):
    return self.to_int_signed(self.delta_y_amm(delta_x))

  def delta_x_amm(self, delta_y):
    """
    Δy = K/Y₀ - K/(Y₀ + Δy)
    k/(self.y0 + delta_y) - k/self.y0
    """
    k = self.k()
    return k/(self.y0 + delta_y) - k/self.y0

  def sim_delta_x_amm(self, delta_y):
    return self.to_int_signed(self.delta_x_amm(delta_y))

  def swap_x_to_y_amm(self, delta_x):
    """
    swap x to y for a constant product curve given delta_x
    """
    k = self.k()
    x_new = self.x0 + delta_x
    y_new = k/x_new
    delta_x = x_new - self.x0
    delta_y = self.y0 - y_new
    return x_new, delta_x, y_new, delta_y

  def sim_swap_x_to_y_amm(self, delta_x):
    result = tuple(map(lambda d: int(d), self.swap_x_to_y_amm(delta_x)))
    return tuple(result)

  def xi(self):
    """
    Xᵢ = √(K/i)
    """
    k = self.k()
    return (k/self.i).sqrt()

  def sim_xi(self):
    return self.to_int_signed(self.xi(), ROUND_FLOOR)

  def yi(self):
    """
    Yᵢ = √(K/(1/i))
    """
    k = self.k()
    return (k/(1/self.i)).sqrt()

  def sim_yi(self):
    return self.to_int_signed(self.yi(), ROUND_FLOOR)

  def integ(self, k, q0, q_new, qi, c):
    if c==1:
      return k/(qi**c) * (q0/q_new).ln()
    else:
      return k/((qi**c)*(c-1)) * (q0**(c-1)-q_new**(c-1))

  def delta_y_hmm(self, delta_x):
    k = self.k()
    xi = self.xi()
    x_new = self.x0 + Decimal(delta_x)

    if (delta_x > 0 and self.x0 >= xi) or (delta_x < 0 and self.x0 <= xi):
      return self.delta_y_amm(delta_x)
    elif (delta_x > 0 and x_new <= xi) or (delta_x < 0 and x_new >= xi):
      return self.integ(k, self.x0, x_new, xi, self.c)
    else:
      lhs = self.integ(k, self.x0, xi, xi, self.c)
      rhs = (k/x_new - k/xi)
      return lhs + rhs

  def sim_delta_y_hmm(self, delta_x):
    return self.to_int_signed(self.delta_y_hmm(delta_x), ROUND_FLOOR)

  def delta_x_hmm(self, delta_y):
    k = self.k()
    yi = self.yi()
    y_new = self.y0 + Decimal(delta_y)

    if (delta_y > 0 and self.y0 >= yi) or (delta_y < 0 and self.y0 <= xi):
      return self.delta_x_amm(delta_y)
    elif (delta_y > 0 and y_new <= yi) or (delta_y < 0 and y_new >= xi):
      return self.integ(k, self.y0, y_new, yi, self.c)
    else:
      lhs = self.integ(k, self.y0, yi, yi, self.c)
      rhs = (k/y_new - k/yi)
      return lhs + rhs

  def sim_delta_x_hmm(self, delta_y):
    return self.to_int_signed(self.delta_x_hmm(delta_y), ROUND_FLOOR)
