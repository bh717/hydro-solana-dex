/// [SwapCalculator] scale of the various input amounts/fees/prices
#[derive(Default, Builder, Debug, Clone)]
#[builder(setter(into))]
pub struct SwapCalculatorScale {
    pub x: u8,
    pub y: u8,
}
