import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Zap, ShieldAlert, Activity, CheckSquare, Code2, LayoutDashboard, PhoneCall } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (data?: { phoneNumber?: string; email?: string }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const steps = [
    {
      title: ">_ Ingesting the Chaos Stream",
      description: "When the pressure hits and you don't know where to start, dump your thoughts into the engine. The AI-powered text cruncher will instantly synthesize your chaos into a clear, actionable mission.",
      icon: <Terminal className="w-8 h-8 text-warning-amber" />,
      widget: (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-400">
          <span className="text-emerald-400">user@system:~$</span> I'm panicking about the release tomorrow! The tests are failing and I haven't written the docs.
          <br /><br />
          <span className="text-warning-amber animate-pulse">Processing...</span>
          <br />
          <span className="text-zinc-300">Mission: Release Triage & Remediation</span>
        </div>
      )
    },
    {
      title: "🔴 Critical Triage vs. ⚡ Active Engagement",
      description: "Not all missions are equal. Missions are automatically scored. CRITICAL (red) means drop everything. ACTIVE (green) means steady progress.",
      icon: <ShieldAlert className="w-8 h-8 text-glitch-red" />,
      widget: (
        <div className="flex flex-col gap-2 w-full">
          <div className="bg-glitch-red/10 border border-glitch-red/50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-glitch-red">PRIORITY: 95</span>
            <span className="text-[10px] font-mono uppercase text-glitch-red/80">Critical Path</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-emerald-500">PRIORITY: 60</span>
            <span className="text-[10px] font-mono uppercase text-emerald-500/80">Active</span>
          </div>
        </div>
      )
    },
    {
      title: "🛠️ The Shadow IDE Workspace",
      description: "Click into any mission to open the Shadow Workspace. The Gemini engine anticipates your needs and provides starter scripts to bypass the cold-start hesitation.",
      icon: <Code2 className="w-8 h-8 text-blue-400" />,
      widget: (
        <div className="bg-[#020202] border border-zinc-800 rounded-lg p-4 font-mono text-[10px] sm:text-xs text-[#a1a1aa] shadow-inner">
          <span className="text-blue-400">{"// AI INITIATED DRAFT"}</span><br/>
          <span className="text-zinc-500">{"function"}</span> <span className="text-yellow-200">resolveBlocker</span>{"() {"}<br/>
          &nbsp;&nbsp;{"return"} <span className="text-green-300">"Deploy Fix"</span>{";"}<br/>
          {"}"}
        </div>
      )
    },
    {
      title: "📈 Habit Telemetry Matrices",
      description: "Consistency breaks paralysis. Track your daily developer habits—algorithms, docs, and commits—using the high-fidelity Telemetry Matrix to maintain momentum.",
      icon: <Activity className="w-8 h-8 text-emerald-400" />,
      widget: (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-sm ${i > 4 ? 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-800/50'}`} />
          ))}
        </div>
      )
    },
    {
      title: "🚨 Emergency Alert Setup",
      description: "For missions scored 85 or above, Clutch can deploy an external SMS and Email override to break you out of zero-action paralysis.",
      icon: <PhoneCall className="w-8 h-8 text-blue-500" />,
      widget: (
        <div className="flex flex-col gap-4 w-full">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Mobile Number (with Country Code)</label>
            <input 
              type="tel"
              placeholder="+1 555 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-[#020202] border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Emergency Email (Optional)</label>
            <input 
              type="email"
              placeholder="alerts@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#020202] border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
            />
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({ phoneNumber, email });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-cyber-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg w-full bg-[#09090b] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-warning-amber/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col items-center text-center gap-6 relative z-10">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl shadow-inner">
              {steps[step].icon}
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{steps[step].title}</h2>
              <p className="text-sm font-mono text-zinc-400 leading-relaxed max-w-md mx-auto">
                {steps[step].description}
              </p>
            </div>

            <div className="w-full my-6 flex justify-center">
              {steps[step].widget}
            </div>

            <div className="w-full flex items-center justify-between mt-4">
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-warning-amber' : 'bg-zinc-800'}`} />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="bg-warning-amber text-[#030303] font-bold font-mono uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-[#ffaa22] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,159,10,0.2)]"
              >
                {step === steps.length - 1 ? "INITIALIZE" : "[ NEXT TACTIC ]"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
