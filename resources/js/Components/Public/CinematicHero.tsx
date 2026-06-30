import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const HERO_ASSETS = {
    asleep: '/assets/images/hero/estate-before-kontrol.png',
    awake: '/assets/images/hero/estate-powered-by-kontrol.webp',
    logo: '/assets/images/kontrol-icon-white.png',
};

export default function CinematicHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const asleepRef = useRef<HTMLImageElement>(null);
    const revealRef = useRef<HTMLDivElement>(null);
    const awakeRef = useRef<HTMLImageElement>(null);
    const enteringLogoRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const pulseRef = useRef<HTMLDivElement>(null);
    const wakeWashRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const asleep = asleepRef.current;
        const reveal = revealRef.current;
        const awake = awakeRef.current;
        const enteringLogo = enteringLogoRef.current;
        const logo = logoRef.current;
        const pulse = pulseRef.current;
        const wakeWash = wakeWashRef.current;

        if (!container || !asleep || !reveal || !awake || !enteringLogo || !logo || !pulse || !wakeWash) {
            return;
        }

        const ctx = gsap.context(() => {
            gsap.set(reveal, { '--awake-radius': '0%' });
            gsap.set(awake, { autoAlpha: 0.01, scale: 1.012, filter: 'saturate(0.65) brightness(0.92)' });
            gsap.set(asleep, { autoAlpha: 1, filter: 'brightness(0.96) contrast(1.04)' });
            gsap.set(enteringLogo, { autoAlpha: 0, xPercent: -50, yPercent: -50, x: '-18vw', y: '18vh', scale: 0.58, rotate: -3 });
            gsap.set([logo, pulse, wakeWash], { autoAlpha: 0, scale: 0.72 });

            const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

            timeline
                .to(enteringLogo, {
                    autoAlpha: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                    duration: 1.35,
                    ease: 'power3.inOut',
                    delay: 2,
                })
                .to(
                    logo,
                    {
                        autoAlpha: 1,
                        scale: 1,
                        duration: 0.44,
                        ease: 'power2.out',
                    },
                    '-=0.28',
                )
                .to(enteringLogo, { autoAlpha: 0, scale: 0.88, duration: 0.36, ease: 'power2.out' }, '<')
                .to(
                    pulse,
                    {
                        autoAlpha: 1,
                        scale: 1,
                        duration: 0.34,
                    },
                    '-=0.12',
                )
                .to(
                    awake,
                    {
                        autoAlpha: 0.56,
                        filter: 'saturate(0.9) brightness(0.98)',
                        duration: 1.2,
                        ease: 'sine.inOut',
                    },
                    '<',
                )
                .to(
                    reveal,
                    {
                        '--awake-radius': '142%',
                        duration: 1.85,
                        ease: 'sine.inOut',
                    },
                    '<',
                )
                .to(
                    wakeWash,
                    {
                        autoAlpha: 1,
                        scale: 1.08,
                        duration: 1.35,
                        ease: 'sine.out',
                    },
                    '<',
                )
                .to(
                    awake,
                    {
                        autoAlpha: 1,
                        filter: 'saturate(1) brightness(1)',
                        duration: 0.9,
                        ease: 'sine.inOut',
                    },
                    '-=0.55',
                )
                .to(asleep, { autoAlpha: 0, duration: 0.7, ease: 'sine.inOut' }, '-=0.5')
                .to(
                    pulse,
                    {
                        autoAlpha: 0,
                        scale: 1.26,
                        duration: 0.72,
                        ease: 'sine.out',
                    },
                    '-=0.5',
                )
                .to(
                    [logo, wakeWash],
                    {
                        autoAlpha: 0,
                        scale: 0.94,
                        duration: 0.72,
                        ease: 'sine.out',
                    },
                    '-=0.62',
                );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#040a15]" aria-hidden="true">
            <div className="kontrol-hero-image-plane absolute inset-0 z-0 h-full w-full">
                <img ref={asleepRef} src={HERO_ASSETS.asleep} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

                <div ref={revealRef} className="kontrol-hero-awake absolute inset-0">
                    <img ref={awakeRef} src={HERO_ASSETS.awake} alt="" className="h-full w-full object-cover" draggable={false} />
                </div>
            </div>

            <div
                ref={wakeWashRef}
                className="kontrol-hero-wake-wash pointer-events-none absolute top-[72%] left-1/2 z-[9] -translate-x-1/2 -translate-y-1/2"
            />

            <div ref={enteringLogoRef} className="pointer-events-none absolute top-[72%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-13 items-center justify-center rounded-[1.05rem] border border-blue-300/24 bg-[#07101d]/72 shadow-[0_0_28px_rgba(31,111,219,0.42),0_16px_42px_rgba(2,8,23,0.34)] ring-1 ring-white/10 backdrop-blur-md">
                    <img
                        src={HERO_ASSETS.logo}
                        alt=""
                        className="size-7 object-contain drop-shadow-[0_0_14px_rgba(96,165,250,0.72)]"
                        draggable={false}
                    />
                </div>
            </div>

            <div
                ref={pulseRef}
                className="kontrol-hero-pulse pointer-events-none absolute top-[72%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            />

            <div ref={logoRef} className="pointer-events-none absolute top-[72%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-17 items-center justify-center rounded-[1.35rem] border border-blue-300/30 bg-[#07101d]/82 shadow-[0_0_38px_rgba(31,111,219,0.55),0_22px_58px_rgba(2,8,23,0.38)] ring-1 ring-white/10 backdrop-blur-md">
                    <img
                        src={HERO_ASSETS.logo}
                        alt=""
                        className="size-9 object-contain drop-shadow-[0_0_18px_rgba(96,165,250,0.8)]"
                        draggable={false}
                    />
                </div>
            </div>

            <div className="absolute inset-0 z-1 bg-[radial-gradient(circle_at_50%_46%,rgba(3,7,18,0.04)_0%,rgba(3,7,18,0.12)_42%,rgba(3,7,18,0.74)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 z-1 h-72 bg-gradient-to-t from-[#07101d] via-[#07101d]/62 to-transparent" />
            <div className="absolute inset-y-0 left-0 z-1 w-1/3 bg-gradient-to-r from-[#07101d]/44 to-transparent" />
        </div>
    );
}
