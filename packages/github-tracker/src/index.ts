import dotenv from "dotenv";
import { Octokit } from "@octokit/rest";

dotenv.config();

const githubOrgs = ["ethereum"];

const octokitClient = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

async function main() {
  const reposList = await getRepositoriesList();

  const users = await getContributorsList("ethereum", reposList);

  console.log(users.length);
  console.log(users);
}

async function getRepositoriesList() {
  const reposList: string[] = [];

  for (const org of githubOrgs) {
    const repos = await octokitClient.paginate(
      octokitClient.repos.listForOrg,
      {
        org,
        per_page: 100,
      },
      (response) => response.data.map((r) => r.name)
    );

    reposList.push(...repos);
  }

  return reposList;
}

async function getContributorsList(org: string, repos: string[]) {
  const users: number[] = [];

  for (const repo of repos) {
    const repoContributors = await octokitClient.paginate(
      "GET /repos/{owner}/{repo}/contributors",
      {
        owner: org,
        repo: repo,
        per_page: 100,
      },
      (response) => response.data.map((c) => c.id)
    );

    const filteredContributors = repoContributors.filter(
      (c) => c !== undefined
    ) as number[];

    users.push(...filteredContributors);
  }

  return users;
}

main();
