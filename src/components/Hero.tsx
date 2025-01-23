import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      <div className="relative pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <h1 className="animate-fade-down text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Welcome to Your{" "}
                <span className="text-primary-600">Amazing App</span>
              </h1>
              <p className="animate-fade-up mt-6 text-lg text-gray-500">
                Start building something incredible with our powerful and intuitive platform. Create, collaborate, and bring your ideas to life.
              </p>
              <div className="mt-8 flex gap-4 sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="group animate-fade-up"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="animate-fade-up"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative mt-12 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full overflow-hidden rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                  <img
                    className="w-full animate-fade-up"
                    src="/placeholder.svg"
                    alt="App preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};