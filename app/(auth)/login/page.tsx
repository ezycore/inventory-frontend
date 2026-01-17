import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { Spinner } from "@/ui/components/spinner"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Spinner className="m-auto mt-20"/>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
