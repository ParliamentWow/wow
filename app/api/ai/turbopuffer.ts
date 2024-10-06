import { InferSelectModel } from "drizzle-orm";
import { transcriptionDB } from "~/data/schema";
import { Env } from "~/server";
export async function query(env: Env, namespace: string, vector: number[]) {
  if (!env.TURBOPUFFER_KEY) {
    throw Error("TURBOPUFFER_KEY not found");
  }
  const pufResponse = await fetch(
    `https://api.turbopuffer.com/v1/vectors/${namespace}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TURBOPUFFER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vector,
        top_k: 4,
        include_attributes: true,
      }),
    }
  );

  if (!pufResponse.ok) {
    throw new Error(await pufResponse.text());
  }

  const res = (await pufResponse.json()) as {
    attributes: {
      page_content: string;
      metadata: string;
    };
  }[];
  return res.map((r) => ({
    page_content: r.attributes.page_content,
    ...(JSON.parse(r.attributes.metadata) as {
      sessionId: string;
    }),
  }));
}

export async function insertTranscription(
  env: Env,
  vector: number[],
  trascription: InferSelectModel<typeof transcriptionDB>
) {
  if (!env.TURBOPUFFER_KEY) {
    throw Error("TURBOPUFFER_KEY not found");
  }
  const pufResponse = await fetch(
    `https://api.turbopuffer.com/v1/vectors/${trascription.sessionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TURBOPUFFER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        upserts: [
          {
            id: trascription.id,
            vector,
            attributes: {
              page_content: trascription.content,
              metadata: JSON.stringify({
                ...trascription,
                content: undefined,
                metadata: "transcriptions",
              }),
            },
          },
        ],
        distance_metric: "cosine_distance",
        schema: {
          page_content: {
            type: "string",
            bm25: {
              language: "english",
              stemming: false,
              remove_stopwords: true,
              case_sensitive: false,
            },
          },
        },
      }),
    }
  );

  if (!pufResponse.ok) {
    throw new Error("Failed to insert into puffer");
  }

  const pufResponseD = await fetch(
    `https://api.turbopuffer.com/v1/vectors/trascription`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TURBOPUFFER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        upserts: [
          {
            id: trascription.id,
            vector,
            attributes: {
              page_content: trascription.content,
              metadata: JSON.stringify({
                ...trascription,
                content: undefined,
                metadata: "transcriptions",
              }),
            },
          },
        ],
        distance_metric: "cosine_distance",
        schema: {
          page_content: {
            type: "string",
            bm25: {
              language: "english",
              stemming: false,
              remove_stopwords: true,
              case_sensitive: false,
            },
          },
        },
      }),
    }
  );

  if (!pufResponseD.ok) {
    throw new Error("Failed to insert into puffer");
  }
}

export interface TPuffDocument {
  attributes: {
    page_content: string;
    metadata: string;
  };
}

export const getTranscriptionBySessionId = async (
  env: Env,
  sessionId: string,
  vector: number[]
) => {
  const pufResponse = await fetch(
    `https://api.turbopuffer.com/v1/vectors/${sessionId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TURBOPUFFER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vector,
        top_k: 10,
        include_attributes: true,
      }),
    }
  );

  if (!pufResponse.ok) {
    console.log(pufResponse.text());
    throw new Error("Failed to retrieve transcription from puffer");
  }

  return (await pufResponse.json()) as TPuffDocument[];
};

export const getBills = async (env: Env, vector: number[]) => {
  const pufResponse = await fetch(
    `https://api.turbopuffer.com/v1/vectors/bills/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TURBOPUFFER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vector,
        top_k: 10,
        include_attributes: true,
      }),
    }
  );

  if (!pufResponse.ok) {
    console.log(pufResponse.text());
    throw new Error("Failed to retrieve bills from puffer");
  }

  return (await pufResponse.json()) as TPuffDocument[];
};
