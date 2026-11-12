import { Mascote } from "@/components/brand";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Mascote size={96} priority className="self-center" />
        <SignUpForm />
      </div>
    </div>
  );
}
