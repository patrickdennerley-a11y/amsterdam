const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";
const VOYAGE_DIMENSIONS = 512;

interface VoyageEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY environment variable is not set");
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: text,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage AI error: ${response.status} - ${error}`);
  }

  const data: VoyageEmbeddingResponse = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error("No embedding returned from Voyage AI");
  }

  const embedding = data.data[0].embedding;

  // Validate dimensions
  if (embedding.length !== VOYAGE_DIMENSIONS) {
    throw new Error(
      `Expected ${VOYAGE_DIMENSIONS} dimensions, got ${embedding.length}`
    );
  }

  return embedding;
}

export async function generateProfileEmbedding(
  name: string,
  major: string,
  bio: string
): Promise<number[]> {
  const text = `Name: ${name}. Major: ${major}. Bio: ${bio}`;
  return generateEmbedding(text);
}

export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY environment variable is not set");
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage AI error: ${response.status} - ${error}`);
  }

  const data: VoyageEmbeddingResponse = await response.json();

  return data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
}

export { VOYAGE_DIMENSIONS };
