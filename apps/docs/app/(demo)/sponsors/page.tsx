import { cn } from "@/utils/cn";
import { Octokit } from "@octokit/rest";

interface Sponsor {
	login: string;
	avatarUrl: string;
	name: string;
	tier: {
		monthlyPriceInDollars: number;
		name?: string;
	};
}

const tiers = [
	{
		name: "Golden Sponsor",
		min: 225,
	},
	{
		name: "Sliver Sponsor",
		min: 128,
	},
];

export const revalidate = 60 * 30;

async function getSponsors(): Promise<Sponsor[]> {
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
        user(login: "fuma-nama") {
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

export default async function Page() {
	const data = await getSponsors();

	return (
		<>
			<h1 className="text-xl font-medium mb-2">Sponsors</h1>
			<p className="text-muted-foreground mb-4">
				Support the open source work of Fuma Comment.
			</p>
			<a
				href="https://github.com/sponsors/fuma-nama"
				rel="noreferrer noopener"
				target="_blank"
				className="inline-flex w-fit rounded-lg bg-primary text-primary-foreground font-medium text-sm px-2 py-1.5 mb-6 transition-colors hover:bg-primary/80"
			>
				Become a Sponsor
			</a>
			<div className="grid grid-cols-2 divide-border divide-x divide-y border-t border-l md:grid-cols-3">
				{data.map((sponsor) => (
					<a
						key={sponsor.login}
						href={`https://github.com/${sponsor.login}`}
						rel="noreferrer noopener"
						target="_blank"
						className="block text-sm p-4 hover:text-accent-foreground hover:bg-accent"
					>
						<p className="font-medium">{sponsor.name}</p>
						<p className="text-xs text-muted-foreground empty:hidden">
							{sponsor.tier.name}
						</p>
					</a>
				))}
			</div>
		</>
	);
}
