import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { setupApi } from "@/lib/api";
import { handleMutationSuccess } from "./helper";
import { handleMutationError } from "@/lib/error-handling";

// Create owner setup hook
export function useCreateOwner() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
      organizationName: string;
      organizationSlug?: string;
      industry: string;
      country: string;
      timezone: string;
      currency: string;
      address?: string;
    }) => setupApi.createOwner(data),
    onSuccess: () => {
      handleMutationSuccess(
        "Account created successfully! Please check your email to verify your account."
      );
      // Redirect to login with registered flag
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    },
    onError: handleMutationError,
  });
}
