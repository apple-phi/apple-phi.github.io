import{h as M,$ as O,a as f,t as x,r as t,c as e,s as a}from"../chunks/disclose-version.EaiUMsAl.js";import{p as T,b as I,t as j,z as r}from"../chunks/runtime.BQ8WZnHu.js";import{s as g}from"../chunks/render.Di-ONyUO.js";import{p as L,i as N}from"../chunks/props.VLkrq2JZ.js";import{e as q,i as A}from"../chunks/each.btd0aGUN.js";import{s as k}from"../chunks/attributes.CCOGMqgo.js";import{i as C}from"../chunks/lifecycle.wgvwceg6.js";import{B as D}from"../chunks/BasicSection.Cstib1d9.js";import{l as E}from"../chunks/label-iconoir.Ddz0JbTV.js";const F=!0,G=async({url:l,fetch:o})=>({items:await(await o(`${l.origin}/projects/items.json`)).json()}),st=Object.freeze(Object.defineProperty({__proto__:null,load:G,prerender:F},Symbol.toStringTag,{value:"Module"}));var H=x('<div class="flex items-center"><img class="inline-block h-6 w-6" alt="Tag icon"> <p class="ml-1 text-xs text-gray-500"> </p></div>'),J=x('<li class="rounded-2xl transition-transform hover:scale-[1.02]"><a class="block"><article><h2 class="inline-block text-pretty bg-stone-50 text-2xl font-semibold text-orange-600 hover:underline"> </h2> <h3 class="text-md mt-2 inline-block text-pretty bg-stone-50 !leading-relaxed text-gray-700"> </h3> <div class="mt-6 flex gap-6"><!></div></article></a></li>'),K=x('<ul class="space-y-4 pt-5 sm:space-y-8 sm:pt-10"></ul>');function rt(l,o){T(o,!1);let h=L(o,"data");C(),M(n=>{O.title="Projects | Lucas Ng"}),D(l,{title:"My projects",children:(n,Q)=>{var c=K();q(c,9,()=>h().items,A,(w,s,R)=>{var m=J(),p=e(m),b=e(p),d=e(b),P=e(d);t(d);var v=a(a(d,!0)),S=e(v);t(v);var _=a(a(v,!0)),z=e(_);N(z,()=>{var i;return((i=r(s).tags)==null?void 0:i.length)>0},i=>{var u=H(),$=e(u);k($,"src",E);var y=a(a($,!0)),B=e(y);j(()=>g(B,r(s).tags.join(", "))),t(y),t(u),f(i,u)}),t(_),t(b),t(p),t(m),j(()=>{k(p,"href",`/projects/${r(s).slug??""}`),g(P,r(s).title),g(S,r(s).subtitle)}),f(w,m)}),t(c),f(n,c)},$$slots:{default:!0},$$legacy:!0}),I()}export{rt as component,st as universal};