import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  specialty: z.string().min(1, "Please select your specialty"),
  licenseNumber: z.string().min(5, "Please enter your medical license number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialty: "",
      licenseNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      // Use Supabase authentication
      const { signUp } = await import('@/hooks/useSupabase');
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialty: data.specialty,
        licenseNumber: data.licenseNumber
      };
      
      const result = await signUp(data.email, data.password, userData);
      console.log('result', result)
      if (result.error) {
        toast({
          title: "Signup Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created Successfully",
          description: "Check your email for a confirmation link.",
        });
        setLocation("/login");
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue/10 to-medical-blue/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-professional-dark">EyeCare Pro</h1>
          <p className="text-gray-600 mt-2">Create your medical practice account</p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-professional-dark">Create Account</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Join thousands of medical professionals using EyeCare Pro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>First Name</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Smith"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>Email Address</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="doctor@eyecare.com"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>Phone Number</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Professional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Specialty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select your specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                            <SelectItem value="optometry">Optometry</SelectItem>
                            <SelectItem value="retinal-specialist">Retinal Specialist</SelectItem>
                            <SelectItem value="corneal-specialist">Corneal Specialist</SelectItem>
                            <SelectItem value="glaucoma-specialist">Glaucoma Specialist</SelectItem>
                            <SelectItem value="pediatric-ophthalmology">Pediatric Ophthalmology</SelectItem>
                            <SelectItem value="oculoplastic-surgery">Oculoplastic Surgery</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical License Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MD123456"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Lock className="h-4 w-4" />
                          <span>Password</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              className="h-11 pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="h-11 pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 medical-button-primary mt-6"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-medical-blue hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Privacy */}
        <p className="text-xs text-gray-500 text-center">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-medical-blue hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-medical-blue hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}