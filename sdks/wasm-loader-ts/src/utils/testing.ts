export async function expectError(handler: () => Promise<any>): Promise<Error> {
  const errs = [];
  try {
    await handler();
  } catch (err: any) {
    errs.push(new Error(err));
  }
  const [err] = errs;
  if (!err)
    throw new Error(
      "Expected error from async function but did not receive one."
    );
  return err;
}
