import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/onboarding");
  if (session.onboarded) redirect("/dashboard");

  return <OnboardingWizard userName={session.name} />;
}
