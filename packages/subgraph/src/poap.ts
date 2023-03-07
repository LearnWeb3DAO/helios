import { BigInt } from "@graphprotocol/graph-ts";
import {
  EventToken as EventTokenEvent,
  Transfer as TransferEvent,
} from "../generated/POAP/POAP";
import { Account, POAPEvent, POAPToken } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleEventToken(ev: EventTokenEvent): void {
  // This handler will always run after handleTransfer, so we assume POAPToken is set up

  let event = POAPEvent.load(ev.params.eventId.toString());
  let token = POAPToken.load(ev.params.tokenId.toString());

  if (event == null) {
    event = new POAPEvent(ev.params.eventId.toString());
    event.tokenCount = BigInt.zero();
    event.tokenMints = BigInt.zero();
    event.transferCount = BigInt.zero();
    event.created = ev.block.timestamp;
  }

  event.tokenCount.plus(BigInt.fromI32(1));
  event.tokenMints.plus(BigInt.fromI32(1));
  event.transferCount.plus(BigInt.fromI32(1));

  token.event = event.id;
  token.mintOrder = event.tokenMints;

  event.save();
  token.save();
}

export function handleTransfer(ev: TransferEvent): void {
  let token = POAPToken.load(ev.params.tokenId.toString());
  let from = Account.load(ev.params.from.toHex());
  let to = Account.load(ev.params.to.toHex());

  if (from == null) {
    from = new Account(ev.params.from.toHex());
    // The from account at least has to own one token
    from.tokensOwned = BigInt.fromI32(1);
  }
  // Don't subtracts from the ZERO_ADDRESS (it's the one that mint the token)
  // Avoid negative values
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
    token = new POAPToken(ev.params.tokenId.toString());
    token.transferCount = BigInt.fromI32(0);
    token.created = ev.block.timestamp;
  }
  token.owner = to.id;
  token.transferCount.plus(BigInt.fromI32(1));
  token.save();

  let event = POAPEvent.load(token.event);

  if (event != null) {
    // Add one transfer
    event.transferCount.plus(BigInt.fromI32(1));

    // Burning the token
    if (to.id == ZERO_ADDRESS) {
      event.tokenCount.minus(BigInt.fromI32(1));
      // Subtract all the transfers from the burned token
      event.transferCount.minus(token.transferCount);
    }
    event.save();
  }
}
