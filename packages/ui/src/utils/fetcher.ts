export async function fetcher<T = void>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(await response.text());

  return (await response.json()) as T;
}
