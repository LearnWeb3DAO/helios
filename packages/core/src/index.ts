import dotenv from "dotenv";
import NewLogger from "logger";
import { GithubIndexer } from "github-tracker";
import { writeFileSync } from "fs";

dotenv.config();

async function main() {
  // Configure Logger
  const logger = NewLogger(
    process.env.TELEGRAM_BOT_TOKEN as string,
    Number(process.env.TELEGRAM_CHAT_ID as string)
  );

  // Configure Indexers
  const githubIndexer = new GithubIndexer({
    serviceName: "github",
    logger: logger,
    githubAccessToken: process.env.GITHUB_ACCESS_TOKEN as string,
    orgs: ["LearnWeb3DAO"],
    xpPerContribution: 10,
  });

  const indexers = [githubIndexer];

  for (const indexer of indexers) {
    try {
      const heliosData = await indexer.run();
      writeFileSync(
        `${indexer.getName()}.json`,
        JSON.stringify(heliosData, null, 2)
      );
    } catch (error) {
      logger.error(`Indexer had an unexpected error`, {
        service: indexer.getName(),
        error: error,
      });
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
