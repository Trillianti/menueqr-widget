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
.trigger[data-mode=tab]{position:fixed;top:50%;right:0;transform:translateY(-50%);writing-mode:vertical-rl;width:48px;padding:18px 12px;border-radius:10px 0 0 10px;overflow:hidden;z-index:99990}
.trigger[data-mode=tab][data-side=left]{right:auto;left:0;border-radius:0 10px 10px 0}
dialog{position:fixed;inset:0;margin:auto;padding:0;border:0;border-radius:20px;width:min(480px,calc(100vw - 32px));height:min(800px,90dvh);max-width:none;max-height:none;overflow:hidden;background:#fff;color:#1d2722;box-shadow:0 24px 100px #0003}
dialog::backdrop{background:#101b1480}
dialog.button-modal{opacity:0;animation:none;transition:opacity 150ms linear;overscroll-behavior:contain}
dialog.button-modal::backdrop{opacity:0;transition:opacity 150ms linear}
dialog.button-modal[data-state=open],dialog.button-modal[data-state=open]::backdrop{opacity:1}
dialog.button-modal>iframe{opacity:0;transition:opacity 150ms linear}
dialog.button-modal[data-state=open][data-loaded]>iframe{opacity:1}
dialog[data-mode=floating]{inset:auto var(--mw-panel-x) var(--mw-panel-bottom) auto;margin:0;width:min(440px,calc(100vw - 32px));height:min(680px,var(--mw-panel-max-height));border-radius:16px}
dialog[data-mode=floating][data-side=left]{inset:auto auto var(--mw-panel-bottom) var(--mw-panel-x)}
dialog[data-mode=floating]::backdrop{background:transparent}
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
.close{position:absolute;top:8px;right:8px;z-index:3;border:1px solid #e2e5df;background:#fff;border-radius:50%;width:36px;height:36px;color:#1d2722;font:24px/1 system-ui,sans-serif}
dialog[data-ready]>.close{display:none}
@media(prefers-reduced-motion:no-preference){dialog{animation:mw-appear 160ms ease-out}@keyframes mw-appear{from{opacity:0}to{opacity:1}}}
@media(prefers-reduced-motion:no-preference){
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
.trigger[data-mode=floating],.trigger[data-mode=tab],.trigger[data-mode=tab][data-side=left]{top:auto;bottom:max(var(--mw-offset-y),env(safe-area-inset-bottom));right:var(--mw-offset-x);left:auto;width:auto;writing-mode:horizontal-tb;transform:none;padding:14px 18px;border-radius:100px}
.trigger[data-mode=floating][data-side=left],.trigger[data-mode=tab][data-side=left]{left:var(--mw-offset-x);right:auto}
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
dialog.button-modal{transform:translateY(18px);transform-origin:50% 100%!important}
dialog.button-modal[data-state=open]{transform:translateY(0)}
dialog.button-modal[data-state=closing]{transform:translateY(12px)}
.drawer-panel,.drawer-shell[data-side=left]>.drawer-panel{transform:translateY(24px)}
.drawer-shell[data-state=open]>.drawer-panel{transform:translateY(0)}
.drawer-shell>.trigger[data-mode=tab],.drawer-shell>.trigger[data-mode=tab][data-side=left]{transform:translateY(12px) scale(.9);transition:opacity 150ms linear,transform 300ms cubic-bezier(.2,0,0,1)}
.drawer-shell[data-state=open]>.trigger[data-mode=tab]{transform:translateY(0) scale(1)}
}
`;
