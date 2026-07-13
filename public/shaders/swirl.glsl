// Swirling noise shader
// Usage: provide u_resolution (vec2) and u_time (float) uniforms. Sample with UV coords in 0..1.

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 base;
uniform vec3 highlight;

// Simple hash-based noise returning 0..1
float noise(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Bicubic-like smooth interpolation of grid noise
float smoothNoise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

// Fractional Brownian Motion with animated offset per octave
float fbm(in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < NUM_OCTAVES; i++) {
        // small time-driven offset to make the texture slowly evolve
        value += amplitude * smoothNoise(st * frequency + vec2(u_time * 0.05));
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// 2D rotation
vec2 rotateZ(vec2 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

// Swirl coordinates around center (0.5, 0.5)
// - time drives a global rotation
// - strength controls the amount of local twisting
// - falloff reduces rotation with radius
vec2 swirlCoords(vec2 uv, float time, float strength) {
    vec2 c = vec2(0);
    vec2 v = uv - c;
    float r = length(v);
    // smooth falloff: full effect near center, decays toward radius ~0.8
    float fall = 1.0 - smoothstep(0.0, 0.8, r);
    // compute angle: base rotation from time + radius-weighted swirl
    float angle = time * 0.2 + strength * fall * (0.8 - r) * 6.0;
    return c + rotateZ(v, angle);
}

// Main fragment entry: expected signature depends on host; here 'frag' follows previous file's convention
vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    // canonical sampling coords in 0..1
    vec2 st = pos.xy;

    // configure swirl
    float swirlStrength = 0.5;
    vec2 sw = swirlCoords(st, u_time, swirlStrength);

    // scale sample space to make features larger/smaller
    vec2 sample = (sw - 0.5) * 3.0 + 0.5;

    // compute noise
    float n = fbm(sample);

    // color mapping: base blue blended toward warm highlights based on noise
    float wave = sin(u_time) * .3 + .7;
    vec3 fragColor = mix(base * (0.5 + n * 0.8), highlight, smoothstep(0.2, 0.9, n));

    return vec4(fragColor, 1);
}
