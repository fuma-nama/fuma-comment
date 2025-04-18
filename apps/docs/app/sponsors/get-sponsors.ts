import { Octokit } from '@octokit/rest';

interface Sponsor {
  login: string;
  avatarUrl: string;
  name: string;
  tier: {
    monthlyPriceInDollars: number;
    name: string;
  };
}

export async function getSponsors(): Promise<Sponsor[]> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    const response = await octokit.graphql<{
      user: {
        sponsorshipsAsMaintainer: {
          nodes: Array<{
            sponsor: {
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
        user(login: "your-github-username") {
          sponsorshipsAsMaintainer(first: 100) {
            nodes {
              sponsor {
                login
                avatarUrl
                name
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

    const sponsors = response.user.sponsorshipsAsMaintainer.nodes.map((node) => ({
      login: node.sponsor.login,
      avatarUrl: node.sponsor.avatarUrl,
      name: node.sponsor.name || node.sponsor.login,
      tier: {
        monthlyPriceInDollars: node.tier.monthlyPriceInDollars,
        name: node.tier.name,
      },
    }));

    // Sort sponsors by tier price in descending order
    return sponsors.sort((a, b) => b.tier.monthlyPriceInDollars - a.tier.monthlyPriceInDollars);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw error;
  }
} 