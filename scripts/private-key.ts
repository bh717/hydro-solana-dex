import bs58 from "bs58";
import arg from "arg";
import fs from "fs";

const args = arg({});

async function main() {
  const [filepath] = args._;
  if (!filepath) {
    throw new Error("filepath not provided");
  }

  if (!fs.existsSync(filepath)) {
    throw new Error("could not find file");
  }

  const sk = JSON.parse(fs.readFileSync(filepath).toString());

  console.log(bs58.encode(sk));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
