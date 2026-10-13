import { BadgeCheck, Layers, RefreshCcw, Satellite } from 'lucide-react';
import { CuisineTeaser } from '@/components/landing/cuisine-teaser';
import { HeroCollage } from '@/components/landing/hero-collage';
import { LiveStats } from '@/components/landing/live-stats';
import { TrendingSpots } from '@/components/landing/trending-spots';
import { PostcodeForm } from '@/components/postcode/postcode-form';

const VALUE_PROPS = [
  { icon: Satellite, title: 'Live courier telemetry', body: 'Watch your courier move street-by-street, chat in-app and get precise arrival times.' },
  { icon: Layers, title: 'Multi-drop baskets', body: 'Pizza for them, sushi for you — one courier collects from up to three kitchens.' },
  { icon: RefreshCcw, title: '1-tap reorder', body: 'Your exact previous order, modifiers and all, back in the basket in a single tap.' },
  { icon: BadgeCheck, title: 'Hygiene-first kitchens', body: 'Every partner shows its official FSA hygiene rating. No hidden surprises.' },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-[#fbfaf8] to-[#fbfaf8]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-16">
          <div id="postcode-hero" className="scroll-mt-24">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 shadow-card">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-herb-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-herb-600" />
              </span>
              Now delivering across central London
            </p>
            <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
              London’s best kitchens, <span className="text-brand-700">at your door</span> in 25 minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-700">
              From 90-second Neapolitan pizza to 18-hour tonkotsu — order from hand-picked local restaurants with live
              tracking, transparent fees and zero surprises.
            </p>
            <div className="mt-8 max-w-xl">
              <PostcodeForm />
            </div>
          </div>
          <HeroCollage />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6">
        <LiveStats />
        <CuisineTeaser />
        <TrendingSpots />

        <section aria-labelledby="why-title">
          <h2 id="why-title" className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
            Built different
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-ink-900">{title}</h3>
                <p className="mt-1 text-sm text-ink-600">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
