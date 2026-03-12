import { z } from 'zod';

export const analysisParamsSchema = z.object({
  data_dii: z.string().optional(),
  is_acidente: z.boolean().optional(),
  data_obito: z.string().optional(),
  data_casamento: z.string().optional(),
  idade_conjuge_obito: z.number().min(0).optional(),
  tempo_rural_anos: z.number().min(0).default(15),
  tempo_urbano_anos: z.number().min(0).default(0),
});

export type AnalysisParams = z.infer<typeof analysisParamsSchema>;