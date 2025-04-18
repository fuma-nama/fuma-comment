import { getSponsors } from './get-sponsors';
import Image from 'next/image';

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Our Sponsors</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        We are incredibly grateful to our sponsors who help support our open-source work.
        Their contributions enable us to continue building and maintaining our projects.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sponsors.map((sponsor) => (
          <div
            key={sponsor.login}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={sponsor.avatarUrl}
                  alt={sponsor.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{sponsor.name}</h3>
                <a
                  href={`https://github.com/${sponsor.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600"
                >
                  @{sponsor.login}
                </a>
              </div>
            </div>
            <div className="mt-4">
              <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {sponsor.tier.name}
              </div>
              <p className="text-gray-600 mt-2">
                ${sponsor.tier.monthlyPriceInDollars}/month
              </p>
            </div>
          </div>
        ))}
      </div>

      {sponsors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No sponsors yet. Be the first to support us!</p>
        </div>
      )}
    </div>
  );
} 