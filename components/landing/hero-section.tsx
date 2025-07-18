import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden py-20 sm:py-32 isolate">
      {/* Background gradient */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-sm">
            Beta Access Now Available
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Post Once, Reach Everywhere
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Crosspostr streamlines your social media workflow. Upload once and publish to YouTube, TikTok, Instagram, and more—all from one intuitive dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/login">
              <Button size="lg" className="rounded-full px-8">
                Get Started
              </Button>
            </Link>
            <Link href="#features" className="text-sm font-semibold leading-6">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 flow-root sm:mt-24">
          <div className="relative -m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="relative rounded-md shadow-2xl shadow-gray-500/20">
              <div className="aspect-[16/9] overflow-hidden rounded-md bg-gray-800">
                {/* Replace with your actual dashboard screenshot */}
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400">
                  <div className="p-8 text-center">
                    <div className="mb-4 text-2xl font-bold text-white">Crosspostr Dashboard</div>
                    <p className="opacity-75">Your unified social media command center</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background gradient (bottom) */}
      <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+30rem)] sm:w-[72.1875rem]" />
      </div>
    </div>
  );
}
