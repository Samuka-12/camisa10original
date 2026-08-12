import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendMetaConversionEvent, type MetaConversionInput, type MetaConversionResponse } from "./meta-capi.server";

export const sendMetaConversion = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        eventName: z.string().min(1),
        eventTime: z.number().int().optional(),
        value: z.number().optional(),
        currency: z.string().optional(),
        contentIds: z.array(z.string()).optional(),
        contentName: z.string().optional(),
        contentType: z.string().optional(),
        eventSourceUrl: z.string().optional(),
        eventId: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<MetaConversionResponse> => {
    return sendMetaConversionEvent(data as MetaConversionInput);
  });
