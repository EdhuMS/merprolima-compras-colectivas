import { z } from "zod";
export const interviewSchema = z.object({id:z.string(),date:z.string(),products:z.string(),routine:z.string(),receipt:z.string(),difficulties:z.string(),willingness:z.string(),nextQty:z.number().int().positive(),days:z.number().int().positive(),status:z.string()});
export const interviewsSchema=z.array(interviewSchema);
export type Interview=z.infer<typeof interviewSchema>;
