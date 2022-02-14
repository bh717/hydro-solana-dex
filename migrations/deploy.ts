// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";

export default async function (provider: anchor.Provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.

  console.log("hello World");
}
