"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What platforms does Crosspostr support?",
    answer: "Crosspostr currently supports YouTube, TikTok, and Instagram. We're constantly working on adding more platforms to our ecosystem."
  },
  {
    question: "Do I need to create accounts on each platform separately?",
    answer: "Yes, you'll need existing accounts on each platform you want to post to. Crosspostr helps you manage and post to these accounts from a single dashboard."
  },
  {
    question: "How does the video formatting work?",
    answer: "Crosspostr automatically formats your videos to meet the requirements of each platform. This includes aspect ratio adjustments, resolution changes, and ensuring your content meets platform-specific guidelines."
  },
  {
    question: "Can I schedule posts in advance?",
    answer: "Yes! With our Pro and Business plans, you can schedule content to be posted at specific times across all your connected platforms."
  },
  {
    question: "Is there a limit to how many videos I can upload?",
    answer: "Free and Starter plans have monthly upload limits. Pro plans include 50 posts per month, while Business plans offer unlimited uploads."
  },
  {
    question: "How secure is my account information?",
    answer: "We take security seriously. Crosspostr uses OAuth for platform authentication, meaning we never store your actual passwords. All data is encrypted and we follow industry best practices for data security."
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faq" className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">FAQ</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Have a different question and can&apos;t find the answer you&apos;re looking for? Reach out to our support team by{" "}
            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
              sending us an email
            </a>{" "}
            and we&apos;ll get back to you as soon as we can.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl divide-y divide-gray-200 dark:divide-gray-800">
          {faqs.map((faq, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-start justify-between text-left"
                aria-expanded={openIndex === index}
              >
                <span className="text-base font-semibold leading-7">{faq.question}</span>
                <span className="ml-6 flex h-7 items-center">
                  {openIndex === index ? (
                    <ChevronUp className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-6 w-6" aria-hidden="true" />
                  )}
                </span>
              </button>
              {openIndex === index && (
                <div className="mt-2 pr-12">
                  <p className="text-base leading-7 text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
