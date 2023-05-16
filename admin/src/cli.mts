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
  .requiredOption(
    "-k, --keypair <path>",
    "path to the payer's keypair; required"
  )
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
        const options = validators.init(opts);
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

        const options = validators.set_admin_signers(opts);
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
  .command("set-crank-authority")
  .description("Set `crank` authority")
  .requiredOption("-tp, --token-pair <pubkey>", "Token pair address; required")
  .argument("<pubkey>", "Crank authority pubkey")
  .action(
    handler(
      async (
        pubkey: string,
        opts: Parameters<typeof validators.set_crank_authority_opts>[0],
        cli: Command
      ) => {
        const { keypair, url } = cli.optsWithGlobals();

        const options = validators.set_crank_authority_opts(opts);
        const client = Client(url);
        const signer = await readSignerKeypair(keypair);

        const { crankAuthority } = validators.set_crank_authority({
          pubkey,
        });

        return methods.setCrankAuthority(
          client,
          {
            options,
            arguments: { crankAuthority },
          },
          signer
        );
      }
    )
  );

cli
  .command("set-fees")
  .description("Set fees")
  .requiredOption("-tp, --token-pair <pubkey>", "Token pair address; required")
  .argument("<fee-numerator-u64>", "Fee numerator")
  .argument("<fee-denominator-u64>", "Fee denominator")
  .argument("<settle-fee-numerator-u64>", "Settle fee numerator")
  .argument("<settle-fee-denominator-u64>", "Settle fee denominator")
  .argument("<crank-reward-token-a-u64>", "Crank reward for A")
  .argument("<crank-reward-token-b-u64>", "Crank reward for B")
  .action(
    handler(
      async (
        feeNumerator: string,
        feeDenominator: string,
        settleFeeNumerator: string,
        settleFeeDenominator: string,
        crankRewardTokenA: string,
        crankRewardTokenB: string,
        opts: Parameters<typeof validators.set_fees_opts>[0],
        cli: Command
      ) => {
        const { keypair, url } = cli.optsWithGlobals();

        const options = validators.set_fees_opts(opts);
        const client = Client(url);
        const signer = await readSignerKeypair(keypair);

        const params = validators.set_fees({
          feeNumerator,
          feeDenominator,
          settleFeeNumerator,
          settleFeeDenominator,
          crankRewardTokenA,
          crankRewardTokenB,
        });

        return methods.setFees(
          client,
          {
            options,
            arguments: params,
          },
          signer
        );
      }
    )
  );

cli.command("set-limits").description("").action(handler(commands.set_limits));

cli
  .command("set_oracle_config")
  .description("")
  .action(handler(commands.set_oracle_config));

cli
  .command("set-permissions")
  .description("Set permissions")
  .requiredOption("-tp, --token-pair <pubkey>", "Token pair address; required")
  .argument("<allow-deposits-bool>", "Allow deposits")
  .argument("<allow-withdrawals-bool>", "Allow withdrawals")
  .argument("<allow-cranks-bool>", "Allow cranks")
  .argument("<allow-settlements-bool>", "Allow settlements")
  .action(
    handler(
      async (
        allowDeposits: string,
        allowWithdrawals: string,
        allowCranks: string,
        allowSettlements: string,
        opts: Parameters<typeof validators.set_permissions_opts>[0],
        cli: Command
      ) => {
        const { keypair, url } = cli.optsWithGlobals();

        const options = validators.set_permissions_opts(opts);
        const client = Client(url);
        const signer = await readSignerKeypair(keypair);

        const params = validators.set_permissions({
          allowDeposits,
          allowWithdrawals,
          allowCranks,
          allowSettlements,
        });

        return methods.setPermissions(
          client,
          {
            options,
            arguments: params,
          },
          signer
        );
      }
    )
  );

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
  .description("Set time in force")
  .requiredOption("-tp, --token-pair <pubkey>", "Token pair address; required")
  .argument("<u8>", "Time in force index")
  .argument("<u32>", "New time in force")
  .action(
    handler(
      async (
        tifIndex: string,
        tif: string,
        opts: Parameters<typeof validators.set_time_in_force_opts>[0],
        cli: Command
      ) => {
        const { keypair, url } = cli.optsWithGlobals();
        const options = validators.set_time_in_force_opts(opts);
        const client = Client(url);
        const signer = await readSignerKeypair(keypair);

        const { timeInForceIndex, newTimeInForce } =
          validators.set_time_in_force({
            tifIndex,
            tif,
          });

        return methods.setTimeInForce(
          client,
          {
            options,
            arguments: {
              timeInForceIndex,
              newTimeInForce,
            },
          },
          signer
        );
      }
    )
  );

cli.command("settle").description("").action(handler(commands.settle));

cli
  .command("withdraw-fees")
  .description("")
  .action(handler(commands.withdraw_fees));

cli.parse();
