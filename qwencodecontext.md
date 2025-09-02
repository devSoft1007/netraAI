/**********************************************************************
 *  POST /functions/v1/store-analysis
 **********************************************************************/
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  /* ─── CORS / verb guard ─── */
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", {
    status: 405,
    headers: cors
  });

  /* ─── init Supabase ─── */
  const sb = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  /* ─── auth ─── */
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return err("Missing bearer token", "AUTH");

  const { data: { user }, error: authErr } = await sb.auth.getUser(jwt);
  if (authErr || !user) return err("Invalid token", "AUTH");

  /* ─── get user's clinic ─── */
  const [{ data: doc }, { data: staff }] = await Promise.all([
    sb.from("doctors").select("clinic_id").eq("auth_id", user.id).maybeSingle(),
    sb.from("staff").select("clinic_id").eq("auth_id", user.id).maybeSingle()
  ]);

  const clinicId = doc?.clinic_id ?? staff?.clinic_id;
  if (!clinicId) return err("User not linked to a clinic", "IDENTITY");

  /* ─── parse request body ─── */
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return err("Invalid JSON body", "VALIDATION");
  }

  const { aiResponse, imageUrl } = body;
  if (!aiResponse || !imageUrl) {
    return err("Missing aiResponse or imageUrl", "VALIDATION");
  }

  /* ─── map AI response to database fields ─── */
  function mapSeverityToRisk(severity) {
    const riskMap = { 0: 'low', 1: 'low', 2: 'moderate', 3: 'moderate', 4: 'high' };
    return riskMap[severity] || 'unknown';
  }

  const dbRecord = {
    clinic_id: clinicId,
    patient_id: null, // Anonymous analysis
    analyzed_by: staff?.id || null, // If analyzed by staff
    image_url: imageUrl,
    image_metadata: aiResponse.meta || {},
    
    // DR fields
    dr_prediction: aiResponse.diabetic_retinopathy?.prediction,
    dr_confidence: aiResponse.diabetic_retinopathy?.confidence,
    dr_probability: aiResponse.diabetic_retinopathy?.probabilities || {},
    
    // Glaucoma fields
    glaucoma_prediction: aiResponse.glaucoma?.prediction,
    glaucoma_confidence: aiResponse.glaucoma?.confidence,
    glaucoma_probability: aiResponse.glaucoma?.probabilities?.Glaucoma || null,
    
    // Risk assessment
    risk_level: mapSeverityToRisk(aiResponse.diabetic_retinopathy?.severity_level),
    
    // Clinical notes
    clinical_notes: `DR: ${aiResponse.diabetic_retinopathy?.doctor_note || 'No note'}\nGlaucoma: ${aiResponse.glaucoma?.doctor_note || 'No note'}`,
    
    status: 'completed'
  };

  /* ─── insert analysis result ─── */
  const { data: analysisResult, error: insertErr } = await sb
    .from("ai_analysis_results")
    .insert(dbRecord)
    .select()
    .single();

  if (insertErr) {
    return err(`Failed to store analysis: ${insertErr.message}`, "INSERT_FAIL");
  }

  return new Response(JSON.stringify({
    success: true,
    analysis_id: analysisResult.id,
    message: "Analysis stored successfully"
  }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      ...cors
    }
  });
});

/* helper */
function err(msg, ctx, code = 400) {
  return new Response(JSON.stringify({
    error: msg,
    context: ctx
  }), {
    status: code,
    headers: {
      "Content-Type": "application/json",
      ...cors
    }
  });
}



// Request Body Format:
{
  "aiResponse": {
    "diabetic_retinopathy": {
      "prediction": "Proliferative DR",
      "confidence": 0.996,
      "probabilities": { "No DR": 0, "Proliferative DR": 0.996 },
      "severity_level": 4,
      "doctor_note": "Immediate treatment advised"
    },
    "glaucoma": {
      "prediction": "Normal", 
      "confidence": 0.5,
      "probabilities": { "Normal": 0.5, "Glaucoma": 0.5 },
      "doctor_note": "No signs of glaucoma"
    },
    "meta": { "request_id": "05d905ff", "model_version": "v1" }
  },
  "imageUrl": "https://storage.url/image.jpg"
}
