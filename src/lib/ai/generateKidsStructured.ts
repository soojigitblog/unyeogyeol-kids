import type { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { getKidsOpenAIClient } from "@/lib/ai/kidsOpenAiClient";
import { getKidsAiMaxRetries, getKidsAiModel } from "@/lib/ai/kidsAiConfig";
import { KidsAiError } from "@/lib/ai/kidsAiErrors";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapOpenAiError(error: unknown): KidsAiError {
  if (error instanceof KidsAiError) return error;

  const anyErr = error as {
    status?: number;
    message?: string;
    error?: { message?: string };
  };
  const status = anyErr.status;
  const message = anyErr.error?.message || anyErr.message || "OpenAI request failed";

  if (status === 429) {
    return new KidsAiError("OPENAI_RATE_LIMIT", message, { retryable: true, cause: error });
  }
  if (status && status >= 500) {
    return new KidsAiError("OPENAI_SERVER_ERROR", message, { retryable: true, cause: error });
  }
  if (status === 400 || status === 404) {
    return new KidsAiError("OPENAI_BAD_REQUEST", message, { retryable: false, cause: error });
  }
  if (/timeout|timed out|ETIMEDOUT|AbortError|connection error|fetch failed|ECONNRESET|ECONNREFUSED/i.test(message)) {
    return new KidsAiError("OPENAI_TIMEOUT", message, { retryable: true, cause: error });
  }
  return new KidsAiError("UNKNOWN", message, { retryable: false, cause: error });
}

export async function generateKidsStructured<T extends z.ZodType>(input: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
  maxOutputTokens?: number;
}): Promise<z.infer<T>> {
  const client = getKidsOpenAIClient();
  const model = getKidsAiModel();
  const maxRetries = getKidsAiMaxRetries();
  let attempt = 0;
  let lastError: KidsAiError | null = null;

  while (attempt <= maxRetries) {
    try {
      const response = await client.responses.parse({
        model,
        input: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
        text: { format: zodTextFormat(input.schema, input.schemaName) },
        ...(input.maxOutputTokens ? { max_output_tokens: input.maxOutputTokens } : {}),
      });

      const parsed = response.output_parsed;
      if (parsed == null) {
        throw new KidsAiError("STRUCTURED_PARSE_FAILED", "Structured output missing output_parsed", {
          retryable: false,
        });
      }
      return parsed as z.infer<T>;
    } catch (error) {
      const mapped = mapOpenAiError(error);
      lastError = mapped;
      if (!mapped.retryable || attempt >= maxRetries) {
        throw mapped;
      }
      await sleep(Math.min(500 * 2 ** attempt, 4000));
      attempt += 1;
    }
  }

  throw lastError ?? new KidsAiError("UNKNOWN", "generateKidsStructured failed", { retryable: false });
}
