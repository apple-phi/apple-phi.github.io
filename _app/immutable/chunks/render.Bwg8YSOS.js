import{e as k,s as y,a as D,l as T,c as L,m as A,r as N,d as Y}from"./disclose-version.CN4ZfPpk.js";import{X as $,i as C,Y as O,a as H,Z as g,_ as I,$ as M,a0 as P,a1 as w,d as V,u as q,y as B,R as W}from"./runtime.Dx8h6bNH.js";function R(e,n){var b;var s=e.ownerDocument,o=n.type,a=((b=n.composedPath)==null?void 0:b.call(n))||[],r=a[0]||n.target,_=0,d=n.__root;if(d){var c=a.indexOf(d);if(c!==-1&&(e===document||e===window)){n.__root=e;return}var v=a.indexOf(e);if(v===-1)return;c<=v&&(_=c)}if(r=a[_]||n.target,r!==e){$(n,"currentTarget",{configurable:!0,get(){return r||s}});try{for(var i,f=[];r!==null;){var l=r.parentNode||r.host||null;try{var t=r["__"+o];if(t!==void 0&&!r.disabled)if(C(t)){var[h,...u]=t;h.apply(r,[n,...u])}else t.call(r,n)}catch(p){i?f.push(p):i=p}if(n.cancelBubble||l===e||l===null)break;r=l}if(i){for(let p of f)queueMicrotask(()=>{throw p});throw i}}finally{n.__root=e,r=e}}}const X=new Set,E=new Set;function F(e,n){(e.__t??(e.__t=e.nodeValue))!==n&&(e.nodeValue=e.__t=n)}function G(e,n,s,o){n===void 0||n(e,s)}function Z(e,n){const s=n.anchor??n.target.appendChild(k());return O(()=>S(e,{...n,anchor:s}),!1)}function J(e,n){const s=n.target,o=Y;try{return O(()=>{y(!0);for(var a=s.firstChild;a&&(a.nodeType!==8||a.data!==H);)a=a.nextSibling;if(!a)throw g;const r=D(a),_=S(e,{...n,anchor:r});return y(!1),_},!1)}catch(a){if(a===g)return n.recover===!1&&I(),T(),L(s),y(!1),Z(e,n);throw a}finally{y(!!o),A(o),N()}}function S(e,{target:n,anchor:s,props:o={},events:a,context:r,intro:_=!1}){T();const d=new Set,c=R.bind(null,n),v=R.bind(null,document),i=t=>{for(let h=0;h<t.length;h++){const u=t[h];d.has(u)||(d.add(u),n.addEventListener(u,c,w.includes(u)?{passive:!0}:void 0),document.addEventListener(u,v,w.includes(u)?{passive:!0}:void 0))}};i(M(X)),E.add(i);let f;const l=P(()=>(V(()=>{if(r){q({});var t=W;t.c=r}a&&(o.$$events=a),f=e(s,o)||{},r&&B()}),()=>{for(const t of d)n.removeEventListener(t,c),document.removeEventListener(t,c);E.delete(i),m.delete(f)}));return m.set(f,l),f}let m=new WeakMap;function K(e){const n=m.get(e);n==null||n()}export{G as a,J as h,Z as m,F as s,K as u};