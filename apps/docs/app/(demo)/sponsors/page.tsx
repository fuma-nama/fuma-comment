import { cn } from "@/utils/cn";
import Image from "next/image";
import { getSponsors, receiver, tiers } from "./get-sponsors";

export const revalidate = 60 * 30;

export default async function Page() {
	const data = await getSponsors();

	return (
		<>
			<div className="text-center mb-8">
				<h1 className="text-xl font-semibold mb-2">Sponsors</h1>
				<p className="text-muted-foreground mb-6">
					Support the open source work of Fuma Comment.
				</p>
				<a
					href={`https://github.com/sponsors/${receiver}`}
					rel="noreferrer noopener"
					target="_blank"
					className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-medium px-4 py-2 text-sm transition-colors hover:bg-primary/90"
				>
					Become a Sponsor
				</a>
			</div>

			{data.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
					{data.map((sponsor) => (
						<a
							key={sponsor.login}
							href={`https://github.com/${sponsor.login}`}
							rel="noreferrer noopener"
							target="_blank"
							className="block rounded-lg border p-4 hover:bg-accent/50 transition-colors shadow-md"
						>
							<div className="flex items-center gap-2 mb-4">
								<Image
									className="size-8 rounded-full"
									src={sponsor.avatarUrl}
									width={48}
									height={48}
									alt={sponsor.name}
									unoptimized
								/>
								<div>
									<p className="text-sm font-medium group-hover:text-primary">
										{sponsor.name}
									</p>
									<p className="text-xs text-muted-foreground">
										@{sponsor.login}
									</p>
								</div>
							</div>
							{sponsor.tier.name && (
								<div
									className={cn(
										"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
										tiers.find((t) => t.name === sponsor.tier.name)?.color,
									)}
								>
									{sponsor.tier.name}
								</div>
							)}
						</a>
					))}
				</div>
			) : (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						No sponsors yet. Be the first to support us!
					</p>
				</div>
			)}
		</>
	);
}
