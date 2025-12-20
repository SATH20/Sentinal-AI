"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

export default function Stats() {
  return (
    <section className="py-20 border-y border-white/10 bg-[#1c1c1c]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <StatItem value="20hrs" label="Saved per week" />
          <StatItem value="3x" label="Faster growth" />
          <StatItem value="100%" label="Consistent posting" />
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  // parse numeric part and suffix
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/);
  const targetNum = match ? Number(match[1]) : 0;
  const suffix = match ? match[2] : "";

  return (
    <div className="p-4">
      <div className="relative inline-block group stat-item">
        <StatCount target={targetNum} formatSuffix={suffix} className="text-5xl font-bold text-[#3ECF8E] mb-2" />
      </div>
      <div className="text-gray-400 font-medium mt-2">{label}</div>
    </div>
  );
}

function StatCount({ target, formatSuffix, className }: { target: number; formatSuffix?: string; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const duration = 1200; // ms
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic-ish
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <div ref={ref} className="inline-flex items-baseline">
      <div className="absolute -z-10 stat-glow" aria-hidden="true"></div>
      <div className={className + " transform-gpu transition-transform duration-200 group-hover:scale-105"}>
        {value}
        {formatSuffix}
      </div>
    </div>
  );
}
