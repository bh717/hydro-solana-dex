"""
Classes to conceptualize the workings of an AMM v3  liquiditiy pool
based on :
  * Uniswap v3 core paper
  * Liquidity Math in Uniswap v3 - Technical Note
"""
import math
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
    fr_x: float = 0.0  # feegrowth inside last
    fr_y: float = 0.0  # feegrowth inside last


class Pool:
    """AMM pool with concentrated liquidity
    tokens X and Y, prices expressed with Y as numeraire"""

    TICK_BASE = 1.0001

    def __init__(self, x_name, x_decimals, y_name, y_decimals):
        self.token_x = Token(x_name, x_decimals)
        self.token_y = Token(y_name, y_decimals)
        self.global_state = GlobalState()
        # * initialized ticks, keys are the tick i itself
        self.active_ticks = {}  # {i: TickState() for i in range(5)}
        # * positions are indexed by ( user_id, lower_tick, upper_tick):
        self.positions = {}

    def name(self):
        return f"{self.token_x.name}-{self.token_y.name} pool"

    def __repr__(self):
        lines = []
        lines.append(f"{self.name()}")
        lines.append(f"{self.token_x} {self.token_y}")
        lines.append(f"{repr(self.global_state)}")
        lines.append(
            "\n".join(
                [repr(tick) for tick in list(self.active_ticks.values())[:10]]
            )
        )
        lines.append(
            "\n".join(
                [repr(poz) for poz in list(self.positions.values())[:10]]
            )
        )

        return "\n".join(lines)

    def show(self):
        print(f"{self.global_state}\n")
        print("---active ticks---")
        for k, v in self.active_ticks.items():
            print(f"tick '{k}': {v}")
        print("---positions---")
        for k, v in self.positions.items():
            print(f"poz '{k}': {v}")

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

    @staticmethod
    def dX_from_L_drP(L, rP_old, rP_new):
        """Change of reserve X based of change of price"""
        return L * (1 / rP_new - 1 / rP_old)

    @staticmethod
    def dY_from_L_drP(L, rP_old, rP_new):
        """Change of reserve Y based of change of price"""
        return L * (rP_new - rP_old)

    @staticmethod
    def rP_new_from_L_dX(L, rP_old, dX):
        """new price based of change of reserve X"""
        drP_inv = dX / L
        return 1 / (drP_inv + 1 / rP_old)

    @staticmethod
    def rP_new_from_L_dY(L, dY, rP_old):
        """new price based of change of reserve Y"""
        return dY / L + rP_old

    @staticmethod
    def tick_to_rP(tick):
        return Pool.TICK_BASE ** (tick / 2)

    @staticmethod
    def rP_to_current_tick(rP):
        d = math.pow(Pool.TICK_BASE, 1 / 2)
        tick_lower_index = math.floor(math.log(rP, d))
        return tick_lower_index

    def initialize_tick(self, tick: int) -> TickState:
        # set f0 of tick based on convention [6.21]
        f0_x = self.global_state.fg_x if self.global_state.tick >= tick else 0
        f0_y = self.global_state.fg_y if self.global_state.tick >= tick else 0
        ts = TickState(f0_x=f0_x, f0_y=f0_y)

        self.active_ticks[tick] = ts
        return ts

    def unset_tick(self, tick):
        del self.active_ticks[tick]

    def update_tick(self, tick: int, liq_delta, upper=False):
        """Update specific tick's liquidity delta for specific tick"""
        # get the tick state for tick if exists, else initialize one
        ts: TickState = self.active_ticks.get(
            tick, None
        ) or self.initialize_tick(tick)

        ts.liq_net += liq_delta if not upper else -liq_delta
        ts.liq_gross += liq_delta

        if ts.liq_gross == 0.0:
            # de-initialize tick when no longer ref'ed by a position
            self.unset_tick(tick)

    def cross_tick(self, tick):
        """Handle update of global state and tick state when
        initialized tick is crossed while performing swap"""
        pass

    def set_position(self, user_id, lower_tick, upper_tick, liq_delta):
        """handles all facets for updates a position for in the pool,
        used for deposits (l>0), withdrawals (l<0)"""
        # TODO :compute the uncollected fees f_u the poz is entitled to
        new_fr_x, new_fr_y = 0, 0

        # find position if exists
        # positions are uniquely identitfied by the (sender, lower, upper)
        key = (user_id, lower_tick, upper_tick)
        poz: PositionState = self.positions.get(key, None)

        if poz is None:
            # creates a new position
            self.positions[key] = PositionState(
                liq=liq_delta, fr_x=0.0, fr_y=0.0
            )
        else:
            # update existing position
            if liq_delta < 0 and poz.liq + liq_delta < 0:
                # abort if withdrawal liq exceeds position liquidity
                raise Exception("liquidity is position insufficient")

            if poz.liq + liq_delta == 0:
                # if position liq becomes 0 after operation, remove
                del self.positions[key]
            else:
                self.positions[key] = PositionState(
                    liq=poz.liq + liq_delta, fr_x=new_fr_x, fr_y=new_fr_y
                )

        # update tick states for lower and upper
        self.update_tick(lower_tick, liq_delta, upper=False)
        self.update_tick(upper_tick, liq_delta, upper=True)

        # update global state's liquidity if current price in poz's range
        if (
            self.global_state.tick >= lower_tick
            and self.global_state.tick < upper_tick
        ):
            self.global_state.L += liq_delta

    def deposit(self, *args):
        pass

    def withdraw(self, *args):
        pass

    def swap_without_crossing(self, *args):
        pass

    def execute_swap(self, *args):
        pass
