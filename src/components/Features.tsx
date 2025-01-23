import { CheckCircle, Zap, Shield, RefreshCw } from "lucide-react";

const features = [
  {
    name: "Lightning Fast",
    description: "Experience blazing fast performance with our optimized platform.",
    icon: Zap,
  },
  {
    name: "Secure by Default",
    description: "Your data is protected with enterprise-grade security.",
    icon: Shield,
  },
  {
    name: "Always Up-to-Date",
    description: "Get the latest features and improvements automatically.",
    icon: RefreshCw,
  },
  {
    name: "Guaranteed Quality",
    description: "We ensure the highest quality standards for your success.",
    icon: CheckCircle,
  },
];

export const Features = () => {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to succeed
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our platform provides all the tools and features you need to build amazing things.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col items-start">
                <div className="rounded-lg bg-primary-50 p-2 ring-1 ring-primary-900/5">
                  <feature.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">{feature.name}</dt>
                <dd className="mt-2 leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};