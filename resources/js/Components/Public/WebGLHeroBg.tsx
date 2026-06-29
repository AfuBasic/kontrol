import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_reduced_motion;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx) ;
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0 ;
    vec3 h = abs(x) - 0.5 ;
    vec3 a0 = x - floor(x + 0.5) ;
    vec3 g0 = vec3(a0.x, h.x, a0.y) * vec3(1.0, 1.0, a0.z);
    vec3 g1 = vec3(a0.z, h.z, a0.w) * vec3(1.0, 1.0, a0.w);
    vec3 norm = 1.79284291400159 - 0.85373472095314 *
      vec3(dot(g0,g0), dot(g1,g1), dot(g0,g1));
    g0 *= norm.x;
    g1 *= norm.y;
    vec3 values = vec3(dot(g0, x0), dot(g1, x12.xy), dot(norm.z * vec3(a0.y, h.y, norm.z), x12.zw));
    return 130.0 * dot(m, values);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    
    // Account for aspect ratio
    float aspect = u_resolution.x / u_resolution.y;
    vec2 st_aspect = vec2(st.x * aspect, st.y);

    // Easing the time variable if reduced motion is enabled
    float time = u_time * (u_reduced_motion > 0.5 ? 0.05 : 0.4);

    // Create moving noise coordinates
    vec2 q = vec2(0.0);
    q.x = snoise(st_aspect + vec2(time * 0.1, time * 0.15));
    q.y = snoise(st_aspect + vec2(time * 0.08, -time * 0.12));

    vec2 r = vec2(0.0);
    r.x = snoise(st_aspect + q * 1.5 + vec2(time * 0.2, time * 0.1));
    r.y = snoise(st_aspect + q * 1.2 - vec2(time * 0.15, time * 0.05));

    float f = snoise(st_aspect + r * 2.0);

    // Color definitions
    vec3 color_bg = vec3(0.039, 0.051, 0.098); // deep slate / dark blue
    vec3 color_blue = vec3(0.12, 0.31, 0.90);  // electric blue
    vec3 color_indigo = vec3(0.25, 0.15, 0.70); // purple/indigo
    vec3 color_cyan = vec3(0.0, 0.75, 0.90);   // bright cyan

    // Mix colors based on noise calculations
    vec3 color = mix(color_bg, color_blue, f * 0.6 + 0.4);
    color = mix(color, color_indigo, q.x * 0.5 + 0.5);
    color = mix(color, color_cyan, r.y * q.y * 0.3);

    // Interactive mouse glow (with dynamic smoothing)
    vec2 mouse_pos = u_mouse;
    mouse_pos.y = 1.0 - mouse_pos.y; // invert y to match WebGL coordinates
    float dist = distance(st, mouse_pos);
    float glow = smoothstep(0.4, 0.0, dist) * (u_reduced_motion > 0.5 ? 0.1 : 0.3);
    color += color_cyan * glow;

    // Apply dark overlay
    color *= 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function WebGLHeroBg() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.warn('WebGL not supported, falling back to static gradient.');
            return;
        }

        // Check reduced motion setting
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let isReducedMotion = mediaQuery.matches;

        const handleReducedMotionChange = (e: MediaQueryListEvent) => {
            isReducedMotion = e.matches;
        };
        mediaQuery.addEventListener('change', handleReducedMotionChange);

        // Helper to compile shaders
        const compileShader = (source: string, type: number) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        // Set up vertices (a fullscreen quad)
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Get uniform locations
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
        const reducedMotionLocation = gl.getUniformLocation(program, 'u_reduced_motion');

        // Resize handler
        const resize = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }
        };

        window.addEventListener('resize', resize);
        resize();

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
            mouseRef.current.targetY = (e.clientY - rect.top) / rect.height;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Render loop
        let animationId: number;
        let startTime = performance.now();

        const render = () => {
            const now = performance.now();
            const time = (now - startTime) / 1000.0;

            // Interpolate mouse coordinates (smooth lag)
            const mouse = mouseRef.current;
            mouse.x += (mouse.targetX - mouse.x) * 0.08;
            mouse.y += (mouse.targetY - mouse.y) * 0.08;

            // Set uniforms
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, time);
            gl.uniform2f(mouseLocation, mouse.x, mouse.y);
            gl.uniform1f(reducedMotionLocation, isReducedMotion ? 1.0 : 0.0);

            // Draw fullscreen quad
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            mediaQuery.removeEventListener('change', handleReducedMotionChange);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(buffer);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" style={{ mixBlendMode: 'normal' }} />;
}
