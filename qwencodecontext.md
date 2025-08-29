/*****************************************************************
 *  GET  /functions/v1/get-appointmentsOk 
 *  Query parameters
 *    start   ISO-8601 date or date-time  (required)
 *    end     ISO-8601 date or date-time  (required)
 *    view    month | week | day          (optional – for future use)
 *    status  comma-list (scheduled,confirmed,...) optional
 *    limit   10-500  (pagination safety – default 500 for a month view)
 *****************************************************************/ import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  if (req.method !== "GET") return new Response("Method Not Allowed", {
    status: 405,
    headers: cors
  });
  /* ---------- initialise supabase ---------- */ const sb = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  /* ---------- auth ---------- */ const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return jsonError("Missing bearer token", "AUTH");
  const { data: { user }, error: authErr } = await sb.auth.getUser(jwt);
  if (authErr || !user) return jsonError("Invalid token", "AUTH");
  /* ---------- who is the caller? (doctor or staff) ---------- */ const [{ data: doc }, { data: staff }] = await Promise.all([
    sb.from("doctors").select("id,clinic_id").eq("auth_id", user.id).maybeSingle(),
    sb.from("staff").select("id,clinic_id").eq("auth_id", user.id).maybeSingle()
  ]);
  const clinicId = doc?.clinic_id ?? staff?.clinic_id;
  if (!clinicId) return jsonError("User not linked to a clinic", "IDENTITY");
  /* ---------- read query params ---------- */ const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) return jsonError("start & end are required", "VALIDATION");
  const statusFilter = url.searchParams.get("status")?.split(",") ?? [];
  const limit = Math.min(500, Number(url.searchParams.get("limit") || 500));
  /* ---------- fetch appointments inside the window ---------- */ let query = sb.from("appointments").select(`
        id,
        appointment_date,
        appointment_time,
        duration,
        appointment_type,
        status,
        notes,
        patient_id,
        doctor_id,
        patients:patient_id ( first_name,last_name ),
        doctors:doctor_id   ( name )
    `).eq("clinic_id", clinicId).gte("appointment_date", start.split("T")[0]).lte("appointment_date", end.split("T")[0]).order("appointment_date", {
    ascending: true
  }).limit(limit);
  if (statusFilter.length) query = query.in("status", statusFilter);
  const { data: appts, error } = await query;
  if (error) return jsonError(error.message, "QUERY");
  /* ---------- transform to front-end friendly structure ---------- */ const result = appts.map((a)=>({
      id: a.id,
      appointmentDate: a.appointment_date,
      appointmentTime: a.appointment_time,
      duration: a.duration,
      appointmentType: a.appointment_type,
      status: a.status,
      notes: a.notes,
      patientId: a.patient_id,
      patientName: `${a.patients?.first_name ?? ""} ${a.patients?.last_name ?? ""}`.trim(),
      doctorId: a.doctor_id,
      doctorName: a.doctors?.name ?? "",
      /* convenience field for big-calendar title */ procedure: a.appointment_type // or derive differently
    }));
  return new Response(JSON.stringify({
    success: true,
    data: result
  }), {
    headers: {
      "Content-Type": "application/json",
      ...cors
    }
  });
});
/* ---------- helper ---------- */ function jsonError(msg, ctx, code = 400) {
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
