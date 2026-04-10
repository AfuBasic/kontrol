import { motion } from 'framer-motion';

type Period = 'monthly' | 'annual';

interface Props {
  billingPeriod: Period;
  setBillingPeriod: (p: Period) => void;
}

export default function PricingToggle({ billingPeriod, setBillingPeriod }: Props) {
  const options: { id: Period; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'annual', label: 'Annual' },
  ];

  return (
    <div className="relative flex w-full max-w-sm rounded-full bg-slate-800/80 p-1.5 shadow-inner ring-1 ring-white/5 backdrop-blur-md transition-all">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => setBillingPeriod(option.id)}
          className={`relative flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors duration-300 ${
            billingPeriod === option.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {billingPeriod === option.id && (
            <motion.div
              layoutId="pricing-toggle-pill"
              className="absolute inset-0 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
