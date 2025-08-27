import type { 
  InsertPatient, 
  InsertAppointment, 
  InsertProcedure, 
  InsertAiDiagnosis, 
  InsertPayment, 
  InsertTask 
} from "@shared/schema";

export const mockPatients: InsertPatient[] = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    dateOfBirth: new Date("1979-03-15"),
    gender: "Female",
    address: "123 Main Street, Anytown, ST 12345",
    insuranceProvider: "BlueCross BlueShield",
    insurancePolicyNumber: "BC123456789",
    insuranceGroupNumber: "1001",
    emergencyContactName: "Michael Johnson",
    emergencyContactPhone: "(555) 123-4568",
  medicalHistory: `Myopia (Nearsightedness) — Diagnosed: 2020-01-15 — ongoing
Dry Eye Syndrome — Diagnosed: 2021-03-10 — managed`,
    allergies: ["Penicillin", "Latex"],
    currentMedications: ["Artificial tears", "Reading glasses"],
    isActive: true,
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@email.com",
    phone: "(555) 234-5678",
    dateOfBirth: new Date("1985-07-22"),
    gender: "Male",
    address: "456 Oak Avenue, Springfield, ST 12346",
    insuranceProvider: "Aetna",
    insurancePolicyNumber: "AET987654321",
    insuranceGroupNumber: "2002",
    emergencyContactName: "Lisa Chen",
    emergencyContactPhone: "(555) 234-5679",
  medicalHistory: `Diabetic Retinopathy — Diagnosed: 2022-06-01 — monitored`,
    allergies: [],
    currentMedications: ["Metformin", "Eye drops"],
    isActive: true,
  },
  {
    firstName: "Emma",
    lastName: "Davis",
    email: "emma.davis@email.com",
    phone: "(555) 345-6789",
    dateOfBirth: new Date("1992-11-08"),
    gender: "Female",
    address: "789 Pine Road, Riverside, ST 12347",
    insuranceProvider: "Medicare",
    insurancePolicyNumber: "MED456789123",
    insuranceGroupNumber: "3003",
    emergencyContactName: "Robert Davis",
    emergencyContactPhone: "(555) 345-6790",
  medicalHistory: undefined,
    allergies: ["Shellfish"],
    currentMedications: [],
    isActive: true,
  },
  {
    firstName: "Robert",
    lastName: "Williams",
    email: "robert.williams@email.com",
    phone: "(555) 456-7890",
    dateOfBirth: new Date("1968-04-12"),
    gender: "Male",
    address: "321 Elm Street, Lakewood, ST 12348",
    insuranceProvider: "Humana",
    insurancePolicyNumber: "HUM321654987",
    insuranceGroupNumber: "4004",
    emergencyContactName: "Patricia Williams",
    emergencyContactPhone: "(555) 456-7891",
  medicalHistory: `Glaucoma — Diagnosed: 2023-01-20 — treatment
Cataracts — Diagnosed: 2023-08-15 — planned_surgery`,
    allergies: ["Iodine"],
    currentMedications: ["Glaucoma eye drops", "Blood pressure medication"],
    isActive: true,
  },
  {
    firstName: "Lisa",
    lastName: "Thompson",
    email: "lisa.thompson@email.com",
    phone: "(555) 567-8901",
    dateOfBirth: new Date("1975-09-30"),
    gender: "Female",
    address: "654 Maple Drive, Hillside, ST 12349",
    insuranceProvider: "Cigna",
    insurancePolicyNumber: "CIG789123456",
    insuranceGroupNumber: "5005",
    emergencyContactName: "David Thompson",
    emergencyContactPhone: "(555) 567-8902",
  medicalHistory: `Macular Degeneration — Diagnosed: 2023-05-10 — early_stage`,
    allergies: [],
    currentMedications: ["Vitamin supplements", "Anti-VEGF injections"],
    isActive: true,
  }
];

export const mockAppointments: InsertAppointment[] = [
  {
    patientId: "", // Will be set after patient creation
    doctorName: "Rodriguez",
    appointmentDate: new Date(),
    appointmentTime: "9:00 AM",
    procedure: "Routine Eye Exam",
    status: "confirmed",
    notes: "Annual checkup, patient reports no vision changes"
  },
  {
    patientId: "", // Will be set after patient creation
    doctorName: "Rodriguez",
    appointmentDate: new Date(),
    appointmentTime: "10:30 AM",
    procedure: "Retinal Photography + AI Analysis",
    status: "in-progress",
    notes: "Follow-up for diabetic retinopathy monitoring"
  },
  {
    patientId: "", // Will be set after patient creation
    doctorName: "Rodriguez",
    appointmentDate: new Date(),
    appointmentTime: "2:00 PM",
    procedure: "Urgent: Eye Injury Consultation",
    status: "urgent",
    notes: "Patient reports sudden vision loss in left eye"
  }
];

export const mockProcedures: InsertProcedure[] = [
  {
    patientId: "",
    procedureName: "Comprehensive Eye Examination",
    description: "Complete eye health evaluation including visual acuity, refraction, and fundus examination",
    doctorName: "Rodriguez",
    performedDate: new Date("2024-12-10"),
    duration: 45,
    cost: "250.00",
    status: "completed",
    notes: "Vision stable, prescription unchanged"
  },
  {
    patientId: "",
    procedureName: "Optical Coherence Tomography (OCT)",
    description: "High-resolution imaging of retinal layers",
    doctorName: "Kim",
    performedDate: new Date("2024-12-08"),
    duration: 30,
    cost: "400.00",
    status: "completed",
    notes: "No signs of macular degeneration detected"
  }
];

export const mockAiDiagnoses: InsertAiDiagnosis[] = [
  {
    patientId: "",
    imageUrl: "https://example.com/fundus1.jpg",
    diagnosis: "No diabetic retinopathy detected",
    confidence: "98.5",
    severity: "normal",
    recommendations: ["Continue regular eye exams", "Maintain healthy lifestyle", "Monitor blood sugar levels"],
    analyzedBy: "AI Model v2.1",
    reviewedByDoctor: true,
    doctorNotes: "Confirmed normal findings"
  },
  {
    patientId: "",
    imageUrl: "https://example.com/fundus2.jpg",
    diagnosis: "Mild diabetic retinopathy detected",
    confidence: "92.3",
    severity: "mild",
    recommendations: ["Schedule follow-up in 6 months", "Optimize diabetes management", "Consider more frequent monitoring"],
    analyzedBy: "AI Model v2.1",
    reviewedByDoctor: false,
  }
];

export const mockPayments: InsertPayment[] = [
  {
    patientId: "",
    amount: "250.00",
    paymentMethod: "insurance",
    paymentStatus: "paid",
    insuranceClaim: true,
    insuranceAmount: "200.00",
    patientAmount: "50.00",
    paymentDate: new Date("2024-12-10"),
    dueDate: new Date("2024-12-20"),
    invoiceNumber: "INV-2024-001"
  },
  {
    patientId: "",
    amount: "400.00",
    paymentMethod: "card",
    paymentStatus: "pending",
    insuranceClaim: false,
    patientAmount: "400.00",
    dueDate: new Date("2024-12-25"),
    invoiceNumber: "INV-2024-002"
  }
];

export const mockTasks: InsertTask[] = [
  {
    title: "Review lab results for John Smith",
    description: "Analyze blood work and glucose levels",
    priority: "high",
    status: "pending",
    dueDate: new Date(),
    assignedTo: "Dr. Rodriguez"
  },
  {
    title: "Follow up with Maria Garcia surgery",
    description: "Check on post-operative recovery progress",
    priority: "medium",
    status: "pending",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    assignedTo: "Dr. Rodriguez"
  },
  {
    title: "Update treatment plan for David Lee",
    description: "Revise medication dosage based on recent test results",
    priority: "medium",
    status: "pending",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    assignedTo: "Dr. Rodriguez"
  },
  {
    title: "Schedule retinal specialist consultation",
    description: "Arrange referral for complex retinopathy case",
    priority: "urgent",
    status: "pending",
    dueDate: new Date(),
    assignedTo: "Dr. Rodriguez"
  },
  {
    title: "Insurance authorization for surgery",
    description: "Submit prior authorization request for cataract surgery",
    priority: "high",
    status: "pending",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    assignedTo: "Dr. Rodriguez"
  }
];
