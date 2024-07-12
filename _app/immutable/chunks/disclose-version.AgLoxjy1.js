import{G as B,i as V,q as Y,d as $,_ as F,f as C,$ as P,a0 as q,a1 as G,a2 as W,e as K,B as Q,C as Z,c as j}from"./runtime.BWBH7bGR.js";function z(e){console.warn("hydration_mismatch")}const ce=1,de=2,fe=4,le=8,_e=16,he=64,pe=1,me=2,ve=4,Ee=8,ye=1,Te=2,Ie=4,J=1,X=2,b="[",ee="[!",M="]",A={},Se=Symbol(),ge=["beforeinput","click","change","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"],ne=["touchstart","touchmove","touchend"],Ae={formnovalidate:"formNoValidate",ismap:"isMap",nomodule:"noModule",playsinline:"playsInline",readonly:"readOnly"};function we(e,n="exclude-on"){return e.endsWith("capture")?n=="exclude-on"?e!=="gotpointercapture"&&e!=="lostpointercapture":e!=="ongotpointercapture"&&e!=="onlostpointercapture":!1}let s=!1;function g(e){s=e}let i;function v(e){return i=e}function R(){return i=i.nextSibling}function Ne(e){s&&(i=e)}function Ce(){s&&R()}function be(){for(var e=0,n=i;;){if(n.nodeType===8){var t=n.data;if(t===M){if(e===0)return n;e-=1}else(t===b||t===ee)&&(e+=1)}var o=n.nextSibling;n.remove(),n=o}}var L,te;function H(){if(L===void 0){L=window,te=document;var e=Element.prototype;e.__click=void 0,e.__className="",e.__attributes=null,e.__e=void 0,Text.prototype.__t=void 0}}function E(){return document.createTextNode("")}function Re(e){if(!s)return e.firstChild;var n=i.firstChild;return n===null&&(n=i.appendChild(E())),v(n),n}function Oe(e,n){if(!s){var t=e.firstChild;return t instanceof Comment&&t.data===""?t.nextSibling:t}return i}function Le(e,n=!1){if(!s)return e.nextSibling;var t=i.nextSibling,o=t.nodeType;if(n&&o!==3){var r=E();return t==null||t.before(r),v(r),r}return v(t),t}function re(e){e.textContent=""}function De(e,n,t,o){function r(a){if(o.capture||T.call(n,a),!a.cancelBubble)return t.call(this,a)}return e.startsWith("pointer")||e==="wheel"?Y(()=>{n.addEventListener(e,r,o)}):n.addEventListener(e,r,o),r}function Pe(e){for(var n=0;n<e.length;n++)k.add(e[n]);for(var t of w)t(e)}function T(e){var O;var n=this,t=n.ownerDocument,o=e.type,r=((O=e.composedPath)==null?void 0:O.call(e))||[],a=r[0]||e.target,u=0,_=e.__root;if(_){var f=r.indexOf(_);if(f!==-1&&(n===document||n===window)){e.__root=n;return}var p=r.indexOf(n);if(p===-1)return;f<=p&&(u=f)}if(a=r[u]||e.target,a!==n){B(e,"currentTarget",{configurable:!0,get(){return a||t}});try{for(var y,c=[];a!==null;){var m=a.parentNode||a.host||null;try{var d=a["__"+o];if(d!==void 0&&!a.disabled)if(V(d)){var[I,...U]=d;I.apply(a,[e,...U])}else d.call(a,e)}catch(S){y?c.push(S):y=S}if(e.cancelBubble||m===n||m===null)break;a=m}if(y){for(let S of c)queueMicrotask(()=>{throw S});throw y}}finally{e.__root=n,a=n}}}let l;function ae(){l=void 0}function Me(e){let n=null,t=s;var o;if(s){for(n=i,l===void 0&&(l=document.head.firstChild);l.nodeType!==8||l.data!==b;)l=l.nextSibling;l=v(l.nextSibling)}else o=document.head.appendChild(E());try{$(()=>e(o),F)}finally{t&&v(n)}}function oe(e){var n=document.createElement("template");return n.innerHTML=e,n.content}function h(e,n){var t;(t=C).nodes??(t.nodes={start:e,end:n})}function He(e,n){var t=(n&J)!==0,o=(n&X)!==0,r,a=!e.startsWith("<!>");return()=>{if(s)return h(i,null),i;r||(r=oe(a?e:"<!>"+e),t||(r=r.firstChild));var u=o?document.importNode(r,!0):r.cloneNode(!0);if(t){var _=u.firstChild,f=u.lastChild;h(_,f)}else h(u,u);return u}}function ke(){if(!s){var e=E();return h(e,e),e}var n=i;return n.nodeType!==3&&(n.before(n=E()),v(n)),h(n,n),n}function xe(){if(s)return h(i,null),i;var e=document.createDocumentFragment(),n=document.createComment(""),t=E();return e.append(n,t),h(n,t),e}function Ue(e,n){if(s){C.nodes.end=i,R();return}e!==null&&e.before(n)}const k=new Set,w=new Set;let D=!0;function Be(e,n){(e.__t??(e.__t=e.nodeValue))!==n&&(e.nodeValue=e.__t=n)}function ie(e,n){const t=n.anchor??n.target.appendChild(E());return P(()=>x(e,{...n,anchor:t}),!1)}function Ve(e,n){n.intro=n.intro??!1;const t=n.target,o=s;try{return P(()=>{for(var r=t.firstChild;r&&(r.nodeType!==8||r.data!==b);)r=r.nextSibling;if(!r)throw A;g(!0),v(r),R();const a=x(e,{...n,anchor:r});if(i.nodeType!==8||i.data!==M)throw z(),A;return g(!1),a},!1)}catch(r){if(r===A)return n.recover===!1&&q(),H(),re(t),g(!1),ie(e,n);throw r}finally{g(o),ae()}}function x(e,{target:n,anchor:t,props:o={},events:r,context:a,intro:u=!0}){H();const _=new Set,f=c=>{for(let m=0;m<c.length;m++){const d=c[m],I=ne.includes(d);_.has(d)||(_.add(d),n.addEventListener(d,T,{passive:I}),document.addEventListener(d,T,{passive:I}))}};f(G(k)),w.add(f);let p;const y=W(()=>(K(()=>{if(a){Q({});var c=j;c.c=a}r&&(o.$$events=r),s&&h(t,null),D=u,p=e(t,o)||{},D=!0,s&&(C.nodes.end=i),a&&Z()}),()=>{for(const c of _)n.removeEventListener(c,T),document.removeEventListener(c,T);w.delete(f),N.delete(p)}));return N.set(p,y),p}let N=new WeakMap;function Ye(e){const n=N.get(e);n==null||n()}const se="5";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(se);export{te as $,we as A,De as B,Pe as C,Ae as D,ce as E,ge as F,Ve as G,ee as H,ie as I,Ye as J,xe as K,ke as L,z as M,A as N,h as O,ve as P,oe as Q,D as R,Te as S,ye as T,Se as U,Ie as V,Ue as a,Be as b,Re as c,s as d,E as e,Oe as f,v as g,Me as h,R as i,be as j,g as k,i as l,M as m,de as n,he as o,re as p,le as q,Ne as r,Le as s,He as t,_e as u,fe as v,Ce as w,pe as x,me as y,Ee as z};
