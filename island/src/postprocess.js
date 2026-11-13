import * as THREE from 'three';
import { INK } from './materials.js';

// 法線／深度圖的總像素上限：超過就降低超取樣倍率，避免高解析度螢幕太吃顯示卡
const SS_PIXEL_BUDGET = 12e6;

/* ---------- 描邊後製 ----------
 * 1. 色彩 pass：所有 layer（含影子）畫到 colorRT
 * 2. 法線＋深度 pass：只畫 layer 0（影子不畫），用 MeshNormalMaterial 覆蓋，
 *    解析度是畫面的 1～2 倍（超取樣）
 * 3. 合成：在法線／深度變化大的地方畫上黑線。邊緣判斷式與 iso-demo.html 相同，
 *    只是每個像素取 4 個子樣本平均，線條邊緣平滑但不會糊
 */
export function createOutline(camera) {
  const colorRT = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
  const normalRT = new THREE.WebGLRenderTarget(1, 1);
  normalRT.depthTexture = new THREE.DepthTexture(1, 1);
  normalRT.depthTexture.type = THREE.UnsignedIntType;
  const normalMat = new THREE.MeshNormalMaterial();

  const post = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: colorRT.texture }, tNormal: { value: normalRT.texture }, tDepth: { value: normalRT.depthTexture },
      res: { value: new THREE.Vector2(1, 1) }, thick: { value: 1.4 },
      near: { value: camera.near }, far: { value: camera.far }, lineColor: { value: new THREE.Color(INK) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      uniform sampler2D tColor, tNormal, tDepth; uniform vec2 res; uniform float thick, near, far; uniform vec3 lineColor;
      varying vec2 vUv;
      float D(vec2 uv){ return near + texture2D(tDepth, uv).x * (far - near); }
      vec3 N(vec2 uv){ return texture2D(tNormal, uv).xyz; }
      float edge(vec2 uv){
        vec2 a = vec2(thick / res.x, 0.), b = vec2(0., thick / res.y);
        float d0 = D(uv); vec3 n0 = N(uv);
        float lap = abs(D(uv - a) + D(uv + a) + D(uv - b) + D(uv + b) - 4. * d0);
        float nd = distance(N(uv - a), n0) + distance(N(uv + a), n0) + distance(N(uv - b), n0) + distance(N(uv + b), n0);
        return max(smoothstep(.18, .4, lap), smoothstep(.3, .6, nd));
      }
      void main(){
        vec2 px = 1. / res;
        float e = .25 * (edge(vUv + px * vec2( .125,  .375)) + edge(vUv + px * vec2(-.375,  .125))
                       + edge(vUv + px * vec2( .375, -.125)) + edge(vUv + px * vec2(-.125, -.375)));
        vec3 c = texture2D(tColor, vUv).rgb;
        gl_FragColor = vec4(mix(c, lineColor, e), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });

  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

  return {
    /** w, h 為實際像素（已乘上 pixelRatio） */
    setSize(w, h) {
      const ss = THREE.MathUtils.clamp(Math.sqrt(SS_PIXEL_BUDGET / (w * h)), 1, 2);
      colorRT.setSize(w, h);
      normalRT.setSize(Math.round(w * ss), Math.round(h * ss));
      post.uniforms.res.value.set(w, h);
    },
    /** thick 為實際像素粗細（已乘上 pixelRatio） */
    render(renderer, scene, cam, thick) {
      post.uniforms.thick.value = thick;

      cam.layers.enableAll();
      renderer.setRenderTarget(colorRT); renderer.render(scene, cam);

      cam.layers.set(0);
      const bg = scene.background;
      scene.background = null; scene.overrideMaterial = normalMat; renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(normalRT); renderer.render(scene, cam);
      scene.overrideMaterial = null; scene.background = bg; cam.layers.enableAll();

      renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    },
  };
}
