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

export abstract class Indexer {
  protected name: string;
  protected logger: Logger;

  constructor(opts: IndexerOpts) {
    this.logger = opts.logger;
    this.name = opts.serviceName;

    this.logger.info(`${this.name} indexer started`);
  }

  getName(): string {
    return this.name;
  }

  abstract run(): Promise<HeliosData[]>;
}
