"""
Classes to conceptualize the workings of an AMM v3  liquiditiy pool,
with implementation of HMM adjustments.
References:
  * Uniswap v3 core paper
  * Liquidity Math in Uniswap v3 - Technical Note
  * Hydraswap HMM adjustment with C coefficient
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
    hg_x: float = 0.0  # fee growth global
    hg_y: float = 0.0  # fee growth global
    # proto_x: float = 0.0  # protocol fees
    # proto_y: float = 0.0  # protocol fees


@dataclass
class TickState:
    """Tick Indexed State"""

    liq_net: float = 0.0  # LiquidityNet
    liq_gross: float = 0.0  # LiquidityGross
    f0_x: float = 0.0  # feegrowth outside
    f0_y: float = 0.0  # feegrowth outside
    h0_x: float = 0.0  # hmm adj-fee growth outside
    h0_y: float = 0.0  # hmm adj-fee growth outside
    # TODO : implem s0, i0, sl0 in Tick-state
    # s0_x: float = 0.0  # seconds (time) outside
    # s0_y: float = 0.0  # seconds (time) outside
    # i0_x: float = 0.0  # tickCumulative outside
    # i0_y: float = 0.0  # tickCumulative outside
    # sl0_x: float = 0.0  # secondsPerLiqudity outside
    # sl0_y: float = 0.0  # secondsPerLiqudity outside


@dataclass
class PositionState:
    """Position Indexed State"""

    liq: float = 0.0  # liquidity
    fr_x: float = 0.0  # feegrowth inside last
    fr_y: float = 0.0  # feegrowth inside last
    hr_x: float = 0.0  # hmm adj-fee growth inside last
    hr_y: float = 0.0  # hmm adj-fee growth inside last


class Pool:
    """AMM pool with concentrated liquidity
    tokens X and Y, prices expressed with Y as numeraire"""

    TICK_BASE = 1.0001
    ADJ_WHOLE_FILL = 1e-12
    ADJ_WITHDRAWAL = 0e-8

    def __init__(
        self,
        x_name,
        x_decimals,
        y_name,
        y_decimals,
        bootstrap_rP,
        tick_spacing: int = 1,
        hmm_C: float = 0.0,
        fee_rate: float = 0.0,
    ):
        self.token_x = Token(x_name, x_decimals)
        self.token_y = Token(y_name, y_decimals)
        # only tick multiple of spacing are allowed
        self.tick_spacing = tick_spacing

        tk = self.rP_to_possible_tick(bootstrap_rP, left_to_right=False)
        self.global_state = GlobalState(
            rP=self.tick_to_rP(tk),
            tick=tk,
        )

        # * initialized ticks, keys are the tick i itself
        self.active_ticks = {}  # {i: TickState() for i in range(5)}
        # * positions are indexed by ( user_id, lower_tick, upper_tick):
        self.positions = {}
        # real reserves
        self.X, self.Y = 0.0, 0.0
        # * cumulative adjustements of diffs (adjustments) between AMM & HMM
        # * retained in pool as fees. To be merged with other fees
        self.X_adj, self.Y_adj = 0.0, 0.0
        self.C = hmm_C
        # * we keep track of swap fees (can split later  btw pure | protocol)
        self.X_fee, self.Y_fee = 0.0, 0.0
        self.fee_rate = fee_rate

    def name(self):
        name = f"{self.token_x.name}-{self.token_y.name} pool"
        return f"{name} - tick spacing {self.tick_spacing}"

    def __repr__(self):
        lines = []
        lines.append(f"{self.name()}")
        lines.append(f"{self.token_x} {self.token_y}")
        lines.append(f"{repr(self.global_state)}")
        lines.append(f"real reserve X={self.X} Y={self.Y}")
        lines.append(f"cumulative HMM X_adj={self.X_adj} Y_adj={self.Y_adj}")
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

    def show(self, ticks=True, positions=True):
        print()
        print(f"{self.global_state}\nreal reserves X={self.X} Y={self.Y}")
        print(f"cumulative HMM X_adj={self.X_adj} Y_adj={self.Y_adj}")
        print(f"cumulative swap fees_X={self.X_fee} fees_Y={self.Y_fee}")

        if ticks:
            print("---active ticks---")
            for k, v in self.active_ticks.items():
                print(f"tick '{k}': {v}")
        if positions:
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
            return Pool.liq_x_only(x, rPa, rPb)
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
    def _liq_from_x_y_rP_rng(x, y, t, ta, tb):
        rP = Pool.tick_to_rP(t)
        rPa = Pool.tick_to_rP(ta)
        rPb = Pool.tick_to_rP(tb)
        return Pool.liq_from_x_y_rP_rng(x, y, rP, rPa, rPb)

    @staticmethod
    def x_from_L_rP_rng(L, rP, rPa, rPb):
        """calculate X amount from L, price and bounds"""
        # if the price is outside the range, use range endpoints instead [11]
        rP = max(min(rP, rPb), rPa)
        return L * (rPb - rP) / (rP * rPb)

    @staticmethod
    def _x_from_L_rP_rng(L, t, ta, tb):
        rP = Pool.tick_to_rP(t)
        rPa = Pool.tick_to_rP(ta)
        rPb = Pool.tick_to_rP(tb)
        return Pool.x_from_L_rP_rng(L, rP, rPa, rPb)

    @staticmethod
    def y_from_L_rP_rng(L, rP, rPa, rPb):
        """calculate Y amount from L, price and bounds"""
        # if the price is outside the range, use range endpoints instead [12]
        rP = max(min(rP, rPb), rPa)
        return L * (rP - rPa)

    @staticmethod
    def _y_from_L_rP_rng(L, t, ta, tb):
        rP = Pool.tick_to_rP(t)
        rPa = Pool.tick_to_rP(ta)
        rPb = Pool.tick_to_rP(tb)
        return Pool.y_from_L_rP_rng(L, rP, rPa, rPb)

    # bounds in 2-steps calc, after getting Liquidity
    @staticmethod
    def rPa_from_L_rP_y(L, rP, y):
        """lower bound from L, price and y amount [13]"""
        return rP - (y / L)

    @staticmethod
    def rPb_from_L_rP_x(L, rP, x):
        """upper bound from L, price and x amount [14]"""
        return L * rP / (L - rP * x)

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
    def dX_from_L_drP_hmm(L, rP_old, rP_new, C, rP_oracle):
        """Chg of reserve X based of chg of price with HMM adj"""
        if C == 1.0:
            return L / rP_oracle * math.log(rP_old / rP_new)
        else:
            omc = 1.0 - C  # one minus C
            cmo = -omc  # C minus one
            return L / (rP_oracle ** C) * (rP_new ** cmo - rP_old ** cmo) / omc

    @staticmethod
    def dY_from_L_drP_hmm(L, rP_old, rP_new, C, rP_oracle):
        """Chg of reserve Y based of chg of price with HMM adj"""
        if C == 1.0:
            return L * rP_oracle * math.log(rP_old / rP_new)
        else:
            omc = 1.0 - C  # one minus C
            return L * (rP_oracle ** C) * (rP_new ** omc - rP_old ** omc) / omc

    @staticmethod
    def rP_new_from_L_dX(L, rP_old, dX):
        """new price based of change of reserve X"""
        drP_inv = dX / L
        return 1 / (drP_inv + 1 / rP_old)

    @staticmethod
    def rP_new_from_L_dY(L, rP_old, dY):
        """new price based of change of reserve Y"""
        return dY / L + rP_old

    @staticmethod
    def tick_to_rP(tick):
        return Pool.TICK_BASE ** (tick / 2)

    @staticmethod
    def rP_to_tick(rP, left_to_right=False):
        d = math.pow(Pool.TICK_BASE, 1 / 2)
        if left_to_right is True:
            return math.ceil(math.log(rP, d))
        else:
            return math.floor(math.log(rP, d))

    # TODO add memo() method which saves states b4 swap/deposit etc
    # + and reinstates them if exception raised at any point during op
    # + OR create memo b4 op, work only on memo till very end and no errors
    # + then update real state with memo contents.
    def memo():
        pass

    def tick_to_possible_tick(self, tick, left_to_right=False):
        # use self.tick_spacing to find allowable tick that is <= tick_lower
        #  unchanged if self.tick_spacing is 1
        if left_to_right is True:
            return math.ceil(tick / self.tick_spacing) * self.tick_spacing
        else:
            return math.floor(tick / self.tick_spacing) * self.tick_spacing

    def rP_to_possible_tick(self, rP, left_to_right=False):
        # find allowable tick that is <= tick_theo, from given rP
        tick_theo = Pool.rP_to_tick(rP, left_to_right)
        return self.tick_to_possible_tick(tick_theo, left_to_right)

    def initialize_tick(self, tick: int) -> TickState:
        # set f0 of tick based on convention [6.21]
        f0_x = self.global_state.fg_x if self.global_state.tick >= tick else 0
        f0_y = self.global_state.fg_y if self.global_state.tick >= tick else 0

        h0_x = self.global_state.hg_x if self.global_state.tick >= tick else 0
        h0_y = self.global_state.hg_y if self.global_state.tick >= tick else 0
        # TODO : to the same to s0, i0 and sl0 of tick state

        ts = TickState(f0_x=f0_x, f0_y=f0_y, h0_x=h0_x, h0_y=h0_y)
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

    def get_left_limit_of_swap_within(self, start_t):
        """get next available active tick from a starting point going left"""
        tick = min(start_t, self.global_state.tick)
        tick = self.tick_to_possible_tick(tick, left_to_right=False)
        for tk in sorted(self.active_ticks.keys(), reverse=True):
            if tk <= tick:
                # case when  starting_rP equals exactly tick_torP(current tick)
                #  is covered in swap method (will do 0-qty and trigger cross)
                return tk
            # ignore ticks above current tick
            continue

        # if we get here then no active tick left
        return None

    def get_right_limit_of_swap_within(self, start_t, glbl_tick):
        """get next available active tick from a starting point going right
        this function is to determine the limit of a swap_within_from_Y
        Caution not to use for cross_tick"""

        # get to initializable tick
        start_tick = self.tick_to_possible_tick(start_t, left_to_right=False)
        # we use False here to round down
        if start_tick == glbl_tick:
            # we've already technically crossed this tick (left-to-right) i.e.
            # the liquidity corresponding to this tick [start_tick, next_tick)
            # is already in range. We are looking for the 1st active tick
            # strictly superior to it.
            for tk in sorted(self.active_ticks.keys()):  # ascending
                if tk > start_tick:
                    return tk
                # ignore current tick and below
                continue
        elif start_tick > glbl_tick:
            # the global rP has already travelled to the tick above the
            # current global tick (WITHOUT CROSSING over it left to right)
            # so liqudity-wise we are still in the range of current_tick
            # in this case we are looking for the 1st active tick
            # above AND possibly INCLUDING start_tick. If start_tick is indeed
            # part of active_ticks, the very next swap_within_from_Y will
            # result in a 0_qty swap and trigger a crossing to the right
            for tk in sorted(self.active_ticks.keys()):  # ascending
                if tk >= start_tick:
                    return tk
                # ignore ticks strictly below
                continue
        else:
            raise Exception(
                "as per convention, we do not expect the global rP to ever "
                + "be strictly below the current global tick"
            )

        # if we get here then no active tick right
        return None

    def try_get_in_range(self, left_to_right=False):
        """During swap, when no liquidity in current state, find next active
        tick, cross it to kick-in some liquidity. return tick and rP.
        If no active tick left return None, _"""
        if self.global_state.L > 0.0:
            raise Exception("there already is liquidity in range")

        if not left_to_right:  # going right to left, X in Y out
            for tk in sorted(self.active_ticks.keys(), reverse=True):
                if tk > self.global_state.tick:
                    # ignore ticks above current tick
                    continue
                self.global_state.tick = tk  # to prepare crossing
                self.global_state.rP = Pool.tick_to_rP(tk)
                self.cross_tick(tk, left_to_right=False)
                # crossing shud put glbl_state.tick 1 (possible) tick under tk
                # set the next goal for swap
                new_goal = self.get_left_limit_of_swap_within(
                    self.global_state.tick
                )
                # at this point some Liquidity should have kicked in
                if self.global_state.L < 0.0:
                    raise Exception(
                        """from being out of range, we don't expect to kick in
                         negative liquidity"""
                    )
                if self.global_state.L > 0.0:
                    # * return next goal (1 tick under tk) and tk just crossed
                    return new_goal, tk, self.global_state.rP
        else:  # left to right, Y in X out
            for tk in sorted(self.active_ticks.keys()):  # ascending
                if tk <= self.global_state.tick:
                    # ignore ticks below current tick
                    continue
                self.global_state.tick = tk
                self.global_state.rP = Pool.tick_to_rP(tk)
                self.cross_tick(tk, left_to_right=True)
                # at this point some Liquidity should have kicked in
                # now find the new goal_tick to be passed to swap_within()
                new_goal = self.get_right_limit_of_swap_within(
                    start_t=tk,
                    glbl_tick=tk,
                )

                if self.global_state.L < 0.0:
                    raise Exception(
                        """from being out of range, we don't expect to kick in
                         negative liquidity"""
                    )
                if self.global_state.L > 0.0:
                    # * return next goal and tk just crossed (==global_st tick)

                    return new_goal, tk, self.global_state.rP

        return None, self.global_state.tick, self.global_state.rP

    def cross_tick(self, provided_tick, left_to_right=True):
        """Handle update of global state and tick state when
        initialized tick is crossed while performing swap"""

        if not left_to_right and self.global_state.tick != provided_tick:
            raise Exception("can only cross current tick")

        # Get the liquidity delta from tick
        ts: TickState = self.active_ticks.get(provided_tick, None)
        if ts is None:
            raise Exception("cannot find tick for crossing")

        # add/substract to glabal liq depending on direction of crossing
        liq_to_apply = ts.liq_net if left_to_right else -ts.liq_net
        if self.global_state.L + liq_to_apply < 0.0:
            raise Exception("liquidity cannot turn negative")
        self.global_state.L += liq_to_apply

        # update tick state by flipping fee growth outside f0_X_Y [6.26]
        ts.f0_x = self.global_state.fg_x - ts.f0_x
        ts.f0_y = self.global_state.fg_y - ts.f0_y

        ts.h0_x = self.global_state.hg_x - ts.h0_x
        ts.h0_y = self.global_state.hg_y - ts.h0_y

        # TODO: do the same for s0, i0, sl0 in Tick-state

        # update current tick in global state to reflect crossing; rP unchanged
        if left_to_right is True:
            self.global_state.tick = provided_tick
        else:
            self.global_state.tick = self.tick_to_possible_tick(
                provided_tick - 1, left_to_right
            )

    def fee_below_above(self, tick, for_x=True, swp=True):
        """Fees earned in a token below and above tick, as tuple.
        can compute for either token, and for either swap fees or hmm fees"""

        token = "x" if for_x else "y"
        which = "f" if swp else "h"

        i_c = self.global_state.tick
        fg = getattr(self.global_state, f"{which}g_{token}")
        ts: TickState = self.active_ticks.get(tick, None)
        if ts is None:
            # raise Exception("cannot find tick for fee calc")
            return (fg, 0.0)  # from [6.17 - 6.21], convention

        f0 = getattr(ts, f"{which}0_{token}")  # f0_x or f0_y or h0_x or h0_y

        f_below = f0 if i_c >= tick else fg - f0
        f_above = fg - f0 if i_c >= tick else f0

        return (f_below, f_above)

    def fee_rng(self, lower_tick, upper_tick, for_x=True, swp=True):
        f_blw_lwr, f_abv_lwr = self.fee_below_above(lower_tick, for_x, swp)
        f_blw_upr, f_abv_upr = self.fee_below_above(upper_tick, for_x, swp)

        # retrieve fg by summing up either tuple, they should match
        assert f_blw_lwr + f_abv_lwr == f_blw_upr + f_abv_upr
        fg = f_blw_lwr + f_abv_lwr

        return fg - f_blw_lwr - f_abv_upr

    def _set_position(self, user_id, lower_tick, upper_tick, liq_delta):
        """handles all facets for updates a position for in the pool,
        used for deposits (l>0), withdrawals (l<0)"""
        # compute the uncollected fees f_u the poz is entitled to
        # first compute new FeeGrowthInside, to be written to position
        # will be set to 0 by function if tick not initialized
        new_fr_x = self.fee_rng(lower_tick, upper_tick, for_x=True)
        new_fr_y = self.fee_rng(lower_tick, upper_tick, for_x=False)

        new_hr_x = self.fee_rng(lower_tick, upper_tick, for_x=True, swp=False)
        new_hr_y = self.fee_rng(lower_tick, upper_tick, for_x=False, swp=False)

        # then get old value from when position was last touched.(set below)
        # set to 0 as default for when new position
        old_fr_x, old_fr_y = 0.0, 0.0
        old_hr_x, old_hr_y = 0.0, 0.0
        # liquidity to use for computing fee amounts (set below)
        base = 0.0

        # find position if exists
        # positions are uniquely identitfied by the (sender, lower, upper)
        key = (user_id, lower_tick, upper_tick)
        poz: PositionState = self.positions.get(key, None)

        if poz is None:
            if liq_delta < 0.0:
                # abort if withdrawal liq exceeds position liquidity
                raise Exception("cannot newly provide negative liquidity")
            # creates a new position
            self.positions[key] = PositionState(
                liq=liq_delta, fr_x=0.0, fr_y=0.0, hr_x=0.0, hr_y=0.0
            )
        else:
            # get old value for feed from when position was last touched
            old_fr_x, old_fr_y = poz.fr_x, poz.fr_y
            old_hr_x, old_hr_y = poz.hr_x, poz.hr_y
            base = poz.liq

            # update existing position
            if liq_delta < 0.0 and poz.liq + liq_delta < 0.0:
                # abort if withdrawal liq exceeds position liquidity
                raise Exception("liquidity is position insufficient")

            if poz.liq + liq_delta == 0.0:
                # if position liq becomes 0 after operation remove from pool
                del self.positions[key]
            else:
                self.positions[key] = PositionState(
                    liq=poz.liq + liq_delta,
                    fr_x=new_fr_x,
                    fr_y=new_fr_y,
                    hr_x=new_hr_x,
                    hr_y=new_hr_y,
                )
        # now calulate uncollected fees to be applied
        f_u_x = new_fr_x - old_fr_x
        f_u_y = new_fr_y - old_fr_y
        h_u_x = new_hr_x - old_hr_x
        h_u_y = new_hr_y - old_hr_y
        assert f_u_x >= 0.0 and f_u_y >= 0.0
        assert h_u_x >= 0.0 and h_u_y >= 0.0

        # update tick states for lower and upper
        self.update_tick(lower_tick, liq_delta, upper=False)
        self.update_tick(upper_tick, liq_delta, upper=True)

        # update global state's liquidity if current price in poz's range
        if (
            self.global_state.tick >= lower_tick
            and self.global_state.tick < upper_tick
        ):
            self.global_state.L += liq_delta

        # return uncollected fee amounts to offset/add in deposit/withdrawal
        return base * f_u_x, base * f_u_y, base * h_u_x, base * h_u_y

    def deposit(self, user_id, x, y, rPa, rPb):
        """interface to deposit liquidity in pool & give change if necessary"""
        assert x >= 0.0
        assert y >= 0.0

        # calculate ticks that will be used to track position
        lower_tick = self.rP_to_possible_tick(rPa, left_to_right=False)
        upper_tick = self.rP_to_possible_tick(rPb, left_to_right=False)

        tk = self.global_state.tick
        # TODO should we use Oracle price here instead? or real price as param
        # ? only when no liquidity in range?

        liq = Pool._liq_from_x_y_rP_rng(x, y, tk, lower_tick, upper_tick)
        # round down to avoid float rounding vulnerabilities
        # TODO choose what precision to round down to.
        liq = math.floor(liq)

        x_in = Pool._x_from_L_rP_rng(liq, tk, lower_tick, upper_tick)
        y_in = Pool._y_from_L_rP_rng(liq, tk, lower_tick, upper_tick)
        assert x_in <= x, "used x amt cannot excess provided amount"
        assert y_in <= y, "used y amt cannot excess provided amount"

        fees_x, fees_y, adj_x, adj_y = self._set_position(
            user_id, lower_tick, upper_tick, liq_delta=liq
        )
        # offset fee amounts from deposit amounts
        # this will be the amount debited from user
        x_debited = x_in - fees_x - adj_x
        y_debited = y_in - fees_y - adj_y
        # update state: reserves, fee pot , hmm-adj-fee pot
        self.X += x_in
        self.Y += y_in
        self.X_fee -= fees_x
        self.X_adj -= adj_x
        self.Y_fee -= fees_y
        self.Y_adj -= adj_y
        print()
        print(f"{x_debited=} {y_debited=}")
        print(f"including {fees_x+adj_x=} and {fees_y+adj_y=}")
        print(f"X returned {x-x_debited} Y returned {y-y_debited}")

    def withdraw(self, user_id, liq, rPa, rPb):
        """interface to withdraw liquidity from pool"""
        assert liq >= 0.0

        # calculate ticks that will be used to track position
        lower_tick = self.rP_to_possible_tick(rPa, left_to_right=False)
        upper_tick = self.rP_to_possible_tick(rPb, left_to_right=False)

        fees_x, fees_y, adj_x, adj_y = self._set_position(
            user_id, lower_tick, upper_tick, liq_delta=-liq
        )

        tk = self.global_state.tick
        # TODO should we use Oracle price here instead? or real price as param
        # ? only when no liquidity in range?

        x_out = Pool._x_from_L_rP_rng(liq, tk, lower_tick, upper_tick)
        y_out = Pool._y_from_L_rP_rng(liq, tk, lower_tick, upper_tick)
        # round down amount withdrawn if necessary, as precation
        x_out *= 1 - Pool.ADJ_WITHDRAWAL
        y_out *= 1 - Pool.ADJ_WITHDRAWAL

        # add fees on to what user will receive
        x_sent = x_out + fees_x + adj_x
        y_sent = y_out + fees_y + adj_y
        # update state: reserves, fee pot , hmm-adj-fee pot
        self.X -= x_out
        self.Y -= y_out
        self.X_fee -= fees_x
        self.X_adj -= adj_x
        self.Y_fee -= fees_y
        self.Y_adj -= adj_y
        print()
        print(f"{x_sent=} {y_sent=}")
        print(f"including {fees_x+adj_x=} & {fees_y+adj_y=}")

    def swap_within_tick_from_X(
        self, start_rP, goal_tick, L, dX, rP_oracle=None
    ):
        # + no writing to state to occurs here, just calc and return to caller
        done_dX, done_dY, end_t = 0.0, 0.0, 0.0
        cross: bool = False
        done_dY_amm, hmm_adj_Y = 0.0, 0.0
        dX_max, fee_X = 0.0, 0.0

        if dX <= 0.0:
            raise Exception("can only handle X being supplied to pool, dX>0")

        # root-price at goal tick - here on the left
        rP_goal = Pool.tick_to_rP(goal_tick)
        if rP_goal > start_rP:
            raise Exception("expect price to go down when X supplied to pool")
            # we allow case when price exactly on the current tick
            # ( i.e. rP_goal = start_rP)
            # this will lead to 0-qty swapped, and crossing before next swap

        # take out max potential swap fees before affecting prices
        dX_max = dX * (1.0 - self.fee_rate)

        # chg of reserve X possible if we go all the way to goal tick
        doable_dX = Pool.dX_from_L_drP(L=L, rP_old=start_rP, rP_new=rP_goal)
        if doable_dX < 0.0:  # expect a positive number
            raise Exception("doable_dX > 0 when X supplied to pool")

        if doable_dX < dX_max:
            # we'll have leftover to swap. do what we can. done_X = doableX
            done_dX = doable_dX
            # reverse engineer how much fees charged based on how much done_dX
            fee_X = done_dX / (1.0 - self.fee_rate) * self.fee_rate
            cross = True  # because we'll need to cross and do extra swaps
            end_t = goal_tick  # swap so far moves price to level at this tick
            end_rP = rP_goal  # ensure use same rP at tick borders, avoid log

        else:
            # we have enough. make all dX_max 'done', then calc end_rP
            done_dX = dX_max
            fee_X = dX - dX_max  # fee as expected
            cross = False
            end_rP = Pool.rP_new_from_L_dX(L, start_rP, done_dX)
            end_t = Pool.rP_to_tick(end_rP, False)
            # * this log is take only once per trade if end between ticks
            # * tick is always on the left (round down after log)

            if end_rP > start_rP:
                raise Exception("expect end_rP < start_rP when pool given X")
            if end_rP < rP_goal:
                raise Exception(
                    "dont expect end_rP go beyond rP_goal (tick on the left) "
                    + "when able to do a whole fill of dX"
                )

        # now figure out how much done_dY and hmm_adj_Y
        done_dY_amm = Pool.dY_from_L_drP(L=L, rP_old=start_rP, rP_new=end_rP)
        if rP_oracle is None or self.C == 0.0 or rP_oracle >= start_rP:
            # 1st two cases cannot adjust so fall back to amm
            # * when trade will make pool price diverge more from oracle,
            # * then we don't adjust (hmm adjust on convergence only)
            done_dY = done_dY_amm
        elif rP_oracle < start_rP and rP_oracle >= end_rP:
            # 1st term is redundant as implied from precious branch
            # we are adding for precision and readability
            # * when oracle is in between start_rP and end_rP prices, use hmm
            # * till we get to oracle then use unadjusted amm till end_rP
            done_dY = Pool.dY_from_L_drP_hmm(
                L=L,
                rP_old=start_rP,
                rP_new=rP_oracle,
                C=self.C,
                rP_oracle=rP_oracle,
            )
            done_dY += Pool.dY_from_L_drP(L=L, rP_old=rP_oracle, rP_new=end_rP)
        elif rP_oracle < end_rP:
            # * when trade will make pool price converge to oracle price
            # * and end_rP won't reach the oracle price
            # * then use hmm all the way
            done_dY = Pool.dY_from_L_drP_hmm(
                L=L,
                rP_old=start_rP,
                rP_new=end_rP,
                C=self.C,
                rP_oracle=rP_oracle,
            )
        else:
            # we don't expect to hit this. raise error if we do hit
            raise Exception(
                "HMM adjstment: possibilities should be exhausted by now"
            )

        # adjust conservatively to avoid rounding issues.
        done_dY *= 1 - Pool.ADJ_WHOLE_FILL
        done_dY_amm *= 1 - Pool.ADJ_WHOLE_FILL

        hmm_adj_Y = done_dY - done_dY_amm

        if done_dY_amm > 0.0:
            raise Exception("expect done_dY < 0 when X supplied to pool")
            # again we allow 0-qty swap, just in case price was already
            # exactly on the tick we started with
        if hmm_adj_Y < 0.0:
            raise Exception("hmm adj should be positive (conservative 4 pool)")
        if self.Y + done_dY_amm < 0.0:
            raise Exception("cannot swap out more Y than present in pool")
        return done_dX, done_dY, end_t, end_rP, cross, hmm_adj_Y, fee_X

    def execute_swap_from_X(self, dX, rP_oracle=None):
        """Swap algo when provided with dX>0
        We go from right to left on the curve and manage crossings as needed.
        within initialized tick we use swap_within_tick_from_X"""
        if dX <= 0.0:
            raise Exception("can only handle X being supplied to pool, dX>0")

        left_to_right = False

        # get current tick, current root price, and liquidity in range
        curr_t = self.global_state.tick
        curr_rP = self.global_state.rP

        # main case where liq_in range > 0 , call swap_within_tick_from_X
        # otherwise try to get in range.
        # repeat till full order filled or liquidity dries up, whichever first
        swpd_dX = 0.0
        swpd_dY = 0.0
        adjusted_dY = 0.0
        total_fee_X = 0.0
        avg_P, end_P = 0.0, 0.0
        while swpd_dX < dX:
            if self.global_state.L > 0:
                goal_tick = self.get_left_limit_of_swap_within(start_t=curr_t)
            else:
                # try move into range, if cannot then break out to end swap
                print("Gap in liquidity... trying to get in range...")
                goal_tick, curr_t, curr_rP = self.try_get_in_range(
                    left_to_right=False
                )

            if goal_tick is None:
                # there are no more active ticks on the left, terminate swap
                print("no more active ticks (liquidity) in this direction")
                avg_P = -swpd_dY / swpd_dX if swpd_dX != 0.0 else None
                end_P = self.global_state.rP ** 2
                print(
                    f"{swpd_dX=} {swpd_dY=} pool_X={self.X} pool_Y={self.Y} "
                    + f"{avg_P=}, {end_P=:.4f}"
                )
                print(
                    f"{adjusted_dY=}  pool_cumul_Y_adj={self.Y_adj} "
                    + f"{total_fee_X=}  pool_cumul_X_fee={self.X_fee}"
                )
                return swpd_dX, swpd_dY, adjusted_dY, total_fee_X, avg_P, end_P

            (
                done_dX,
                done_dY,
                end_t,
                end_rP,
                cross,
                hmm_adj_Y,
                fee_X,
            ) = self.swap_within_tick_from_X(
                start_rP=curr_rP,
                goal_tick=goal_tick,
                L=self.global_state.L,
                dX=dX - swpd_dX,
                rP_oracle=rP_oracle,
            )
            assert self.Y + done_dY - hmm_adj_Y >= 0.0
            assert dX - swpd_dX >= done_dX + fee_X

            swpd_dX += done_dX + fee_X  # gross for input token
            swpd_dY += done_dY  # net for output token
            adjusted_dY += hmm_adj_Y
            total_fee_X += fee_X
            curr_t = end_t
            curr_rP = end_rP

            # update global state to reflect price change (if any) & reserves
            self.global_state.tick = curr_t
            self.global_state.rP = curr_rP
            self.X += done_dX
            self.Y += done_dY - hmm_adj_Y  # adj out of reserves into fees
            self.X_fee += fee_X
            self.Y_adj += hmm_adj_Y
            if self.global_state.L > 0.0:
                # make sure not 0 liquidity (empty trade)
                # * update fee growth to reflect latest swap_within
                self.global_state.fg_x += fee_X / self.global_state.L
                self.global_state.hg_y += hmm_adj_Y / self.global_state.L

            if cross is True:
                assert end_t == goal_tick
                if goal_tick in self.active_ticks:
                    self.cross_tick(
                        provided_tick=goal_tick,
                        left_to_right=left_to_right,
                    )

        avg_P = -swpd_dY / swpd_dX if swpd_dX != 0.0 else None
        end_P = self.global_state.rP ** 2
        print(
            f"{swpd_dX=} {swpd_dY=} pool_X={self.X} pool_Y={self.Y} "
            + f"{avg_P=}, {end_P=:.4f}"
        )
        print(
            f"{adjusted_dY=}  pool_cumul_Y_adj={self.Y_adj} "
            + f"{total_fee_X=}  pool_cumul_X_fee={self.X_fee}"
        )
        return swpd_dX, swpd_dY, adjusted_dY, total_fee_X, avg_P, end_P

    def swap_within_tick_from_Y(
        self, start_rP, goal_tick, L, dY, rP_oracle=None
    ):
        # + no writing to state to occurs here, just calc and return to caller
        done_dX, done_dY, end_t = 0.0, 0.0, 0.0
        cross: bool = False
        done_dX_amm, hmm_adj_X = 0.0, 0.0
        dY_max, fee_Y = 0.0, 0.0

        if dY <= 0.0:
            raise Exception("can only handle Y being supplied to pool, dY>0")

        # root-price at goal tick - here on the right
        rP_goal = Pool.tick_to_rP(goal_tick)
        if rP_goal < start_rP:
            raise Exception("expect price to go up when Y supplied to pool")
            # we allow case when price exactly on the current tick
            # ( i.e. rP_goal = start_rP)
            # this will lead to 0-qty swapped, and crossing before next swap

        # take out max potential swap fees before affecting prices
        dY_max = dY * (1.0 - self.fee_rate)

        # chg of reserve Y possible if we go all the way to goal tick
        doable_dY = Pool.dY_from_L_drP(L=L, rP_old=start_rP, rP_new=rP_goal)
        if doable_dY < 0.0:  # expect a positive number
            raise Exception("doable_dY > 0 when Y supplied to pool")

        if doable_dY < dY_max:
            # we'll have leftover to swap. do what we can. done_Y = doableY
            done_dY = doable_dY
            # reverse engineer how much fees charged based on how much done_dY
            fee_Y = done_dY / (1.0 - self.fee_rate) * self.fee_rate
            cross = True  # because we'll need to cross and do extra swaps
            end_t = goal_tick  # swap so far moves price to level at this tick
            end_rP = rP_goal  # ensure use same rP at tick borders, avoid log

        else:
            # we have enough, make all of dY_max 'done', then calc end_rP
            done_dY = dY_max
            fee_Y = dY - dY_max  # fee as expected
            cross = False
            end_rP = Pool.rP_new_from_L_dY(L, start_rP, done_dY)
            end_t = Pool.rP_to_tick(end_rP, False)
            # * this log is take only once per trade if end between ticks
            # * tick is always on the left (round down after log)

            if end_rP < start_rP:
                raise Exception("expect end_rP > start_rP when pool given Y")
            if end_rP > rP_goal:
                raise Exception(
                    "dont expect end_rP go beyond rP_goal (tick on the right) "
                    + "when able to do a whole fill of dY"
                )

        # now figure out how much done_dX and hmm_adj_X
        done_dX_amm = Pool.dX_from_L_drP(L=L, rP_old=start_rP, rP_new=end_rP)
        if rP_oracle is None or self.C == 0.0 or rP_oracle <= start_rP:
            # 1st two cases cannot adjust so fall back to amm
            # * when trade will make pool price diverge more from oracle,
            # * then we don't adjust (hmm adjust on convergence only)
            done_dX = done_dX_amm
        elif rP_oracle > start_rP and rP_oracle <= end_rP:
            # 1st term is redundant as implied from precious branch
            # we are adding for precision and readability
            # * when oracle is in between start_rP and end_rP prices, use hmm
            # * till we get to oracle then use unadjusted amm till end_rP
            done_dX = Pool.dX_from_L_drP_hmm(
                L=L,
                rP_old=start_rP,
                rP_new=rP_oracle,
                C=self.C,
                rP_oracle=rP_oracle,
            )
            done_dX += Pool.dX_from_L_drP(L=L, rP_old=rP_oracle, rP_new=end_rP)
        elif rP_oracle > end_rP:
            # * when trade will make pool price converge to oracle price
            # * and end_rP won't reach the oracle price
            # * then use hmm all the way
            done_dX = Pool.dX_from_L_drP_hmm(
                L=L,
                rP_old=start_rP,
                rP_new=end_rP,
                C=self.C,
                rP_oracle=rP_oracle,
            )
        else:
            # we don't expect to hit this. raise error if we do hit
            raise Exception(
                "HMM adjstment: possibilities should be exhausted by now"
            )

        # adjust to prevent rounding issues
        done_dX_amm *= 1 - Pool.ADJ_WHOLE_FILL
        done_dX *= 1 - Pool.ADJ_WHOLE_FILL

        hmm_adj_X = done_dX - done_dX_amm

        if done_dX_amm > 0.0:
            raise Exception("expect done_dX < 0 when Y supplied to pool")
            # again we allow 0-qty swap, just in case price was already
            # exactly on the tick we started with
        if hmm_adj_X < 0.0:
            raise Exception("hmm adj should be positive (conservative 4 pool)")
        if self.X + done_dX_amm < 0.0:
            raise Exception("cannot swap out more X than present in pool")
        return done_dX, done_dY, end_t, end_rP, cross, hmm_adj_X, fee_Y

    def execute_swap_from_Y(self, dY, rP_oracle=None):
        """Swap algo when pool provided with dY > 0
        We go from right to left on the curve and manage crossings as needed.
        within initialized tick we use swap_within_tick_from_X"""
        if dY <= 0.0:
            raise Exception("can only handle Y being supplied to pool, dY>0")

        left_to_right = True

        # get current tick, current root price, and liquidity in range
        curr_t = self.global_state.tick
        curr_rP = self.global_state.rP

        # main case where liq_in range > 0 , call swap_within_tick_from_Y
        # otherwise try to get in range.
        # repeat till full order filled or liquidity dries up, whichever first
        swpd_dX = 0.0
        swpd_dY = 0.0
        adjusted_dX = 0.0
        total_fee_Y = 0.0
        avg_P, end_P = 0.0, 0.0
        while swpd_dY < dY:
            if self.global_state.L > 0:
                goal_tick = self.get_right_limit_of_swap_within(
                    start_t=curr_t,
                    glbl_tick=self.global_state.tick,
                )
            else:
                # try move into range, if cannot then break out to end swap
                print("Gap in liquidity... trying to get in range...")
                goal_tick, curr_t, curr_rP = self.try_get_in_range(
                    left_to_right=True
                )

            if goal_tick is None:
                # there are no more active ticks on the left, terminate swap
                print("no more active ticks (liquidity) in this direction")
                avg_P = -swpd_dY / swpd_dX if swpd_dX != 0.0 else None
                end_P = self.global_state.rP ** 2
                print(
                    f"{swpd_dX=} {swpd_dY=} pool_X={self.X} pool_Y={self.Y} "
                    + f"{avg_P=}, {end_P=:.4f}"
                )
                print(
                    f"{adjusted_dX=}  pool_cumul_X_adj={self.X_adj} "
                    + f"{total_fee_Y=}  pool_cumul_Y_fee={self.Y_fee}"
                )
                return swpd_dX, swpd_dY, adjusted_dX, total_fee_Y, avg_P, end_P

            (
                done_dX,
                done_dY,
                end_t,
                end_rP,
                cross,
                hmm_adj_X,
                fee_Y,
            ) = self.swap_within_tick_from_Y(
                start_rP=curr_rP,
                goal_tick=goal_tick,
                L=self.global_state.L,
                dY=dY - swpd_dY,
                rP_oracle=rP_oracle,
            )
            assert self.X + done_dX - hmm_adj_X >= 0.0
            assert dY - swpd_dY >= done_dY + fee_Y

            swpd_dX += done_dX  # net for output token
            swpd_dY += done_dY + fee_Y  # gross for input token
            adjusted_dX += hmm_adj_X
            total_fee_Y += fee_Y
            curr_t = end_t
            curr_rP = end_rP

            # update global state to reflect price change (if any) & reserves
            self.global_state.tick = curr_t
            self.global_state.rP = curr_rP
            self.X += done_dX - hmm_adj_X  # adj out of reserves into fees
            self.Y += done_dY
            self.X_adj += hmm_adj_X
            self.Y_fee += fee_Y
            if self.global_state.L > 0.0:
                # make sure not 0 liquidity (empty trade)
                # * update fee growth to reflect latest swap_within
                self.global_state.hg_x += hmm_adj_X / self.global_state.L
                self.global_state.fg_y += fee_Y / self.global_state.L

            if cross is True:
                assert end_t == goal_tick
                if goal_tick in self.active_ticks:
                    self.cross_tick(
                        provided_tick=goal_tick,
                        left_to_right=left_to_right,
                    )

        avg_P = -swpd_dY / swpd_dX if swpd_dX != 0.0 else None
        end_P = self.global_state.rP ** 2
        print(
            f"{swpd_dX=} {swpd_dY=} pool_X={self.X} pool_Y={self.Y} "
            + f"{avg_P=}, {end_P=:.4f}"
        )
        print(
            f"{adjusted_dX=}  pool_cumul_X_adj={self.X_adj} "
            + f"{total_fee_Y=}  pool_cumul_Y_fee={self.Y_fee}"
        )
        return swpd_dX, swpd_dY, adjusted_dX, total_fee_Y, avg_P, end_P
