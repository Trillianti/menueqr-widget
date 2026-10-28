export const styles = `
:host{font:400 14px/1.5 system-ui,sans-serif;color:#1d2722;color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
button,a{-webkit-tap-highlight-color:transparent}
button{font:inherit;cursor:pointer}button:disabled{cursor:default}
button:focus-visible,a:focus-visible{outline:2px solid #fff;outline-offset:2px;box-shadow:0 0 0 5px #1d2722}
.trigger{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:1px solid transparent;border-radius:10px;padding:14px 20px;min-height:48px;max-width:calc(100vw - 32px);font:600 14px/1.4 system-ui,sans-serif;background:var(--mw-color);color:var(--mw-foreground)}
.icon{display:block;width:20px;height:20px;flex:none}
.trigger[data-mode=floating]{position:fixed;bottom:max(var(--mw-offset-y),env(safe-area-inset-bottom));right:var(--mw-offset-x);border-radius:100px;z-index:99990}
.trigger[data-mode=floating][data-side=left]{right:auto;left:var(--mw-offset-x)}
.trigger[data-mode=tab]{position:fixed;top:50%;right:0;transform:translateY(-50%);writing-mode:vertical-rl;padding:18px 12px;border-radius:10px 0 0 10px;z-index:99990}
.trigger[data-mode=tab][data-side=left]{right:auto;left:0;border-radius:0 10px 10px 0}
dialog{position:fixed;inset:0;margin:auto;padding:0;border:0;border-radius:20px;width:min(480px,calc(100vw - 32px));height:min(800px,90dvh);max-width:none;max-height:none;overflow:hidden;background:#fff;color:#1d2722;box-shadow:0 24px 100px #0003}
dialog::backdrop{background:#101b1480}
dialog[data-mode=floating]{inset:auto var(--mw-panel-x) var(--mw-panel-bottom) auto;margin:0;width:min(440px,calc(100vw - 32px));height:min(680px,var(--mw-panel-max-height));border-radius:16px}
dialog[data-mode=floating][data-side=left]{inset:auto auto var(--mw-panel-bottom) var(--mw-panel-x)}
dialog[data-mode=floating]::backdrop{background:transparent}
dialog[data-mode=tab]{inset:0 0 0 auto;margin:0;border-radius:16px 0 0 16px;height:100dvh;width:min(480px,100vw)}
dialog[data-mode=tab][data-side=left]{inset:0 auto 0 0;border-radius:0 16px 16px 0}
iframe{display:block;border:0;width:100%;height:100%;background:#fff}
.inline{position:relative;height:var(--mw-inline-height);max-width:560px;overflow:hidden;border:1px solid #e2e5df;border-radius:16px;background:#fff}
.fallback{position:absolute;inset:auto 24px 20px;background:#fff;padding:12px;font:14px/1.5 system-ui,sans-serif;text-align:center;color:#1d2722;z-index:2;border-radius:8px}
.close{position:absolute;top:8px;right:8px;z-index:3;border:1px solid #e2e5df;background:#fff;border-radius:50%;width:36px;height:36px;color:#1d2722;font:24px/1 system-ui,sans-serif}
dialog[data-ready]>.close{display:none}
@media(prefers-reduced-motion:no-preference){dialog{animation:mw-appear 160ms ease-out}@keyframes mw-appear{from{opacity:0}to{opacity:1}}}
@media(max-width:540px){
.mobile-hidden{display:none!important}
dialog[data-mode],dialog[data-mode][data-side]{inset:0;width:100%;height:100dvh;margin:0;border-radius:0}
dialog[data-mode]::backdrop{background:#101b1480}
.trigger[data-mode=floating],.trigger[data-mode=tab],.trigger[data-mode=tab][data-side=left]{top:auto;bottom:max(var(--mw-offset-y),env(safe-area-inset-bottom));right:var(--mw-offset-x);left:auto;writing-mode:horizontal-tb;transform:none;padding:14px 18px;border-radius:100px}
.trigger[data-mode=floating][data-side=left],.trigger[data-mode=tab][data-side=left]{left:var(--mw-offset-x);right:auto}
}
`;
