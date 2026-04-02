const APIFY_BASE = "https://api.apify.com/v2";

export async function runApifyActor<TInput>(
  actorId: string,
  input: TInput,
  timeoutSecs = 300
): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN environment variable is not set");
  }

  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?timeout=${timeoutSecs}&token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Apify actor ${actorId} failed (${res.status}): ${body}`
    );
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
