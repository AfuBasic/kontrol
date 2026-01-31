<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>429 - Too Many Requests</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-serif:400|geist-mono:400,500" rel="stylesheet" />
    @vite(['resources/css/app.css'])
    <style>
        :root {
            --sand-top: #d4a574;
            --sand-bottom: #8b6914;
            --glass: rgba(255, 255, 255, 0.03);
        }

        body {
            font-family: 'Geist Mono', monospace;
        }

        .font-serif {
            font-family: 'Instrument Serif', serif;
        }

        /* Hourglass container */
        .hourglass {
            position: relative;
            width: 120px;
            height: 200px;
        }

        .hourglass-glass {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
            clip-path: polygon(
                10% 0%, 90% 0%,
                90% 5%, 55% 45%, 55% 50%, 55% 55%, 90% 95%,
                90% 100%, 10% 100%,
                10% 95%, 45% 55%, 45% 50%, 45% 45%, 10% 5%
            );
            border: 1px solid rgba(255,255,255,0.1);
        }

        /* Sand in top bulb - draining */
        .sand-top {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            top: 12px;
            height: 65px;
            background: linear-gradient(180deg, var(--sand-top) 0%, var(--sand-bottom) 100%);
            clip-path: polygon(15% 0%, 85% 0%, 70% 100%, 30% 100%);
            animation: drain 8s ease-in-out infinite;
        }

        /* Falling sand stream */
        .sand-stream {
            position: absolute;
            left: 50%;
            top: 77px;
            width: 3px;
            height: 46px;
            background: linear-gradient(180deg, var(--sand-top), var(--sand-bottom));
            transform: translateX(-50%);
            animation: stream 8s ease-in-out infinite;
        }

        /* Sand particles falling */
        .sand-particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--sand-top);
            border-radius: 50%;
            animation: fall 0.8s linear infinite;
        }

        /* Sand in bottom bulb - filling */
        .sand-bottom {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 12px;
            width: 60px;
            height: 10px;
            background: linear-gradient(0deg, var(--sand-bottom) 0%, var(--sand-top) 100%);
            clip-path: polygon(30% 0%, 70% 0%, 85% 100%, 15% 100%);
            animation: fill 8s ease-in-out infinite;
        }

        /* Hourglass frame */
        .hourglass-frame {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 90px;
            height: 8px;
            background: linear-gradient(90deg, #1a1a1a, #333, #1a1a1a);
            border-radius: 2px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .hourglass-frame-top { top: -4px; }
        .hourglass-frame-bottom { bottom: -4px; }

        @keyframes drain {
            0%, 5% { height: 65px; opacity: 1; }
            45%, 50% { height: 5px; opacity: 0.5; }
            55%, 95% { height: 5px; opacity: 0.5; }
            100% { height: 65px; opacity: 1; }
        }

        @keyframes fill {
            0%, 5% { height: 10px; }
            45%, 50% { height: 65px; }
            55%, 95% { height: 65px; }
            100% { height: 10px; }
        }

        @keyframes stream {
            0%, 5% { opacity: 1; }
            45%, 55% { opacity: 0; }
            60%, 95% { opacity: 0; }
            100% { opacity: 1; }
        }

        @keyframes fall {
            0% { transform: translateY(0) translateX(-50%); opacity: 1; }
            100% { transform: translateY(46px) translateX(-50%); opacity: 0.5; }
        }

        /* Rotating rings around hourglass */
        .orbit-ring {
            position: absolute;
            border: 1px solid rgba(212, 165, 116, 0.2);
            border-radius: 50%;
            animation: orbit 20s linear infinite;
        }

        .orbit-ring-1 {
            width: 200px;
            height: 200px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .orbit-ring-2 {
            width: 260px;
            height: 260px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation-direction: reverse;
            animation-duration: 30s;
            border-color: rgba(212, 165, 116, 0.1);
        }

        .orbit-dot {
            position: absolute;
            width: 6px;
            height: 6px;
            background: var(--sand-top);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--sand-top);
        }

        @keyframes orbit {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Pulsing glow */
        .glow-pulse {
            animation: glowPulse 4s ease-in-out infinite;
        }

        @keyframes glowPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
        }

        /* Number reveal */
        .number-reveal {
            animation: numberReveal 1s ease-out forwards;
        }

        @keyframes numberReveal {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        /* Countdown timer styling */
        .countdown-segment {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            padding: 0 1rem;
        }

        .countdown-value {
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--sand-top);
            font-variant-numeric: tabular-nums;
        }

        .countdown-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: rgba(255,255,255,0.4);
            margin-top: 0.25rem;
        }

        /* Staggered fade-in */
        .fade-in-up {
            opacity: 0;
            animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body class="min-h-screen bg-[#0a0908] flex items-center justify-center px-4 overflow-hidden">
    <!-- Ambient background -->
    <div class="fixed inset-0">
        <!-- Warm gradient glow -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[radial-gradient(circle,rgba(212,165,116,0.08)_0%,transparent_70%)] glow-pulse"></div>

        <!-- Subtle grain texture -->
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 512 512%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.7%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');"></div>

        <!-- Horizontal lines -->
        <div class="absolute inset-0 opacity-[0.02]" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 100px, rgba(255,255,255,0.5) 100px, rgba(255,255,255,0.5) 101px);"></div>
    </div>

    <div class="relative z-10 text-center">
        <!-- Hourglass visualization -->
        <div class="relative mx-auto mb-12 fade-in-up" style="animation-delay: 0.1s;">
            <!-- Orbit rings -->
            <div class="relative w-70 h-70 mx-auto flex items-center justify-center">
                <div class="orbit-ring orbit-ring-1">
                    <div class="orbit-dot" style="top: -3px; left: 50%;"></div>
                </div>
                <div class="orbit-ring orbit-ring-2">
                    <div class="orbit-dot" style="bottom: -3px; left: 50%;"></div>
                </div>

                <!-- The hourglass -->
                <div class="hourglass">
                    <div class="hourglass-frame hourglass-frame-top"></div>
                    <div class="hourglass-frame hourglass-frame-bottom"></div>
                    <div class="hourglass-glass"></div>
                    <div class="sand-top"></div>
                    <div class="sand-stream">
                        <div class="sand-particle" style="left: 50%; animation-delay: 0s;"></div>
                        <div class="sand-particle" style="left: 50%; animation-delay: 0.2s;"></div>
                        <div class="sand-particle" style="left: 50%; animation-delay: 0.4s;"></div>
                    </div>
                    <div class="sand-bottom"></div>
                </div>
            </div>
        </div>

        <!-- Error code -->
        <div class="mb-6 fade-in-up" style="animation-delay: 0.3s;">
            <span class="font-serif text-[8rem] sm:text-[10rem] leading-none tracking-tight text-transparent bg-clip-text bg-linear-to-b from-[#d4a574] via-[#c4956a] to-[#8b6914]/60">
                429
            </span>
        </div>

        <!-- Message -->
        <h1 class="font-serif text-3xl sm:text-4xl text-white/90 mb-4 fade-in-up" style="animation-delay: 0.5s;">
            Time to breathe
        </h1>
        <p class="text-white/40 mb-10 max-w-sm mx-auto text-sm leading-relaxed fade-in-up" style="animation-delay: 0.6s;">
            You've sent too many requests. The hourglass needs a moment to reset.
        </p>

        <!-- Countdown display -->
        <div class="inline-flex items-center gap-1 px-6 py-4 bg-white/2 backdrop-blur-sm rounded-2xl border border-white/5 mb-10 fade-in-up" style="animation-delay: 0.7s;">
            <div class="countdown-segment">
                <span class="countdown-value" id="countdown">60</span>
                <span class="countdown-label">seconds</span>
            </div>
            <span class="text-white/20 text-xs">until reset</span>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in-up" style="animation-delay: 0.8s;">
            <button onclick="location.reload()" class="group inline-flex items-center gap-3 px-7 py-3.5 bg-linear-to-r from-[#d4a574] to-[#c4956a] text-[#0a0908] text-sm font-medium rounded-xl hover:from-[#e4b584] hover:to-[#d4a57a] transition-all shadow-lg shadow-[#d4a574]/20 hover:shadow-xl hover:shadow-[#d4a574]/30 hover:-translate-y-0.5">
                <svg class="w-4 h-4 transition-transform group-hover:rotate-180 duration-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
            </button>
            <a href="{{ url('/') }}" class="group inline-flex items-center gap-3 px-7 py-3.5 text-white/60 text-sm font-medium rounded-xl border border-white/10 hover:bg-white/3 hover:text-white/80 hover:border-white/20 transition-all">
                <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return Home
            </a>
        </div>

        <!-- Subtle footer -->
        <p class="mt-16 text-white/20 text-xs tracking-widest uppercase fade-in-up" style="animation-delay: 1s;">
            Error 429 &middot; Rate Limited
        </p>
    </div>

    <script>
        // Countdown timer
        let seconds = 60;
        const countdownEl = document.getElementById('countdown');

        const timer = setInterval(() => {
            seconds--;
            if (countdownEl) {
                countdownEl.textContent = seconds;
            }
            if (seconds <= 0) {
                clearInterval(timer);
                location.reload();
            }
        }, 1000);
    </script>
</body>
</html>
