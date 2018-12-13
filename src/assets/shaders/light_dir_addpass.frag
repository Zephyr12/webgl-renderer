#version 300 es

precision mediump float;

in vec2 f_texcoord;

/* world parameters */
uniform sampler2D diffuse_tex;
uniform sampler2D gbuffer;
uniform sampler2D mat_buffer;

/* camera parameters */
uniform mat4 proj;
uniform mat4 view;

/* light parameters (directional) */
uniform vec4 l;
uniform vec3 col;
uniform float intensity;

uniform mat4 shadow_map_model;
uniform mat4 shadow_map_projection;
uniform sampler2D shadow_map;

out vec4 c;

float variance_filter(vec2 moments, float depth, float n_dot_l){
    // https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch08.html
    float g_MinVariance = 1.0;
    float t = 1.0 - depth;
    // One-tailed inequality valid if t > Moments.x
    float p = float(t <= moments.x);
    // Compute variance.
    float variance = moments.y - (moments.x*moments.x);
    variance = max(variance, g_MinVariance);
    // Compute probabilistic upper bound.
    float d = t - moments.x;
    float p_max = variance / (variance + d*d);
    return max(p, p_max);
}

vec3 reconstruct_normal(vec2 n) {
    return vec3(n, sqrt(1.0 - dot(n, n)));
}

float dist_ggx(float n_dot_h, float alpha) {
    float n = (alpha * alpha);
    float d = (n_dot_h * n_dot_h * (n - 1.0)) + 1.0;
    return n / (3.1415 * d * d);
}

float geo_ggx_1(float dot_product, float roughness) {
    //float k = roughness * sqrt(2.0) / 3.1415;
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    float d = dot_product * (1.0-k) + k;
    return dot_product / (d*d);
}

float geo_ggx(float n_dot_l, float n_dot_v, float roughness) {
    return geo_ggx_1(n_dot_l, roughness) * geo_ggx_1(n_dot_v, roughness);
}

float fres_unreal(float v_dot_h, float f_0) {
    return f_0 + (1.0 - f_0) * exp2((-5.55473 * (v_dot_h) - 6.98316) *(v_dot_h));
}


void main(){
    vec4 d = texture(diffuse_tex, f_texcoord);
    vec4 g = texture(gbuffer, f_texcoord);
    vec4 m = texture(mat_buffer, f_texcoord);
    float roughness   = m.g;
    float metalness   = m.b;
    vec3 n = reconstruct_normal(g.xy);
    vec3 l_clip = (proj * view * normalize(l)).xyz;

    vec4 world_space_pos =  (inverse(proj) * vec4(f_texcoord.xy * 2.0 - 1.0, 0, 1));
    world_space_pos.xyz *= g.b;
    world_space_pos.z = -g.b;
    world_space_pos.w = 1.0;
    vec4 v_world = world_space_pos;
    //vec3 v = -normalize(v_world.xyz);
    vec2 texcoord_n = f_texcoord * 2.0 - 1.0;
    //vec3 v = -normalize(vec3(texcoord_n, -sqrt(max(0.0, 1.0-dot(texcoord_n.xy, texcoord_n.xy)))));//-normalize(v_world.xyz);
    vec3 v = -normalize(vec3(texcoord_n, -1));
    vec3 h = normalize(normalize(l_clip) + normalize(v));
    world_space_pos = inverse(view) * world_space_pos;
    vec4 light_space_pos = shadow_map_projection * (shadow_map_model) * world_space_pos;
    //light_space_pos.z = light_space_pos.z * 0.5 + 0.5;
    vec2 shadow_sample = texture(shadow_map,  light_space_pos.xy * 0.5 + 0.5, 2.0).xy;
    light_space_pos.z  *= 0.5;
    light_space_pos.z  += 0.5;

    float n_dot_l = dot(normalize(n), normalize(l_clip));
    float n_dot_h = dot(normalize(n), normalize(h));
    float n_dot_v = dot(normalize(n), normalize(v));

    vec3 diffuse = d.xyz * max(n_dot_l, 0.0);

    float alpha = roughness;

    float geo = max(geo_ggx(n_dot_l, n_dot_v, roughness), 0.0);

    float dist = max(dist_ggx(dot(n, h), alpha), 0.0);

    float f_0 = mix(0.1, 0.8, metalness);

    float fres = max(fres_unreal(dot(n, v), f_0), 0.0);

    float cook_torr = (geo * dist * fres) / (2.0 * dot(n, l_clip) * dot(n, v));
    // shadow_sample.x * 100.0
    //c = vec4(sign(max((shadow_sample.x - light_space_pos.z + 0.01),0.0)),0,0, 1.0);
    //float shaded = 1.0 - clamp((light_space_pos.z <= shadow_sample.x + 0.005 ? 0.0 : 1.0),0.0, 1.0);
    float shaded = variance_filter(shadow_sample, light_space_pos.z, n_dot_l);
    vec3 spec = mix(vec3(1), d.xyz, metalness) * cook_torr;
    c = vec4(mix(diffuse, spec, f_0) * intensity * col * shaded, 1);
    //*/
}
