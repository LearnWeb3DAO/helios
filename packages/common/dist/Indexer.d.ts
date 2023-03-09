import { Logger } from "winston";
export interface IndexerOpts {
    serviceName: string;
    logger: Logger;
}
export declare abstract class Indexer {
    private name;
    private logger;
    constructor(opts: IndexerOpts);
    run(): Promise<void>;
}
