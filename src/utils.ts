import { ethereum } from "@graphprotocol/graph-ts";

export function createEventId(event: ethereum.Event): string {
    return event.block.number.toString().concat('-').concat(event.logIndex.toString())
}