import { Logger } from "winston";
export interface IndexerOpts {
    serviceName: string;
    logger: Logger;
}
export type HeliosData = {
    service: string;
    contributor_id: string;
    contribution_uri: string;
    xp: number;
};
export declare abstract class Indexer {
    protected name: string;
    protected logger: Logger;
    constructor(opts: IndexerOpts);
    getName(): string;
    abstract run(): Promise<HeliosData[]>;
}
