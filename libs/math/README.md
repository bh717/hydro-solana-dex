# libs

![](hyrda-math.png)

Libraries to handle math calculations for the hydraswap programs. Currently implemented libraries in [hmm](./hmm)

The code from these libs form the basis for blockchain programs used by hydraswap.

    $ cargo build
    $ cargo test

We run three types of tests:

- unit tests
- property tests (using a simulation with python to test ranged values)
- benchmarks (using criterion)

## Benchmarks

We benchmark high compute functions such as the integer square root.

    $ cargo bench

After running benchmarks, check your local `target/criterion/report/index.html` for analysis.

![](hmm/benches/integer_sqrt.png)

### Documentation

Code is fully documented:

    $ cargo doc --document-private-items --open

