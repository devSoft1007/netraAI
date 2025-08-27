import { z } from "zod";

// Base Zod schemas for your data types
export const patientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  dateOfBirth: z.date(),
  gender: z.string(),
  address: z.string(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  // Store medical history as a free-form textarea string
  medicalHistory: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  memberSince: z.date(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const appointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorName: z.string(),
  appointmentDate: z.date(),
  appointmentTime: z.string(),
  procedure: z.string(),
  status: z.enum(["scheduled", "confirmed", "in-progress", "completed", "cancelled", "urgent"]).default("scheduled"),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const procedureSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  appointmentId: z.string().optional(),
  procedureName: z.string(),
  description: z.string().optional(),
  doctorName: z.string(),
  performedDate: z.date(),
  duration: z.number().optional(), // in minutes
  cost: z.number().optional(),
  status: z.enum(["planned", "in-progress", "completed", "cancelled"]).default("planned"),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiDiagnosisSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  imageUrl: z.string().url(),
  diagnosis: z.string(),
  confidence: z.number().min(0).max(100),
  severity: z.enum(["normal", "mild", "moderate", "severe"]),
  recommendations: z.array(z.string()).default([]),
  analyzedBy: z.string().default("AI Model v2.1"),
  reviewedByDoctor: z.boolean().default(false),
  doctorNotes: z.string().optional(),
  createdAt: z.date(),
});

export const paymentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  appointmentId: z.string().optional(),
  procedureId: z.string().optional(),
  amount: z.number(),
  paymentMethod: z.enum(["cash", "card", "insurance", "check"]),
  paymentStatus: z.enum(["pending", "paid", "partial", "overdue"]).default("pending"),
  insuranceClaim: z.boolean().default(false),
  insuranceAmount: z.number().optional(),
  patientAmount: z.number().optional(),
  paymentDate: z.date().optional(),
  dueDate: z.date().optional(),
  invoiceNumber: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  patientId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  dueDate: z.date().optional(),
  assignedTo: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Insert schemas (for forms/API calls)
export const insertPatientSchema = patientSchema.omit({
  id: true,
  memberSince: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.string().or(z.date()), // Allow string input for forms
});

export const insertAppointmentSchema = appointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  appointmentDate: z.string().or(z.date()), // Allow string input for forms
});

export const insertProcedureSchema = procedureSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  performedDate: z.string().or(z.date()), // Allow string input for forms
});

export const insertAiDiagnosisSchema = aiDiagnosisSchema.omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = paymentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  paymentDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
});

export const insertTaskSchema = taskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).optional(),
});

// Types
export type Patient = z.infer<typeof patientSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Appointment = z.infer<typeof appointmentSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Procedure = z.infer<typeof procedureSchema>;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;

export type AiDiagnosis = z.infer<typeof aiDiagnosisSchema>;
export type InsertAiDiagnosis = z.infer<typeof insertAiDiagnosisSchema>;

export type Payment = z.infer<typeof paymentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Helper function to transform API response dates
export const transformDatesFromAPI = <T extends Record<string, any>>(data: T): T => {
  const transformed = { ...data } as Record<string, any>;

  // Convert string dates to Date objects
  Object.keys(transformed).forEach((key) => {
    if (key.includes("Date") || key.includes("At") || key === "memberSince") {
      if (typeof transformed[key] === "string") {
        transformed[key] = new Date(transformed[key]);
      }
    }
  });

  return transformed as T;
};

// Helper function to transform dates for API requests
export const transformDatesForAPI = <T extends Record<string, any>>(data: T): T => {
  const transformed = { ...data } as Record<string, any>;

  // Convert Date objects to ISO strings
  Object.keys(transformed).forEach((key) => {
    if (transformed[key] instanceof Date) {
      transformed[key] = transformed[key].toISOString();
    }
  });

  return transformed as T;
};
