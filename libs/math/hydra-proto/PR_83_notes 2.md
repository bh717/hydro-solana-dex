
# Notes from PR_83 proto/rust-precise-ln


Some notes:

- using PreciseNumber makes it very verbose and difficult to read...

- however, along with some bug fixes, it helps getting rid of some manual (conservative) adjustments that were necessary in float-world to avoid numerical noise. In the end, it is more robust/precise than float.
- adjustment /rounding down at withdrawal is still necessary at this point
- keeping an consistent order of calculation across functions is crucial to avoid numerical errors and failures in round-trips (e.g. deposit then withdrawal)  

Some improvements:

- Liq and Swp custom 'classes' can probably be merged into one Spn (SignedPreciseNumber) that we could use ubiquitously
- implementing std::ops::Add / Mul / Sub/Div traits for that custom class, drawing from signed_addition(), signed_mul() and flip_sign() would make the code much less verbose, much more straighforward to read, less error-prone.
- improve rp_to_tick_loop() with binary search and/or better start point (in places where still starting from 0)  

Happy to discuss when u r available.