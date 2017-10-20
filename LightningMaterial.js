function makeLightningMaterial() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: {value: 0},
      length: {value: 1},
      intensity: {value: 1},
      r: {value: 1},
      g: {value: 1},
      b: {value: 1},
    },
    vertexShader: lightningMaterialVertexShader,
    fragmentShader: lightningMaterialFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  return material;
}

const lightningMaterialVertexShader = `
uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
      vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const lightningMaterialFragmentShader = `
/* Simplex code license
 * This work is licensed under a 
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *  - You must attribute the work in the source code 
 *    (link to https://www.shadertoy.com/view/XsX3zB).
 *  - You may not use this work for commercial purposes.
 *  - You may distribute a derivative work only under the same license.
 */

varying vec2 vUv;
uniform float time;
uniform float intensity;
uniform float length;
uniform float r;
uniform float g;
uniform float b;

/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r-0.5;
}

/* skew constants for 3d simplex functions */
const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
     /* 1. find current tetrahedron T and it's four vertices */
     /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
     /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
     
     /* calculate s and x */
     vec3 s = floor(p + dot(p, vec3(F3)));
     vec3 x = p - s + dot(s, vec3(G3));
     
     /* calculate i1 and i2 */
     vec3 e = step(vec3(0.0), x - x.yzx);
     vec3 i1 = e*(1.0 - e.zxy);
     vec3 i2 = 1.0 - e.zxy*(1.0 - e);
        
     /* x1, x2, x3 */
     vec3 x1 = x - i1 + G3;
     vec3 x2 = x - i2 + 2.0*G3;
     vec3 x3 = x - 1.0 + 3.0*G3;
     
     /* 2. find four surflets and store them in d */
     vec4 w, d;
     
     /* calculate surflet weights */
     w.x = dot(x, x);
     w.y = dot(x1, x1);
     w.z = dot(x2, x2);
     w.w = dot(x3, x3);
     
     /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
     w = max(0.6 - w, 0.0);
     
     /* calculate surflet components */
     d.x = dot(random3(s), x);
     d.y = dot(random3(s + i1), x1);
     d.z = dot(random3(s + i2), x2);
     d.w = dot(random3(s + 1.0), x3);
     
     /* multiply d by w^4 */
     w *= w;
     w *= w;
     d *= w;
     
     /* 3. return the sum of the four surflets */
     return dot(d, vec4(52.0));
}

float noise(vec3 m) {
    return   0.5333333*simplex3d(m)
            +0.2666667*simplex3d(2.0*m)
            +0.1333333*simplex3d(4.0*m)
            +0.0666667*simplex3d(8.0*m);
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.;
 
  uv.y /= 16.;
  uv.x /= 512.;
  uv.x *= length;
  vec2 p = uv;
  p.x = p.x / 16. * 9.;
  vec3 p3 = vec3(p, time*0.4);    
    
  float intensity = noise(vec3(p3*12.0+12.0));
  intensity *= 0.3;
  intensity *= min(4., length / 256.);
                          
  float t = clamp((uv.x * -uv.x * 0.16) + 0.15, 0., 1.);                         
  float y = abs(intensity * -t + uv.y);
    
  float g = pow(y, 0.2);
                          
  vec3 col = vec3(1., 1., 1.) * 1.5;
  col = col * -g + col;                    
  col = col * col;
  col = col * col;

  float alpha = max(1. - abs(uv.x) / length * 512., 0.);
  alpha *= max(1. - abs(uv.y) * 32. , 0.);
  alpha *= col.x;

  col.r *= r;
  col.g *= g;
  col.b *= b;
                          
  gl_FragColor= vec4(col, alpha);
}
`;
