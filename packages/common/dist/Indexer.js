"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Indexer = void 0;
class Indexer {
    constructor(opts) {
        this.logger = opts.logger;
        this.name = opts.serviceName;
        this.logger.info(`${this.name} indexer started`);
    }
    async run() { }
}
exports.Indexer = Indexer;
//# sourceMappingURL=Indexer.js.map