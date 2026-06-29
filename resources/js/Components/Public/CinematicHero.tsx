import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ShieldCheck } from 'lucide-react';

export default function CinematicHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const grayscaleImgRef = useRef<HTMLImageElement>(null);
    const activeImgRef = useRef<HTMLImageElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const pulseRingRef = useRef<SVGSVGElement>(null);
    const [progress, setProgress] = useState(0); // Mask radius percent

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                repeat: -1,
                repeatDelay: 4, // Rest at the active state before looping back
                yoyo: true, // Seamless reverse transition back to sleep
            });

            // 0-2s: Grayscale sleeping state
            tl.set(logoRef.current, { scale: 0, opacity: 0 });
            tl.set(pulseRingRef.current, { scale: 0, opacity: 0 });
            
            // 2s: Kontrol logo emerges at the entrance gate coordinates (50% X, 72% Y)
            tl.to(logoRef.current, {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: 'back.out(1.7)',
                delay: 2,
            });

            // Logo emits a blue pulse ring
            tl.to(pulseRingRef.current, {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
            }, '-=0.1');

            // 2-4.5s: Expansion of the radial mask clip-path to transition from grayscale to color
            tl.to({ val: 0 }, {
                val: 120,
                duration: 2.5,
                ease: 'power2.inOut',
                onUpdate: function () {
                    setProgress(this.targets()[0].val);
                }
            }, '-=0.3');

            // Logo fades into the active estate backdrop once fully awake
            tl.to(logoRef.current, {
                opacity: 0,
                scale: 0.8,
                duration: 0.8,
                ease: 'power2.inOut',
            }, '-=0.8');

            tl.to(pulseRingRef.current, {
                opacity: 0,
                duration: 0.8,
            }, '-=0.8');

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#040a15]">
            {/* Ambient luxury Ken Burns drift on both perfectly aligned images */}
            <div className="absolute inset-0 z-0 h-full w-full animate-[kenburns_24s_ease-in-out_infinite_alternate]">
                {/* Active Colored/Warm Image (Asset Two) */}
                <img
                    ref={activeImgRef}
                    src="/images/estate_powered_by_kontrol.png"
                    alt="Active Estate"
                    className="absolute inset-0 h-full w-full object-cover opacity-100"
                />

                {/* Grayscale/Sleeping Image (Asset One) clipped to reveal color image underneath */}
                <img
                    ref={grayscaleImgRef}
                    src="/images/estate_before_kontrol.png"
                    alt="Sleeping Estate"
                    className="absolute inset-0 h-full w-full object-cover transition-all"
                    style={{
                        clipPath: `circle(${100 - progress}% at 50% 72%)`,
                    }}
                />

                {/* Drift SVG clouds over the sky portion */}
                <div className="absolute inset-x-0 top-0 h-1/3 opacity-30 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                            d="M-20,10 Q20,15 50,8 T120,12"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.4)"
                            strokeWidth="4"
                            className="animate-[cloud-drift_60s_linear_infinite]"
                        />
                        <path
                            d="M-40,18 Q10,12 60,20 T140,15"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="3"
                            className="animate-[cloud-drift_90s_linear_infinite_reverse]"
                        />
                    </svg>
                </div>
            </div>

            {/* Glowing Blue Pulse Ring centering at the Gatehouse (50% X, 72% Y) */}
            <svg
                ref={pulseRingRef}
                className="absolute left-1/2 top-[72%] z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                viewBox="0 0 200 200"
            >
                <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    className="animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' }}
                />
            </svg>

            {/* Kontrol Logo emerging at the entrance gate (50% X, 72% Y) */}
            <div
                ref={logoRef}
                className="absolute left-1/2 top-[72%] z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
                <div className="flex items-center justify-center rounded-2xl border border-blue-500/30 bg-[#07101d]/90 p-4 shadow-[0_0_35px_rgba(59,130,246,0.5)] backdrop-blur-md">
                    <ShieldCheck size={28} className="text-blue-500 animate-[pulse_2s_infinite]" />
                </div>
            </div>

            {/* Dark vignette gradient overlays for text readability */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,transparent_10%,rgba(4,12,26,0.3)_48%,rgba(3,7,18,0.72)_100%)] z-1" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#07101d] via-[#07101d]/60 to-transparent z-1" />

            {/* Tailwind styles mapping for Ken Burns and cloud animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes kenburns {
                    0% { transform: scale(1.02) translate(0, 0); }
                    100% { transform: scale(1.06) translate(-1%, -0.5%); }
                }
                @keyframes cloud-drift {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
}
