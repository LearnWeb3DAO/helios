import { Octokit } from "@octokit/rest";
import chunk from "lodash/chunk";
import { HeliosData, Indexer, IndexerOpts } from "common";

type RepoContributor = {
  org: string;
  repo: string;
  contributor_id: number;
  num_contributions: number;
};

export interface GithubIndexerOpts extends IndexerOpts {
  githubAccessToken: string;
  orgs: string[];
  xpPerContribution: number;
}

export class GithubIndexer extends Indexer {
  private orgs: string[];
  private xpPerContribution: number;
  private octokitClient: Octokit;

  constructor(opts: GithubIndexerOpts) {
    super(opts);

    this.orgs = opts.orgs;
    this.xpPerContribution = opts.xpPerContribution;

    this.octokitClient = new Octokit({
      auth: opts.githubAccessToken,
    });
  }

  async run(): Promise<HeliosData[]> {
    this.logger.info(
      `Fetching repositories from ${this.orgs.length} organizations`,
      {
        service: this.name,
        func: "run",
      }
    );
    const repos = await this.getRepositoriesForOrgs();

    this.logger.info(`Fetching contributors from ${repos.size} repos`, {
      service: this.name,
      func: "run",
    });
    const contributors = await this.getContributorsForRepos(repos);

    this.logger.info(
      `Creating helios data from ${contributors.length} contributors`,
      {
        service: this.name,
        func: "run",
      }
    );
    const heliosData: HeliosData[] = contributors.map((c) => {
      return {
        service: this.name,
        contributor_id: c.contributor_id.toString(),
        contribution_uri: `https://github.com/${c.org}/${c.repo}`,
        xp: this.xpPerContribution * c.num_contributions,
      };
    });

    return heliosData;
  }

  async getRepositoriesForOrgs() {
    const orgChunks = chunk(this.orgs, 50);

    const reposList = new Map<string, string[]>();

    for (const chunk of orgChunks) {
      const fetchRepoPromises: Promise<void>[] = [];

      for (const org of chunk) {
        fetchRepoPromises.push(
          this.octokitClient
            .paginate(
              this.octokitClient.repos.listForOrg,
              {
                per_page: 100,
                org,
              },
              (response) => response.data.map((r) => r.name)
            )
            .then((repos) => {
              reposList.set(org, repos);
            })
            .catch((error) => {
              this.logger.error(error, {
                service: this.name,
                func: "getRepositoriesForOrgs",
                org: org,
              });
            })
        );
      }

      await Promise.all(fetchRepoPromises);
    }

    return reposList;
  }

  async getContributorsForRepos(reposList: Map<string, string[]>) {
    const orgs = Array.from(reposList.keys());

    const contributors: RepoContributor[] = [];

    for (const org of orgs) {
      const repoChunks = chunk(reposList.get(org), 50);

      for (const chunk of repoChunks) {
        const fetchContributorPromises: Promise<void>[] = [];

        for (const repo of chunk) {
          fetchContributorPromises.push(
            this.octokitClient
              .paginate(
                "GET /repos/{owner}/{repo}/contributors",
                { owner: org, repo: repo, per_page: 100 },
                (response) =>
                  response.data.map((c) => {
                    return {
                      id: c.id,
                      num_contributions: c.contributions,
                    };
                  })
              )
              .then((contributor_ids) => {
                for (const contributor of contributor_ids) {
                  if (!contributor || !contributor.id) continue;

                  contributors.push({
                    org,
                    repo,
                    contributor_id: contributor.id,
                    num_contributions: contributor.num_contributions,
                  });
                }
              })
              .catch((error) => {
                this.logger.error(error, {
                  service: this.name,
                  org: org,
                  func: "getContributorsForRepos",
                });
              })
          );
        }

        await Promise.all(fetchContributorPromises);
      }
    }

    return contributors;
  }
}
