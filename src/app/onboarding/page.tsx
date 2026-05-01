import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#050506] px-4 py-8 text-[#f6efe2]">
      <div className="auron-bg fixed inset-0 -z-10 opacity-70" />
      <OnboardingForm />
    </main>
  );
}
