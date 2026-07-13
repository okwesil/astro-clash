// KAPLAY passes these utility uniforms automatically
uniform float u_time;

// Curvature calculation function
vec2 curve(vec2 uv) {
    uv = (uv - 0.5) * 2.0;       // Remap UV coordinates to [-1.0, 1.0]
    uv.x *= 1.0 + (uv.y * uv.y) * 0.001; // Adjust X distortion intensity
    uv.y *= 1.0 + (uv.x * uv.x) * 0.001; // Adjust Y distortion intensity
    uv = (uv / 2.0) + 0.5;       // Remap back to [0.0, 1.0]
    return uv * 0.92 + 0.04;     // Slightly scale down to fit boundaries
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    // Apply the CRT curvature to our texture coordinates
    // vec2 curvedUV = curve(uv);
    vec2 curvedUV = uv;

    // Return a clear transparent pixel if coordinates are warped off-screen
    if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    // Sample the game's actual display canvas texture
    vec4 baseColor = texture2D(tex, curvedUV);

    // Calculate scanlines based on the Y position
    float scanline = sin(curvedUV.y * 1200.0) * 0.05; 
    baseColor.rgb -= scanline;

    // Apply a vignette/shadow gradient near screen frame borders
    float vignette = curvedUV.x * curvedUV.y * (1.0 - curvedUV.x) * (1.0 - curvedUV.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    baseColor.rgb *= vignette;

    // Keep the original alpha layer intact
    return vec4(baseColor.rgb, baseColor.a) * color;
}
