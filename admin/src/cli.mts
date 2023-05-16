import { Command } from "commander";
import Client from "./client.mts";
import * as commands from "./commands.mts";
import * as methods from "./methods.mts";
import * as validators from "./validators.mts";
import readSignerKeypair from "./utils/read-signer-keypair.mts";
import resolveWalletPath from "./utils/resolve-wallet-path.mjs";
import { readJSON } from "./utils/read-file-content.mts";
import { populateSigners, prettifyJSON } from "./utils/index.mts";

const VERSION = "0.1.0";

function handler(command: any, parser: any = prettifyJSON) {
  return async (...args: any[]) => {
    const res = await command(...args);
    const out = parser ? await parser(res) : res;

    console.log(out); // show the result via `console`
  };
}

let cli = new Command()
  .name("twamm-admin")
  .description(
    `Welcome to twamm admin. Use the "help" command to get more information.`
  )
  .requiredOption("-k, --keypair <path>", "path to the payer's keypair")
  .option("-u, --url <string>", "cluster address; supports monikers", "devnet")
  .version(VERSION);

/**
 * Read the global options and fill the `ANCHOR_WALLET`
 * env variable with the path to the anchor wallet.
 */
cli.hook("preSubcommand", (cmd, subCmd) => {
  const { keypair } = cmd.optsWithGlobals();

  if (!keypair) return;

  const ANCHOR_WALLET = resolveWalletPath(keypair);

  Object.assign(process.env, { ANCHOR_WALLET });
});

cli
  .command("cancel-withdrawals")
  .description("")
  .action(handler(commands.cancel_withdrawals));

cli
  .command("delete-test-pair")
  .description("")
  .action(handler(commands.delete_test_pair));

cli
  .command("delete_test_pool")
  .description("")
  .action(handler(commands.delete_test_pool));

cli
  .command("get-outstanding-amount")
  .description("")
  .action(handler(commands.get_outstanding_amount));

cli
  .command("cancel-withdrawals")
  .description("")
  .action(handler(commands.cancel_withdrawals));

cli
  .command("init")
  .description("Initialize the on-chain program")
  .option("-m, --min-signatures <u8>", "Minimum number of signatures", "1")
  .argument("<pubkeys...>", "List of signer keys")
  .action(
    handler(
      (
        args: string[],
        opts: Parameters<typeof validators.init>[0],
        cli: Command
      ) => {
        const options: { minSignatures: number } = validators.init(opts);
        const pubkeys = populateSigners(args);
        const client = Client(cli.optsWithGlobals().url);

        return methods.init(client, { options, arguments: { pubkeys } });
      }
    )
  );

cli
  .command("init-token-pair")
  .description("Initialize token-pair")
  .argument("<a-mint-pubkey>", "Token A mint")
  .argument("<b-mint-pubkey>", "Token B mint")
  .argument("<path-to-token-pair-config>", "Path to token-pair config")
  .action(
    handler(
      async (
        a: string,
        b: string,
        configFile: string,
        _: never,
        cli: Command
      ) => {
        const { keypair } = cli.optsWithGlobals();

        const client = Client(cli.optsWithGlobals().url);
        const mints = populateSigners([a, b]);
        const signer = await readSignerKeypair(keypair);

        let tokenPairConfig = await readJSON(configFile);
        tokenPairConfig = await validators.struct.tokenPair(tokenPairConfig);
        return methods.initTokenPair(
          client,
          {
            options: tokenPairConfig,
            arguments: {
              a: mints[0],
              b: mints[1],
            },
          },
          signer
        );
      }
    )
  );

cli
  .command("list-multisig")
  .description("")
  .action(handler(commands.list_multisig));

cli
  .command("list-orders")
  .description("")
  .action(handler(commands.list_orders));

cli.command("list-pools").description("").action(handler(commands.list_pools));

cli
  .command("list-token-pairs")
  .description("List available token-pairs")
  .action(
    handler(async (opts: {}, cli: Command) => {
      const options = opts;
      const client = Client(cli.optsWithGlobals().url);

      return methods.listTokenPairs(client, { options, arguments: {} });
    })
  );

cli
  .command("set-admin-signers")
  .description("Set admins")
  .option("-m, --min-signatures <u8>", "Minimum number of signatures", "1")
  .argument("<pubkeys...>", "List of signer keys")
  .action(
    handler(
      async (
        args: string[],
        opts: Parameters<typeof validators.set_admin_signers>[0],
        cli: Command
      ) => {
        const { keypair, url } = cli.optsWithGlobals();

        const options: { minSignatures: number } =
          validators.set_admin_signers(opts);
        const pubkeys = populateSigners(args);
        const client = Client(url);
        const signer = await readSignerKeypair(keypair);

        return methods.setAdminSigners(
          client,
          {
            options,
            arguments: { pubkeys },
          },
          signer
        );
      }
    )
  );

cli
  .command("set_crank_authority")
  .description("")
  .action(handler(commands.set_crank_authority));

cli.command("set-fees").description("").action(handler(commands.set_fees));

cli.command("set-limits").description("").action(handler(commands.set_limits));

cli
  .command("set_oracle_config")
  .description("")
  .action(handler(commands.set_oracle_config));

cli
  .command("set-permissions")
  .description("")
  .action(handler(commands.set_permissions));

cli
  .command("set-test-oracle-price")
  .description("")
  .action(handler(commands.set_test_oracle_price));

cli
  .command("set-test-time")
  .description("")
  .action(handler(commands.set_test_time));

cli
  .command("set-time-in-force")
  .description("")
  .action(handler(commands.set_time_in_force));

cli.command("settle").description("").action(handler(commands.settle));

cli
  .command("withdraw-fees")
  .description("")
  .action(handler(commands.withdraw_fees));

cli.parse();
