"""
Classes to conceptualize the workings of an AMM v3  liquiditiy pool
based on :
  * Uniswap v3 core paper
  * Liquidity Math in Uniswap v3 - Technical Note
"""

from dataclasses import dataclass


@dataclass
class Token:
    name: str
    decimals: int


@dataclass
class GlobalState:
    """contract global state"""

    L: float = 0.0  # liquidity
    rP: float = 0.0  # sqrt price
    tick: int = 0  # current tick
    fg_x: float = 0.0  # fee growth global
    fg_y: float = 0.0  # fee growth global
    proto_x: float = 0.0  # protocol fees
    proto_y: float = 0.0  # protocol fees


@dataclass
class TickState:
    """Tick Indexed State"""

    liq_net: float = 0.0  # LiquidityNet
    liq_gross: float = 0.0  # LiquidityGross
    f0_x: float = 0.0  # feegrowth outside
    f0_y: float = 0.0  # feegrowth outside


@dataclass
class PositionState:
    """Position Indexed State"""

    liq: float = 0.0  # liquidity
    liq_gross: float = 0.0  # LiquidityGross
    fr_x: float = 0.0  # feegrowth inside last
    fr_y: float = 0.0  # feegrowth inside last


class Pool:
    """AMM pool with concentrated liquidity
    tokens X and Y, prices expressed with Y as numeraire"""

    def __init__(self, x_name, x_decimals, y_name, y_decimals):
        self.token_x = Token(x_name, x_decimals)
        self.token_y = Token(y_name, y_decimals)
        self.global_state = GlobalState()
        self.tick_states = []
        self.poz_states = []

    def name(self):
        return f"{self.token_x.name}-{self.token_y.name} pool"

    def __repr__(self):
        lines = []
        lines.append(f"{self.name()}")
        lines.append(f"{self.token_x} {self.token_y}")
        lines.append(f"{repr(self.global_state)}")
        lines.append("\n".join([repr(tick) for tick in self.tick_states[:10]]))
        lines.append("\n".join([repr(poz) for poz in self.poz_states[:10]]))

        return "\n".join(lines)

    @staticmethod
    def liq_x_only(x, rPa, rPb):
        """Lx : liquidity amount when liquidity fully composed of  token x
        e.g when price below lower bound of range and y=0. [5]
            x : token x real reserves
            rPa,rPb : range lower (upper) bound in root price
        """
        return x * rPa * rPb / (rPb - rPa)

    @staticmethod
    def liq_y_only(y, rPa, rPb):
        """Ly : liquidity amount when liquidity fully composed of  token y
        e.g when price above upper bound of range, x=0. [9]
            y : token y real reserves
            rPa,rPb : range lower (upper) bound in root price
        """
        return y / (rPb - rPa)

    @staticmethod
    def liq_from_x_y_rP_rng(x, y, rP, rPa, rPb):
        """L : liquidity amount from real reserves based on
        where price is compared to price range
            x,y : real token reserves
            rPa,rPb : range lower (upper) bound in root price
            rP : current root price
        """
        if rP <= rPa:
            # y = 0 and reserves entirely in x. [4]
            return Pool.liq_x(x, rPa, rPb)
        elif rP < rPb:  # [11,12]
            # x covers sub-range [P,Pb] and y covers the other side [Pa,P]
            Lx = Pool.liq_x_only(x, rP, rPb)
            Ly = Pool.liq_y_only(y, rPa, rP)
            # Lx Ly should be close to equal, by precaution take the minimum
            return min(Lx, Ly)
        else:
            # x = 0 and reserves entirely in y. [8]
            return Pool.liq_y_only(y, rPa, rPb)

    @staticmethod
    def x_from_L_rP_rng(L, rP, rPa, rPb):
        """calculate X amount from L, price and bounds"""
        # if the price is outside the range, use range endpoints instead [11]
        rP = max(min(rP, rPb), rPa)
        return L * (rPb - rP) / (rP * rPb)

    @staticmethod
    def y_from_L_rP_rng(L, rP, rPa, rPb):
        """calculate Y amount from L, price and bounds"""
        # if the price is outside the range, use range endpoints instead [12]
        rP = max(min(rP, rPb), rPa)
        return L * (rP - rPa)

    # bounds in 2-steps calc, after getting Liquidity
    @staticmethod
    def rPa_from_L_rP_y(L, rP, y):
        """lower bound from L, price and y amount [13]"""
        return rP - (y / L)

    @staticmethod
    def rPb_from_L_rP_x(L, rP, y):
        """upper bound from L, price and x amount [14]"""
        return rP - (y / L)

    # bounds in 1-step calc, from real reserves
    @staticmethod
    def rPa_from_x_y_rP_rPb(x, y, rP, rPb):
        """lower bound from x, y amounts, price and upper bound [15]"""
        return (y / (rPb * x)) + rP - (y / (rP * x))

    @staticmethod
    def rPb_from_x_y_rP_rPa(x, y, rP, rPa):
        """upper bound from x, y amounts, price and lower bound [16]"""
        return (rP * y) / ((rPa - rP) * rP * x + y)
