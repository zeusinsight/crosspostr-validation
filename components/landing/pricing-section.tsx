import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    id: "tier-starter",
    price: { monthly: "$15" },
    description: "Perfect for individual creators just getting started.",
    features: [
      "2 social media platforms",
      "10 posts per month",
      "Basic analytics",
      "Standard video quality",
      "Email support"
    ],
    cta: "Start for free",
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    price: { monthly: "$29" },
    description: "Ideal for growing creators with multiple channels.",
    features: [
      "All social media platforms",
      "50 posts per month",
      "Advanced analytics",
      "HD video quality",
      "Priority support",
      "Scheduled posting",
      "Custom thumbnails"
    ],
    cta: "Start free trial",
    mostPopular: true,
  },
  {
    name: "Business",
    id: "tier-business",
    price: { monthly: "$79" },
    description: "For teams and businesses managing multiple accounts.",
    features: [
      "All Pro features",
      "Unlimited posts",
      "Team collaboration",
      "API access",
      "White-label reports",
      "Dedicated account manager",
      "Custom integrations"
    ],
    cta: "Contact sales",
    mostPopular: false,
  },
];

export function PricingSection() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Plans for creators of all sizes
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
          Choose the perfect plan for your needs. All plans include a 14-day free trial.
        </p>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-1 ring-gray-200 dark:ring-gray-700 xl:p-10 ${
                tier.mostPopular
                  ? "bg-gray-900 dark:bg-white/5 ring-gray-900 dark:ring-white/10"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={`text-lg font-semibold leading-8 ${
                    tier.mostPopular ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-indigo-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                    Most popular
                  </p>
                ) : null}
              </div>
              <p className={`mt-4 text-sm leading-6 ${tier.mostPopular ? "text-gray-300" : "text-gray-600 dark:text-gray-300"}`}>
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className={`text-4xl font-bold tracking-tight ${tier.mostPopular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {tier.price.monthly}
                </span>
                <span className={`text-sm font-semibold leading-6 ${tier.mostPopular ? "text-gray-300" : "text-gray-600 dark:text-gray-300"}`}>
                  /month
                </span>
              </p>
              <Link href="/auth/signup" className="mt-6 block">
                <Button
                  variant={tier.mostPopular ? "default" : "outline"}
                  className={`w-full ${tier.mostPopular ? "" : "border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"}`}
                >
                  {tier.cta}
                </Button>
              </Link>
              <ul
                role="list"
                className={`mt-8 space-y-3 text-sm leading-6 ${tier.mostPopular ? "text-gray-300" : "text-gray-600 dark:text-gray-300"}`}
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${tier.mostPopular ? "text-white" : "text-indigo-600"}`} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
