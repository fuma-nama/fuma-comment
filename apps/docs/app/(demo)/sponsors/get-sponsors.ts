import { Octokit } from "@octokit/rest";

export interface Sponsor {
  login: string;
  avatarUrl: string;
  name: string;
  tier: {
    monthlyPriceInDollars: number;
    name?: string;
  };
}

export const receiver = "fuma-nama";

export const tiers = [
  {
    name: "Golden Sponsor",
    min: 225,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    name: "Sliver Sponsor",
    min: 128,
    color: "bg-gray-100 text-gray-800",
  },
];

export const revalidate = 60 * 30;

export async function getSponsors(): Promise<Sponsor[]> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    const response = await octokit.graphql<{
      user: {
        sponsorshipsAsMaintainer: {
          nodes: Array<{
            sponsorEntity: {
              login: string;
              avatarUrl: string;
              name: string;
            };
            tier: {
              monthlyPriceInDollars: number;
              name: string;
            };
          }>;
        };
      };
    }>(`
      query {
        user(login: ${JSON.stringify(receiver)}) {
          sponsorshipsAsMaintainer(first: 100) {
            nodes {
              sponsorEntity {
                ... on User {
                    login
                    avatarUrl
                    name
                }
                ... on Organization {
                    login
                    avatarUrl
                    name
                }
              }
              tier {
                monthlyPriceInDollars
                name
              }
            }
          }
        }
      }
    `);

    const sponsors = response.user.sponsorshipsAsMaintainer.nodes.map(
      (node) => ({
        login: node.sponsorEntity.login,
        avatarUrl: node.sponsorEntity.avatarUrl,
        name: node.sponsorEntity.name || node.sponsorEntity.login,
        tier: {
          monthlyPriceInDollars: node.tier.monthlyPriceInDollars,
          name: tiers.find(
            (tier) => node.tier.monthlyPriceInDollars >= tier.min,
          )?.name,
        },
      }),
    );

    // Sort sponsors by tier price in descending order
    return sponsors.sort(
      (a, b) => b.tier.monthlyPriceInDollars - a.tier.monthlyPriceInDollars,
    );
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    throw error;
  }
}
