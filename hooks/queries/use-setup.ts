import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Setup API
const setupApi = {
  createOwner: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    organizationName: string;
    industry: string;
    country: string;
    timezone: string;
    currency: string;
  }) => {
    const response = await fetch('/api/setup/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || 'Setup failed');
    }

    return result;
  },
};

// Create owner setup hook
export function useCreateOwner() {
  const router = useRouter();

  return useMutation({
    mutationFn: setupApi.createOwner,
    onSuccess: (result) => {
      toast.success('Owner account created successfully! Redirecting to login...');
      // Redirect to login after successful setup
      setTimeout(() => {
        router.push('/login?setup=success');
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create owner account');
    },
  });
}
