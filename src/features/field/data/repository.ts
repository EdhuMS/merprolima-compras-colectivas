import { requireSupabase } from "../../../infrastructure/supabase/client";
import { interviewsSchema } from "./interviews";
export async function readFieldInterviews(){const {data,error}=await requireSupabase().from("field_interviews").select("payload").order("code");if(error)throw error;return interviewsSchema.parse(data.map(row=>row.payload));}
