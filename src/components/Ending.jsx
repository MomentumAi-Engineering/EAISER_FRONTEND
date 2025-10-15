import React from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rasel",
    role: "CEO, Neural Nudge",
    text: "The chatbot is a game changer. It replies instantly, and then smoothly pushes customers into the sales funnel, showing product options, offering discounts. Our conversion rate from DMs went from 8% to nearly 20%.",
    initial: "C",
  },
  {
    name: "Joel",
    role: "Founder",
    text: "I was shocked to see how much I was losing before. With the win-back and follow-up system, around 35% of abandoned leads actually turned into real client. In just 4 weeks, I recovered dozens of lost customers.",
    initial: "M",
  },
  {
    name: "Rishav",
    role: "CTO, Project Frame",
    text: "We implemented the AI inbound caller agent, and I can confidently say it has changed how we handle support. No more missed calls, no more long queues. Customers get answers immediately, and the tough issues are smoothly transferred to our human team.",
    initial: "P",
  },
];

const Ending = () => {
  return (
    <section className="bg-blue-950 text-white py-16 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          What Our Clients Say
        </h2>
        <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
          Don’t just take our word for it. Here's what our satisfied clients
          have to say about our AI solutions.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-blue-900 p-6 rounded-2xl shadow-lg text-left border border-blue-800"
            >
              <Quote className="text-red-500 mb-2" size={28} />
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-200 mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white font-bold">
                  {t.initial}
                </div>
                <div>
                  <h4 className="font-semibold">{t.name}</h4>
                  <p className="text-gray-400 text-sm">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ending;
