import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FeatureUnavailableProps {
  title: string;
  description: string;
  roadmap: string;
}

export function FeatureUnavailable({ title, description, roadmap }: FeatureUnavailableProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="text-sm font-extrabold">{title} chưa khả dụng</h2>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">{description}</p>
          <div className="mt-3 inline-flex rounded-full border border-amber-300 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-amber-800">
            Roadmap: {roadmap}
          </div>
        </div>
      </div>
    </div>
  );
}
