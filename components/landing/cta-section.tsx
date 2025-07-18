import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTASection() {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to simplify your social media workflow?
          <br />
          <span className="text-indigo-200">Start your free trial today.</span>
        </h2>
        <div className="mt-10 flex items-center gap-x-6 lg:mt-0 lg:flex-shrink-0">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
              Get started
            </Button>
          </Link>
          <Link href="#features" className="text-sm font-semibold leading-6 text-white">
            Learn more <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
