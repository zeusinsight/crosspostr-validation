import { CheckCircle2 } from "lucide-react";

const features = [
  {
    name: "Multi-platform Publishing",
    description: "Upload once and publish to YouTube, TikTok, Instagram, and more platforms with a single click.",
    icon: CheckCircle2,
  },
  {
    name: "Smart Formatting",
    description: "Automatically format your content to meet each platform's requirements and specifications.",
    icon: CheckCircle2,
  },
  {
    name: "Scheduled Posting",
    description: "Plan your content calendar and schedule posts for the optimal time on each platform.",
    icon: CheckCircle2,
  },
  {
    name: "Performance Analytics",
    description: "Track engagement and performance metrics across all your social platforms in one dashboard.",
    icon: CheckCircle2,
  },
  {
    name: "Content Library",
    description: "Maintain a centralized library of all your media assets for easy reuse and repurposing.",
    icon: CheckCircle2,
  },
  {
    name: "Team Collaboration",
    description: "Collaborate with team members with role-based permissions and approval workflows.",
    icon: CheckCircle2,
  },
];

export function FeaturesSection() {
  return (
    <div id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Streamlined Workflow</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to dominate social media
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Crosspostr eliminates the hassle of managing multiple platforms separately, saving you time and ensuring consistent brand presence across all channels.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
