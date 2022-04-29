type Task<T> = () => Promise<T>;

export async function quitOnError<T>(task: Task<T>, msg: string = "") {
  try {
    return await task();
  } catch (err) {
    msg && console.log(msg);
    console.error(err);
    process.exit(1);
  }
}
