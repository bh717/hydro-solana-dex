# hydra-proto package

`/libs/math/hydra-proto`

this package contains the math to be used by future hydraswap smart contracts, currently in dev. Also different math related tests and prototypes

-----------

## Concentrated liquidity pool design

### Pool Struct

Controls the whole process and runs everything, stores state in its members/components (detailed below)
On chain, this will pbly just be the program , and the components will be all the accounts that it controls

```rust
pub struct Pool<'a> {
    token_x: PoolToken<'a>,
    token_y: PoolToken<'a>,
    tick_spacing: u32,
    global_state: GlobalState,
    active_ticks: BTreeMap<u32, TickState>, // keep ordered
    positions: HashMap<PositionKey<'a>, PositionState>,
    x: f64,
    y: f64,
    x_adj: f64,
    y_adj: f64,
    x_fee: f64,
    y_fee: f64,
    c: f64,
    fee_rate: f64,
}

```

## Components / State to be stored on chain

### Global state : current state of the pool. One per pool

```rust
pub struct GlobalState {
    /// contract global state
    liq: f64, // liquidity
    rp: f64,   // sqrt price
    tick: u32, // current tick
    fg_x: f64, // fee growth global
    fg_y: f64, // fee growth global
    hg_x: f64, // fee growth global
    hg_y: f64, // fee growth global
}
```

- the global state determing the liquidity that is currently in range (==> the reserves available for swaps ) as well as the current price level ( the sqrt of the price to be precise), and the corresponding 'tick'. 
- it also keeps tracks on the total fees earned globally by the pools

### Tick State: One per active tick

```rust
pub struct TickState {
    ///Tick Indexed State
    liq_net: f64, // LiquidityNet
    liq_gross: f64, // LiquidityGross
    f0_x: f64,      // feegrowth outside
    f0_y: f64,      // feegrowth outside
    h0_x: f64,      // hmm adj-fee growth outside
    h0_y: f64,      // hmm adj-fee growth outside
}
```

- A tick represent a price level that is used as one edge of an interval (or range) by at least one user. The user provide liquidity only in that range or interval ( say ETHUSD between 3000 and 4000), ie the tokens he provides are only used in swaps when the price is within that range.  

- The pool/program needs to keep track of all those 'initialized' ticks. In order. As swaps occurs and price move , tick are 'crossed' ===> liquidity from different users /positions/ ranges gets 'kickeed-in and kicked out of the global current liquidity.  

- Also plays a crucial part in the book-keeping for fees. an LP earns fees only on swaps that occurs within the intervall where he provides liquidity

- the pool defines beforehand the tick-spacing, which determines which price level are eligible to be ticks. Most granular possible is every 1 basis point (0.01%), although in practice it is sth like every, 0.05% 0.30% or 0.60% or even every 1% , 2% depending how volatile the pair is.  

### Position State: one per user (LP) per range (pair of ticks)

```rust
pub struct PositionState {
    ///Position Indexed State
    liq: f64, // liquidity
    fr_x: f64, // feegrowth inside last
    fr_y: f64, // feegrowth inside last
    hr_x: f64, // hmm adj-fee growth inside last
    hr_y: f64, // hmm adj-fee growth inside last
}

pub struct PositionKey<'a>(&'a str, u32, u32);
```

- one user can have a many positions in one pool

- position are uniquely defined by the tuple ( user, lower tick, upper tick). 'user' will pbl be the PubKey of user

- for the fee-related accounting, it keeps the fee level earned ( and paid) by the particular position the last time this position was touched, that is the last time a deposit/ withdrawal happenned by the same user, with the same lower and upper bounds.

## Which states are read or written to and when

- At a high level, at any given instant (instruction), either the global price level or the global liquidity in range changes , not both. the fact the model keeps track on the root-price but not price, that it keeps track of ticks etc , all this is to ensure this 'orthogonality' principle. (caveats below)

- price only moves when swap occurs

- global current liquidity level changes users deposits or withdraw with a range that includes the current price. e.g SOL is at 100 and user deposits to / withdraws from postion (user, 80,150)

- if during a swap, the price needs to go beyond the closed tick above or below the current price in order to have enough liquidity to fill the swap order, swapping is 'paused' at that tick, and the tick is 'crossed' before swapping resumes.

- the crossing of a tick:
  - updates the liquidity in-range by kicking in and out the liquidity that come in range or goes out of range at that price-level. this is why the TickState keeps track on the 'liquidity delta' (positive or negative depending on the direction of travel)  ==> **GlobalState written to, Liquidity changes**
  - updates in the TickState a snapshot of the global fees earned so far ===> **that particular TickState written to**

- after crossing, the swap resumes in the next interval, with liquidity constant and only price moves ( and reserves X and Y )

- 'swap_within_two_ticks' is the step of a Swap transaction that occurs in the current range (e.g SOL is at 100, the swapper is buying SOL, so giving USD to the pool and next active tick level up is 120 - in this case swap_within happens between 100 and 120 where, if the whole quantity is not filled, 120 is crossed)

- so during a swap_within_two_ticks, only global price and tick, global fees (but not global liquidty) are updated. The level of the next tick is also need (read-only) to calculate the amounts of tokens exchanged

- one swap transaction is a sequence of potentially many swap_within -> tick_crossing -> swap_within -> tick_crossing -> swap_within -> tick_crossing -> swap_within etc until the whole size is filled OR liquidity runs out in that direction

## Main design issue to solve

- WE CANNOT KNOW IN ADVANCE HOW MANY TICKS WILL BE CROSSED IN ADVANCE. It depends the distribution of liquidity and ticks at that moment. ===> while loop

- assuming swap_within and tick_crossing are instructions, we do not know in advance, how many instructions will be contained in the transaction, the exact list of all (TickState)s that will be read or updated.
