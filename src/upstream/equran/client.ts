import { eQuranDuaListResponseSchema } from "./schema.js";
import type { EQuranDuaListResponse } from "./schema.js";

const EQURAN_DOA_URL = "https://equran.id/api/doa";

export type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type FetchLike = (url: string) => Promise<FetchResponse>;

export async function fetchEQuranDuaList(fetcher: FetchLike = fetch): Promise<EQuranDuaListResponse> {
  const response = await fetcher(EQURAN_DOA_URL);
  if (!response.ok) {
    throw new Error(`eQuran doa request failed with status ${response.status}.`);
  }

  return eQuranDuaListResponseSchema.parse(await response.json());
}

export { EQURAN_DOA_URL };
