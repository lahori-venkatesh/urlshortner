import React from 'react';

const companies = [
  {
    name: 'TechNova Labs',
    color: '#06b6d4', // Cyan 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'CloudNest',
    color: '#0ea5e9', // Sky 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M7 16C3.68629 16 1 13.3137 1 10C1 6.68629 3.68629 4 7 4C7.77387 4 8.51468 4.14666 9.19324 4.41473C9.91986 2.37911 11.8385 1 14 1C16.7614 1 19 3.23858 19 6C19 6.27364 18.9725 6.53931 18.9193 6.79377C20.6976 7.37059 22 9.02796 22 11C22 13.7614 19.7614 16 17 16H7Z" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'ByteCraft',
    color: '#8b5cf6', // Violet 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="2" y="2" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.5" />
        <rect x="14" y="2" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="2" y="14" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="14" y="14" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.5" />
      </svg>
    )
  },
  {
    name: 'GrowthLoop',
    color: '#22c55e', // Green 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 12H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
      </svg>
    )
  },
  {
    name: 'CodeSpring',
    color: '#10b981', // Emerald 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M7 8L3 12L7 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 8L21 12L17 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4L10 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    name: 'PixelBridge',
    color: '#6366f1', // Indigo 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M4 21V19C4 12 8 8 12 8C16 8 20 12 20 19V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="5" rx="1" fill="currentColor" />
        <path d="M4 15H20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
      </svg>
    )
  },
  {
    name: 'Launchify',
    color: '#f97316', // Orange 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M12 2L15 8L21 9L17 14L19 21L12 17L5 21L7 14L3 9L9 8L12 2Z" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'NexaWorks',
    color: '#64748b', // Slate 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M4 4H10V10H4V4Z" fill="currentColor" />
        <path d="M14 4H20V10H14V4Z" fill="currentColor" fillOpacity="0.6" />
        <path d="M4 14H10V20H4V14Z" fill="currentColor" fillOpacity="0.6" />
        <path d="M14 14H20V20H14V14Z" fill="currentColor" fillOpacity="0.3" />
      </svg>
    )
  },
  {
    name: 'DevSpark',
    color: '#eab308', // Yellow 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    name: 'ScaleMint',
    color: '#34d399', // Emerald 400
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="3" y="14" width="4" height="8" rx="1" fill="currentColor" fillOpacity="0.4" />
        <rect x="10" y="10" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.7" />
        <rect x="17" y="4" width="4" height="18" rx="1" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'WebOrbit',
    color: '#8b5cf6', // Violet 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="2" transform="rotate(45 12 12)" />
      </svg>
    )
  },
  {
    name: 'DataCrate',
    color: '#b45309', // Amber 700
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M21 16V8L12 3L3 8V16L12 21L21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 8.5L12 13L20.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 13V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    name: 'AppVanta',
    color: '#ec4899', // Pink 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="6" y="2" width="12" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M10 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    name: 'Marklytics',
    color: '#ef4444', // Red 500
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 16L12 9L16 13L21 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    name: 'BuildStack',
    color: '#2563eb', // Blue 600
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

const TrustedCompanies: React.FC = () => {
  return (
    <section className="py-12 border-y border-gray-100 bg-gray-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Trusted by forward-thinking companies
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="animate-scroll whitespace-nowrap flex gap-16 min-w-full items-center justify-center py-4">
          {/* First Set */}
          {companies.map((company, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 transition-all cursor-default group/item opacity-75 hover:opacity-100"
              style={{ color: company.color }}
            >
              <div className="transform group-hover/item:scale-110 transition-transform duration-300">
                {company.icon}
              </div>
              <span className="font-bold text-xl text-gray-700 font-sans tracking-tight">
                {company.name}
              </span>
            </div>
          ))}

          {/* Duplicate Set for Loop */}
          {companies.map((company, i) => (
            <div
              key={`dup-${i}`}
              className="flex items-center space-x-3 transition-all cursor-default group/item opacity-75 hover:opacity-100"
              style={{ color: company.color }}
            >
              <div className="transform group-hover/item:scale-110 transition-transform duration-300">
                {company.icon}
              </div>
              <span className="font-bold text-xl text-gray-700 font-sans tracking-tight">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedCompanies;
