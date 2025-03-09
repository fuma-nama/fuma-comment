import { Demo } from "./page.client";

export default async function Home() {
	return (
		<div className="flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<Demo />
		</div>
	);
}
