import{i as w,S as b,a as o,o as R,b as P,d as x,s as h,c as O,e as c,g as m,f as y,h as S,u as T,j as E}from"./runtime.ClfCI7Wp.js";import{U as u}from"./disclose-version.DNvZvYDK.js";function _(e,t=null,s){if(typeof e=="object"&&e!=null&&!w(e)&&!(b in e)){if(o in e){const n=e[o];if(n.t===e||n.p===e)return n.p}const i=E(e);if(i===R||i===P){const n=new Proxy(e,I);return x(e,o,{value:{s:new Map,v:h(0),a:O(e),p:n,t:e},writable:!0,enumerable:!1}),n}}return e}function g(e,t=1){c(e,e.v+t)}const I={defineProperty(e,t,s){if(s.value){const i=e[o],n=i.s.get(t);n!==void 0&&c(n,_(s.value,i))}return Reflect.defineProperty(e,t,s)},deleteProperty(e,t){const s=e[o],i=s.s.get(t),n=s.a,f=delete e[t];if(n&&f){const a=s.s.get("length"),l=e.length-1;a!==void 0&&a.v!==l&&c(a,l)}return i!==void 0&&c(i,u),f&&g(s.v),f},get(e,t,s){var f;if(t===o)return Reflect.get(e,o);const i=e[o];let n=i.s.get(t);if(n===void 0&&(!(t in e)||(f=m(e,t))!=null&&f.writable)&&(n=h(_(e[t],i)),i.s.set(t,n)),n!==void 0){const a=y(n);return a===u?void 0:a}return Reflect.get(e,t,s)},getOwnPropertyDescriptor(e,t){const s=Reflect.getOwnPropertyDescriptor(e,t);if(s&&"value"in s){const n=e[o].s.get(t);n&&(s.value=y(n))}return s},has(e,t){var f;if(t===o)return!0;const s=e[o],i=Reflect.has(e,t);let n=s.s.get(t);return(n!==void 0||S!==null&&(!i||(f=m(e,t))!=null&&f.writable))&&(n===void 0&&(n=h(i?_(e[t],s):u),s.s.set(t,n)),y(n)===u)?!1:i},set(e,t,s,i){const n=e[o];let f=n.s.get(t);f===void 0&&(T(()=>i[t]),f=n.s.get(t)),f!==void 0&&c(f,_(s,n));const a=n.a,l=!(t in e);if(a&&t==="length")for(let r=s;r<e.length;r+=1){const d=n.s.get(r+"");d!==void 0&&c(d,u)}if(e[t]=s,l){if(a){const r=n.s.get("length"),d=e.length;r!==void 0&&r.v!==d&&c(r,d)}g(n.v)}return!0},ownKeys(e){const t=e[o];return y(t.v),Reflect.ownKeys(e)}};export{_ as p};
