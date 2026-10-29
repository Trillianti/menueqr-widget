export const styles = `
:host{font:400 14px/1.5 system-ui,sans-serif;color:#1d2722;color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
button,a{-webkit-tap-highlight-color:transparent}
button{font:inherit;cursor:pointer}button:disabled{cursor:default}
button:focus-visible,a:focus-visible{outline:2px solid #fff;outline-offset:2px;box-shadow:0 0 0 5px #1d2722}
.trigger{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:1px solid transparent;border-radius:10px;padding:14px 20px;min-height:48px;max-width:calc(100vw - 32px);font:600 14px/1.4 system-ui,sans-serif;background:var(--mw-color);color:var(--mw-foreground)}
.icon{display:block;width:20px;height:20px;flex:none}
.close-icon{position:absolute;top:calc(50% - 10px);left:calc(50% - 10px);opacity:0;pointer-events:none}
.trigger-label{white-space:nowrap}
.trigger[data-mode=button]{transition:border-color 120ms linear,box-shadow 120ms linear}
.trigger[data-mode=button]:not(:disabled):active:not(:focus-visible){box-shadow:inset 0 0 0 1px currentColor}
@media(hover:hover){.trigger[data-mode=button]:not(:disabled):hover:not(:focus-visible){border-color:color-mix(in srgb,currentColor 20%,transparent);box-shadow:0 4px 12px #101b1414}}
.trigger[data-mode=floating]{position:fixed;bottom:max(var(--mw-offset-y),env(safe-area-inset-bottom));right:var(--mw-offset-x);border-radius:100px;z-index:99990}
.trigger[data-mode=floating][data-side=left]{right:auto;left:var(--mw-offset-x)}
.trigger[data-mode=floating]>.trigger-label{min-width:0;overflow:hidden;text-overflow:ellipsis}
.trigger[data-mode=tab]{position:fixed;top:50%;right:0;transform:translateY(-50%);writing-mode:vertical-rl;width:48px;padding:18px 8px 18px 16px;border:0;border-radius:10px 0 0 10px;background:transparent;overflow:hidden;isolation:isolate;z-index:99990}
.trigger[data-mode=tab][data-side=left]{right:auto;left:0;padding-left:8px;padding-right:16px;border-radius:0 10px 10px 0}
.trigger[data-mode=tab]::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--mw-color);transform:scaleX(.8333333333);transform-origin:right center}
.trigger[data-mode=tab][data-side=left]::before{transform-origin:left center}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]::before{transform:scaleX(1)}
dialog{position:fixed;inset:0;margin:auto;padding:0;border:0;border-radius:20px;width:min(480px,calc(100vw - 32px));height:min(800px,90dvh);max-width:none;max-height:none;overflow:hidden;background:#fff;color:#1d2722;box-shadow:0 24px 100px #0003}
dialog::backdrop{background:#101b1480}
dialog.button-modal{opacity:0;animation:none;transition:opacity 150ms linear;overscroll-behavior:contain}
dialog.button-modal::backdrop{opacity:0;transition:opacity 150ms linear}
dialog.button-modal[data-state=open],dialog.button-modal[data-state=open]::backdrop{opacity:1}
dialog.button-modal>iframe{opacity:0;transition:opacity 150ms linear}
dialog.button-modal[data-state=open][data-loaded]>iframe{opacity:1}
dialog.floating-popover[data-mode=floating]{--mw-floating-width:min(max(440px,var(--mw-launcher-width,0px)),calc(100vw - 32px));--mw-floating-bottom:max(0px,var(--mw-offset-y),env(safe-area-inset-bottom));--mw-floating-edge:clamp(0px,var(--mw-offset-x),calc(100vw - var(--mw-floating-width)));inset:auto var(--mw-floating-edge) var(--mw-floating-bottom) auto;margin:0;width:var(--mw-floating-width);height:max(1px,min(680px,calc(100dvh - var(--mw-floating-bottom) - 16px)));border-radius:0;overflow:visible;background:transparent;box-shadow:none;animation:none;overscroll-behavior:contain}
dialog.floating-popover[data-side=left]{inset:auto auto var(--mw-floating-bottom) var(--mw-floating-edge)}
dialog.floating-popover::backdrop{background:transparent;opacity:0;transition:opacity 150ms linear}
dialog.floating-popover[data-state=open]::backdrop{opacity:1}
.floating-shadow{position:absolute;inset:0;pointer-events:none;border-radius:16px;box-shadow:0 12px 28px #101b1426;opacity:0;transition:opacity 90ms linear;will-change:opacity}
.floating-popover[data-state=open]>.floating-shadow{opacity:1;transition-duration:180ms}
.floating-surface{position:relative;isolation:isolate;width:100%;height:100%;overflow:hidden;border-radius:16px;background:#fff;opacity:0;transition:opacity 150ms linear}
.floating-popover[data-state=open]>.floating-surface{opacity:1}
dialog.floating-popover[data-state=closed]{visibility:hidden}
.floating-popover[data-state=closed],.floating-popover[data-state=closed] *{transition:none}
.floating-surface>iframe{opacity:0;will-change:opacity;backface-visibility:hidden;transition:opacity 90ms linear}
.floating-popover[data-state=open][data-loaded]>.floating-surface>iframe{opacity:1;transition-duration:150ms}
.floating-surface>.close{display:flex;align-items:center;justify-content:center;top:20px;right:16px;border:0;border-radius:8px;background:#fff;padding:0;opacity:1;will-change:opacity;transition:opacity 100ms linear}
.floating-popover[data-close-ready]>.floating-surface>.close{opacity:0;pointer-events:none}
@media(min-width:480px) and (max-width:540px){.floating-surface>.close{right:20px}}
dialog.drawer-shell[data-mode=tab]{--mw-drawer-width:min(480px,calc(100vw - 72px));inset:0;margin:0;width:100vw;height:100dvh;max-width:none;max-height:none;border-radius:0;overflow:visible;background:transparent;box-shadow:none;animation:none;overscroll-behavior:contain}
dialog.drawer-shell::backdrop{background:transparent}
.drawer-scrim{position:absolute;inset:0;background:#101b144d;opacity:0;transition:opacity 180ms linear}
.drawer-panel{position:absolute;inset:0 0 0 auto;width:var(--mw-drawer-width);overflow:hidden;overscroll-behavior:contain;background:#fff;border-radius:18px 0 0 18px;box-shadow:-12px 0 64px #101b141a;opacity:0;transition:opacity 150ms linear}
.drawer-shell[data-side=left]>.drawer-panel{inset:0 auto 0 0;border-radius:0 18px 18px 0;box-shadow:12px 0 64px #101b141a}
.drawer-content{width:100%;height:100%;opacity:0;transition:opacity 150ms linear}
.drawer-shell[data-state=open]>.drawer-scrim,.drawer-shell[data-state=open]>.drawer-panel,.drawer-shell[data-state=open] .drawer-content[data-loaded]{opacity:1}
.drawer-shell>.trigger[data-mode=tab]{height:var(--mw-tab-length);width:var(--mw-tab-width);transition:opacity 150ms linear}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]{width:48px;height:48px;padding:0;border-radius:14px;transform:translate(calc(0px - var(--mw-drawer-width) - 12px),-50%)}
.drawer-shell[data-state=open]>.trigger[data-side=left]{transform:translate(calc(var(--mw-drawer-width) + 12px),-50%)}
.drawer-shell .trigger>.icon,.drawer-shell .trigger>.trigger-label{transition:opacity 150ms linear}
.drawer-shell[data-state=open] .trigger>.icon:not(.close-icon),.drawer-shell[data-state=open] .trigger>.trigger-label{opacity:0}
.drawer-shell[data-state=open] .trigger>.close-icon{opacity:1}
iframe{display:block;border:0;width:100%;height:100%;background:#fff}
.inline{position:relative;height:var(--mw-inline-height);max-width:560px;overflow:hidden;border:1px solid #e2e5df;border-radius:16px;background:#fff}
.fallback{position:absolute;inset:auto 24px 20px;background:#fff;padding:12px;font:14px/1.5 system-ui,sans-serif;text-align:center;color:#1d2722;z-index:2;border-radius:8px}
iframe[hidden]{display:none}
.frame-recovery{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;overflow:auto;padding:64px 24px 32px;background:#fff;text-align:center;font:400 14px/1.6 system-ui,sans-serif;color:#1d2722}
.frame-recovery h2{margin:0;max-width:320px;font-size:22px;line-height:1.2;font-weight:650;letter-spacing:-.4px}
.frame-recovery p{margin:0;max-width:320px;color:#5f6963}
.frame-recovery code{display:block;max-width:100%;padding:8px 12px;border:1px solid #e2e5df;border-radius:8px;background:#f5f6f3;font:12px/1.5 ui-monospace,monospace;overflow-wrap:anywhere;user-select:all}
.recovery-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:100%;margin-top:8px}
.frame-recovery .fallback,.recovery-actions button{position:static;display:inline-flex;align-items:center;justify-content:center;min-height:44px;max-width:100%;padding:10px 14px;border:1px solid #dce1db;border-radius:10px;text-decoration:none;font:600 13px/1.4 system-ui,sans-serif}
.frame-recovery .fallback{background:var(--mw-color);color:var(--mw-foreground);border-color:transparent}
.recovery-actions button{background:#fff;color:#1d2722}
.recovery-settings{margin-top:4px;color:#505c54;text-underline-offset:3px}
.close{position:absolute;top:8px;right:8px;z-index:3;border:1px solid #e2e5df;background:#fff;border-radius:50%;width:36px;height:36px;color:#1d2722;font:24px/1 system-ui,sans-serif}
dialog[data-ready]>.close{display:none}
@media(prefers-reduced-motion:no-preference){dialog{animation:mw-appear 160ms ease-out}@keyframes mw-appear{from{opacity:0}to{opacity:1}}}
@media(prefers-reduced-motion:no-preference){
.floating-popover[data-state=open]>.floating-shadow{transition-delay:200ms}
.floating-surface{opacity:1;border-radius:0;will-change:transform;backface-visibility:hidden;background:transparent;clip-path:inset(var(--mw-capsule-top) var(--mw-capsule-right) var(--mw-capsule-bottom) var(--mw-capsule-left) round var(--mw-capsule-radius));transform:translate3d(var(--mw-capsule-x),var(--mw-capsule-y),0) scale(var(--mw-capsule-scale-x),var(--mw-capsule-scale-y));transition:clip-path 320ms cubic-bezier(.2,0,0,1),transform 320ms cubic-bezier(.2,0,0,1),background-color 220ms linear;transition-delay:0ms,0ms,100ms}
.floating-popover[data-state=open]>.floating-surface{clip-path:inset(0px 0px 0px 0px round 16px);transform:translate3d(0,0,0) scale(1);background:#fff;transition-duration:420ms,420ms,220ms;transition-delay:0ms}
.floating-popover[data-state=open][data-loaded]>.floating-surface>iframe{transition-duration:200ms;transition-delay:220ms}
.trigger[data-mode=button]{transition:transform 150ms ease-out,border-color 120ms linear,box-shadow 120ms linear}
.trigger[data-mode=button]>.icon{transition:transform 150ms cubic-bezier(.2,0,0,1)}
.trigger[data-mode=button]:not(:disabled):active{transform:scale(.96)}
.trigger[data-mode=button]:not(:disabled):active>.icon{transform:scale(.9)}
@media(hover:hover){.trigger[data-mode=button]:not(:disabled):hover:not(:active)>.icon{transform:translateY(-1px) rotate(-6deg)}}
dialog.button-modal{transform:translate(var(--mw-modal-x,0px),var(--mw-modal-y,12px)) scale(.96);transition:opacity 150ms linear,transform 150ms cubic-bezier(.2,0,0,1)}
dialog.button-modal[data-state=open]{transform:translate(0,0) scale(1);transition-duration:200ms,300ms}
dialog.button-modal[data-state=closing]{transform:translate(var(--mw-modal-exit-x,0px),var(--mw-modal-exit-y,8px)) scale(.98)}
dialog.button-modal[data-state=open][data-loaded]>iframe{transition-duration:220ms;transition-delay:70ms}
.drawer-panel{transform:translateX(calc(100% + 12px));transition:transform 300ms cubic-bezier(.2,0,0,1),opacity 180ms linear}
.drawer-shell[data-side=left]>.drawer-panel{transform:translateX(calc(-100% - 12px))}
.drawer-shell[data-state=open]>.drawer-panel{transform:translateX(0);transition-duration:360ms,180ms}
.drawer-shell>.trigger[data-mode=tab]{transition:transform 300ms cubic-bezier(.2,0,0,1),height 300ms cubic-bezier(.2,0,0,1),width 300ms cubic-bezier(.2,0,0,1),padding 300ms cubic-bezier(.2,0,0,1),border-radius 300ms cubic-bezier(.2,0,0,1)}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]{transition-duration:360ms}
.drawer-shell>.trigger[data-mode=tab]::before{transition:transform 300ms cubic-bezier(.2,0,0,1)}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]::before{transition-duration:360ms}
.drawer-shell .trigger>.icon,.drawer-shell .trigger>.trigger-label{transition:opacity 300ms cubic-bezier(.2,0,0,1),transform 300ms cubic-bezier(.2,0,0,1),filter 300ms cubic-bezier(.2,0,0,1)}
.drawer-shell .trigger>.close-icon{transform:scale(.25);filter:blur(4px)}
.drawer-shell[data-state=open] .trigger>.icon:not(.close-icon),.drawer-shell[data-state=open] .trigger>.trigger-label{transform:scale(.25);filter:blur(4px)}
.drawer-shell[data-state=open] .trigger>.close-icon{transform:scale(1);filter:blur(0)}
.drawer-content{transform:translateY(8px);filter:blur(2px);transition:opacity 150ms linear,transform 150ms cubic-bezier(.2,0,0,1),filter 150ms linear}
.drawer-shell[data-state=open] .drawer-content[data-loaded]{transform:translateY(0);filter:blur(0);transition-duration:300ms;transition-delay:90ms}
}
@media(max-width:540px){
.mobile-hidden{display:none!important}
dialog[data-mode],dialog[data-mode][data-side]{inset:0;width:100%;height:100dvh;margin:0;border-radius:0}
dialog[data-mode]::backdrop{background:#101b1480}
dialog.floating-popover[data-mode=floating]{inset:0;width:100%;height:100dvh}
dialog.floating-popover::backdrop{background:transparent}
.floating-surface,.floating-shadow{border-radius:0}
.trigger[data-mode=floating],.trigger[data-mode=tab],.trigger[data-mode=tab][data-side=left]{top:auto;bottom:max(var(--mw-offset-y),env(safe-area-inset-bottom));right:var(--mw-offset-x);left:auto;width:auto;writing-mode:horizontal-tb;transform:none;padding:14px 18px;border-radius:100px}
.trigger[data-mode=floating][data-side=left],.trigger[data-mode=tab][data-side=left]{left:var(--mw-offset-x);right:auto}
.trigger[data-mode=tab]::before,.trigger[data-mode=tab][data-side=left]::before{transform:none;border-radius:inherit}
.drawer-shell>.trigger[data-mode=tab]::before{background:#fff;border:1px solid #e2e5df;transform:none}
dialog.drawer-shell[data-mode=tab]{--mw-drawer-width:100vw}
dialog.drawer-shell[data-mode=tab]::backdrop{background:transparent}
.drawer-panel,.drawer-shell[data-side=left]>.drawer-panel{bottom:0;border-radius:0}
.drawer-content{position:absolute;inset:calc(max(12px,env(safe-area-inset-top)) + 52px) 0 0;height:auto}
.drawer-shell>.trigger[data-mode=tab],.drawer-shell>.trigger[data-mode=tab][data-side=left]{top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));bottom:auto;left:auto;width:48px;height:48px;padding:0;border-radius:50%;background:#fff;color:#1d2722;border-color:#e2e5df;transform:none;opacity:0;transition:opacity 150ms linear}
.drawer-shell .trigger>.icon:not(.close-icon),.drawer-shell .trigger>.trigger-label{opacity:0}
.drawer-shell .trigger>.close-icon{opacity:1;transform:none;filter:none}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]{transform:none;opacity:1}
}
@media(max-width:540px) and (prefers-reduced-motion:no-preference){
.floating-popover[data-state=open]>.floating-surface{clip-path:inset(0px 0px 0px 0px round 0px)}
dialog.button-modal{transform:translateY(18px);transform-origin:50% 100%!important}
dialog.button-modal[data-state=open]{transform:translateY(0)}
dialog.button-modal[data-state=closing]{transform:translateY(12px)}
.drawer-panel,.drawer-shell[data-side=left]>.drawer-panel{transform:translateY(24px)}
.drawer-shell[data-state=open]>.drawer-panel{transform:translateY(0)}
.drawer-shell>.trigger[data-mode=tab],.drawer-shell>.trigger[data-mode=tab][data-side=left]{transform:translateY(12px) scale(.9);transition:opacity 150ms linear,transform 300ms cubic-bezier(.2,0,0,1)}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]{transform:translateY(0) scale(1)}
}
`;
