import { Link, useSearchParams } from "wouter";
import { Stethoscope, MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegistrationSuccess() {
  // read search params (we don't need the setter here)
  const [searchParams] = useSearchParams();
  // extract email from URLSearchParams
  const email = searchParams?.get("email") ?? undefined;
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue/10 to-medical-blue/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-professional-dark">Registration Successful</h1>
          <p className="text-gray-600 mt-2">Thank you for creating an account with EyeCare Pro</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-professional-dark">Almost done</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Please verify your email address to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-medical-blue/5 rounded-full">
                <MailCheck className="h-10 w-10 text-medical-blue" />
              </div>

              <p className="text-sm text-gray-700">
                We sent a confirmation link to the email address you provided{email ? (
                  <>: <strong className="text-professional-dark">{email}</strong></>
                ) : (
                  "."
                )} Open the email and click the link to verify your account.
              </p>

              <p className="text-xs text-gray-500">If you don't see the email, check your spam folder or request a new verification email from the login page.</p>

              <div className="w-full mt-4">
                <Link href="/login">
                  <Button className="w-full h-11 medical-button-primary">Go to Sign In</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 text-center">
          Didn't receive an email? Visit the <Link href="/login" className="text-medical-blue hover:underline">Sign In</Link> page to request a new verification message.
        </p>
      </div>
    </div>
  );
}
