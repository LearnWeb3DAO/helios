import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/DeveloperDAO/DeveloperDAO";
import { Account, BuildspaceToken } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleTransfer(ev: TransferEvent): void {
  let token = BuildspaceToken.load(ev.params.tokenId.toString());
  let from = Account.load(ev.params.from.toHex());
  let to = Account.load(ev.params.to.toHex());

  if (from == null) {
    from = new Account(ev.params.from.toHex());
    // This account has at least 1 token (being currently transferred)
    from.tokensOwned = BigInt.fromI32(1);
  }

  // Don't subtract tokenCount from zero address
  if (from.id != ZERO_ADDRESS) {
    from.tokensOwned.minus(BigInt.fromI32(1));
  }
  from.save();

  if (to == null) {
    to = new Account(ev.params.to.toHex());
    to.tokensOwned = BigInt.zero();
  }
  to.tokensOwned.plus(BigInt.fromI32(1));
  to.save();

  if (token == null) {
    token = new BuildspaceToken(ev.params.tokenId.toString());
    token.transferCount = BigInt.zero();
    token.created = ev.block.timestamp;
  }
  token.owner = to.id;
  token.transferCount.plus(BigInt.fromI32(1));
  token.save();
}
