/* Renault Alpine • Home Assistant custom Lovelace card
 * v1.0.0 - original design, graphite palette and compact spacing.
 * No external dependencies, no Renault credentials, no direct Renault API calls.
 * All action commands route through Home Assistant's hass.callService().
 */
(() => {
  'use strict';
  const TAG = 'renault-alpine-card';
  if (customElements.get(TAG)) return;
  const DEFAULTS = Object.freeze({
    type: 'custom:renault-alpine-card',
    title: 'Renault Alpine',
    entity_prefix: 'tuin_alpine',
    location_suffix: 'Tuin',
    image: '/local/renault-alpine/alpine-hero.webp',
    colors: {battery: '#7fea9f', highlight: '#83baff', statusIcons: '#c5e3fd'},
    icons: {weight: 'regular', time: 'timer', flash: 'headlights'},
    options: {highlightFlash: true, showFlashEntity: true, compact: true, confirmHorn: true},
    // Optional Renault vehicle identifier for official ac_cancel/ac_start service fallback.
    renault_vehicle_id: '',
    entities: {flashLights: 'button.tuin_alpine_flash_lights'}
  });
  const DEFAULT_SUFFIXES = {
    battery: ['sensor', ['battery', 'battery_level']],
    range: ['sensor', ['battery_autonomy', 'range']],
    chargeState: ['sensor', ['charge_state']],
    plugState: ['sensor', ['plug_state']],
    charging: ['binary_sensor', ['charging']],
    plug: ['binary_sensor', ['plug']],
    lock: ['binary_sensor', ['lock']],
    hvac: ['binary_sensor', ['hvac']],
    timeRemaining: ['sensor', ['charging_remaining_time', 'charging_remaining']],
    mileage: ['sensor', ['mileage']],
    location: ['device_tracker', ['location']],
    lastBatteryActivity: ['sensor', ['last_battery_activity']],
    acStart: ['button', ['start_air_conditioner']],
    startCharge: ['button', ['start_charge']],
    stopCharge: ['button', ['stop_charge']],
    flashLights: ['button', ['flash_lights']],
    horn: ['button', ['sound_horn']]
  };
  const ICONS = {
    battery: '<rect x="3" y="5" width="17" height="14" rx="2"/><path d="M21 10v4"/><rect x="6.6" y="8.6" width="11" height="6.8" rx=".8" class="battery-inner"/>',
    road: '<path d="m8 3-4 18M16 3l4 18M12 5v3m0 4v3m0 4v2"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l0-7z"/>',
    plug: '<path d="M8 3v6m8-6v6M6 9h12v4a6 6 0 0 1-12 0V9Zm6 10v3"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
    unlock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0"/>',
    fan: '<circle cx="12" cy="12" r="2"/><path d="M11 10C8 7 8 3 11 3c2 0 3 3 2 7m2 2c4-3 7-2 7 1 0 2-3 3-7 2m-4 1c0 4-3 7-6 5-2-2 0-5 4-7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M9 2h6m-3 11 4-3m4-6 2 2"/>',
    gauge: '<path d="M4 17a9 9 0 1 1 16 0M12 13l5-5m-5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 10l-1-1m14 0-1 1M12 4v2"/>',
    snowflake: '<path d="M12 2v20M4 6l16 12M20 6 4 18M9 5l3 3 3-3M9 19l3-3 3 3M3 10l4 1-1 4m15-5-4 1 1 4"/>',
    headlights: '<path d="M14 5c4 0 7 3 7 7s-3 7-7 7V5Zm-3 0H8m3 5H5m6 4H5m6 5H8"/>',
    sparkles: '<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/>',
    horn: '<path d="M4 10v4h4l8 5V5l-8 5H4Zm12-1c2 1 3 5 0 6m3-9c4 3 4 9 0 12"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M5 9a8 8 0 0 1 14-2l1 5M4 12l1 5a8 8 0 0 0 14-2"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const style = `
    :host { display:block; --g-green:#7fea9f; --g-blue:#83baff; --g-cyan:#c5e3fd; --g-bg:#16191f; --g-panel:#202631; --g-tile:#222934; --g-action:#3a414b; --g-border:rgba(184,202,228,.20); --g-weight:1.85; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#f8fbff; }
    *,*::before,*::after{box-sizing:border-box}
    button{font:inherit;color:inherit;cursor:pointer} button:focus-visible{outline:3px solid var(--g-blue);outline-offset:3px}
    .shell{display:block;container-type:inline-size;isolation:isolate;position:relative;overflow:hidden;border:1.5px solid rgba(177,193,217,.26);border-radius:28px;padding:22px 18px 18px;background:radial-gradient(ellipse 85% 38% at 50% 27%,#313947 0%,#1f2834 48%,var(--g-bg) 96%);box-shadow:0 14px 32px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.05)}
    .shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;background:linear-gradient(145deg,rgba(29,39,53,.25),transparent 60%,rgba(0,0,0,.22))}
    .head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:3px 8px 0;min-height:63px}
    h2{margin:0;font-size:clamp(24px,3.7cqw,38px);letter-spacing:-.035em;line-height:1.2;font-weight:780}
    .logo{width:53px;height:59px;flex:none;stroke:#fff;stroke-width:5.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .scene{position:relative;height:clamp(185px,34cqw,322px);display:flex;align-items:center;justify-content:center;margin:-2px -12px 0}
    .car{width:min(100%,900px);max-height:110%;object-fit:contain;-webkit-mask-image:radial-gradient(ellipse 63% 74% at 50% 51%,#000 50%,transparent 100%);mask-image:radial-gradient(ellipse 63% 74% at 50% 51%,#000 50%,transparent 100%);pointer-events:none;user-select:none}
    .lamp{position:absolute;pointer-events:none;inset:0;opacity:0;background:radial-gradient(ellipse 6% 4% at 77% 47%,rgba(243,253,255,.9),transparent 86%),radial-gradient(ellipse 18% 6% at 77% 47%,rgba(152,217,255,.52),transparent 100%);mix-blend-mode:screen}
    .scene.flashing .lamp{animation:lamps 1.4s linear both}@keyframes lamps{0%,18%,31%,48%,62%,80%,100%{opacity:0}6%,25%,39%,55%,72%,89%{opacity:1}}
    .horn-wave{pointer-events:none;position:absolute;right:10%;top:41%;width:24px;height:42px;border:3px solid var(--g-blue);border-left:0;border-radius:0 55% 55% 0;opacity:0}
    .scene.honking .horn-wave{animation:wave .75s ease-out}.scene.honking .horn-wave.last{animation-delay:.11s}@keyframes wave{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(2.2)}}
    svg.ico{display:block;width:25px;height:25px;flex:none;stroke:currentColor;stroke-width:var(--g-weight);fill:none;stroke-linecap:round;stroke-linejoin:round}
    svg .battery-inner{fill:var(--g-green);stroke:none}
    .metrics{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr;align-items:stretch;margin:4px 0 0;border:1px solid var(--g-border);border-radius:19px;min-height:126px;background:linear-gradient(130deg,#293441,var(--g-panel));box-shadow:inset 0 1px rgba(255,255,255,.075)}
    .metric{min-width:0;position:relative;display:flex;gap:9px;align-items:center;justify-content:center;padding:14px 10px}
    .metric+.metric::before{content:'';position:absolute;left:0;top:20%;height:60%;width:1px;background:rgba(190,210,236,.27)}
    .metric .ico{width:31px;height:31px;color:#f6faff}.metric .name{display:block;font-size:clamp(11px,1.53cqw,15px);color:#d4deeb;margin-bottom:5px;line-height:1.13}.metric .val{display:block;font-weight:760;letter-spacing:-.025em;font-size:clamp(16px,2.75cqw,27px);line-height:1.2;white-space:nowrap}.metric .status{font-size:clamp(12px,1.8cqw,17px);font-weight:500;color:#dce3ed;white-space:normal}
    .battery{flex-direction:column;align-items:stretch;justify-content:center;gap:13px;padding:14px 18px}.battery-main{display:flex;align-items:center;gap:12px}.battery .ico{width:43px;height:43px}.battery .val{font-size:clamp(23px,3.5cqw,37px)}.batterybar{height:11px;border-radius:20px;background:#384455;overflow:hidden}.batterybar>span{display:block;height:100%;width:0;background:var(--g-green);border-radius:inherit;transition:width .3s}
    .statuses{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}
    .tile{min-width:0;min-height:123px;padding:14px 14px 12px;background:linear-gradient(140deg,#2b3441,#1b2330);border:1px solid var(--g-border);border-radius:17px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;box-shadow:inset 0 1px rgba(255,255,255,.055)}
    .tile.locked{border-color:rgba(127,234,159,.48);background:linear-gradient(135deg,#164737,#12352d)}
    .tile .ico{width:33px;height:33px;margin-bottom:4px;color:var(--g-cyan)}.tile-label{font-size:clamp(11px,1.74cqw,17px);color:#d6dfeb}.tile-value{font-size:clamp(15px,2.15cqw,23px);letter-spacing:-.025em;line-height:1.16;font-weight:740;overflow-wrap:anywhere}
    .actions{margin:24px 4px 0}.actions h3{font-size:clamp(17px,2.5cqw,24px);line-height:1.15;margin:0 0 13px 2px;font-weight:750;letter-spacing:-.024em}
    .actions-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .action-wrap{min-width:0;display:flex;flex-direction:column;gap:6px;align-items:stretch}
    .action{width:100%;min-height:91px;border-radius:16px;border:1px solid rgba(192,210,235,.35);background:linear-gradient(140deg,#465364,var(--g-action));box-shadow:inset 0 1px #fff1,0 4px 10px #0002;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:8px;padding:10px 8px;font-size:clamp(12px,1.74cqw,18px);font-weight:730;line-height:1.15;text-align:center;transition:transform .17s,filter .17s,border-color .17s}
    .action:hover:not(:disabled){transform:translateY(-2px);border-color:var(--g-blue);filter:brightness(1.1)}.action:active:not(:disabled){transform:translateY(1px)}.action:disabled{cursor:not-allowed;opacity:.45;filter:saturate(.65)}
    .action .ico{width:31px;height:31px}.action.ac .ico{color:var(--g-cyan)}.action.featured{border:2px solid var(--g-blue);background:linear-gradient(138deg,#264e77,#1c3b61);box-shadow:0 0 16px rgba(131,186,255,.16),inset 0 1px #fff2}.action.pending{animation:pulse .55s ease-in-out infinite alternate}.action.active{border-color:var(--g-green);background:linear-gradient(140deg,#245442,#174133)}@keyframes pulse{to{filter:brightness(1.35)}}
    .entity-caption{min-width:0;text-align:center;color:#abb7ca;font-size:clamp(10px,1.25cqw,12px);overflow-wrap:anywhere;line-height:1.3}
    .footer{border-top:1px solid rgba(194,212,233,.28);margin:25px 5px 0;padding-top:15px;display:flex;align-items:center;justify-content:space-between;gap:10px}
    .updated{display:flex;align-items:center;gap:8px;color:#cbd4e1;font-size:clamp(11px,1.6cqw,16px)}.updated .ico{width:23px;height:23px}
    .location{max-width:55%;background:linear-gradient(110deg,rgba(31,83,69,.48),rgba(39,51,70,.87));border:1px solid rgba(182,201,222,.22);border-radius:40px;min-height:37px;padding:7px 12px;display:flex;align-items:center;gap:8px;font-size:clamp(11px,1.58cqw,16px);white-space:nowrap}.location .ico{width:19px;height:19px;color:#8ced94;fill:rgba(140,237,148,.1)}.location strong{overflow:hidden;text-overflow:ellipsis}.location .bar{height:17px;border-left:1px solid #bac6d1a6}.location .suffix{color:#c1ccdb}
    .notice{display:none;margin:10px 5px 0;color:#d5e0ef;font-size:12px;line-height:1.45;border-radius:9px;padding:9px;background:#293847;border:1px solid #52647e}.notice.show{display:block}.notice.error{background:#472927;border-color:#ca8277}
    .missing{font-size:12px;display:none;margin:10px 3px 0;color:#aebdd0}.missing.show{display:block}
    :host([compact]) .shell{padding:18px 15px 16px;border-radius:24px}:host([compact]) .scene{height:clamp(164px,29cqw,280px)}:host([compact]) .head{min-height:54px}:host([compact]) .metrics{min-height:110px}:host([compact]) .tile{min-height:107px}:host([compact]) .statuses{margin-top:13px}:host([compact]) .actions{margin-top:19px}:host([compact]) .action{min-height:84px}:host([compact]) .footer{margin-top:18px}
    @container (max-width:710px){.metric{flex-direction:column;text-align:center;gap:4px;padding:10px 6px}.metric .ico{width:26px;height:26px}.metric .name{margin-bottom:3px}.battery{gap:9px;padding:12px}.battery-main{gap:7px}.battery .ico{width:33px;height:33px}.statuses{gap:8px}.tile{padding:11px 10px}.tile .ico{width:28px;height:28px}.actions-grid{gap:8px}.action{padding:8px 5px}.action .ico{width:27px;height:27px}.footer{margin-top:16px}}
    @container (max-width:510px){.shell{border-radius:20px;padding:16px 10px}.head{min-height:43px}.logo{width:36px;height:44px}.scene{height:clamp(125px,39cqw,210px);margin:0 -10px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));min-height:auto}.metric{min-height:86px;flex-direction:row;text-align:left;justify-content:center;padding:11px 6px}.metric+.metric::before{height:64%;top:18%}.metric:nth-child(3)::before{display:none}.metric:nth-child(n+3){border-top:1px solid var(--g-border)}.battery{padding:11px 13px}.battery-main{justify-content:center}.battery .val{font-size:23px}.battery .ico{width:32px;height:32px}.metric .val{font-size:17px}.metric .status{font-size:12px}.metric .name{font-size:11px}.statuses{grid-template-columns:repeat(2,minmax(0,1fr))}.tile{min-height:95px;padding:10px 13px}.tile .ico{width:25px;height:25px;margin:0}.tile-label{font-size:12px}.tile-value{font-size:18px}.actions{margin-top:17px}.actions h3{font-size:18px}.actions-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.action{min-height:75px;font-size:14px}.action .ico{width:25px;height:25px}.entity-caption{font-size:10px}.footer{margin:16px 2px 0}.updated{font-size:11px}.location{gap:4px;padding:5px 7px;font-size:11px}.location .ico{width:15px;height:15px}.location .suffix{display:none}.location .bar{display:none}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `;
  function icon(name, cssClass='') { return `<svg class="ico ${cssClass}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.clock}</svg>`; }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function hex(v, d){return /^#[0-9a-f]{6}$/i.test(v||'') ? v : d;}
  function available(s){return !!s && !['unknown','unavailable','none',''].includes(String(s.state).toLowerCase());}
  function buttonReady(s){return !!s && String(s.state).toLowerCase() !== 'unavailable';}
  function on(s){return available(s) ? s.state === 'on' : null;}
  function intState(s){const x=Number(s?.state);return available(s) && Number.isFinite(x)?x:null;}
  function timeLeft(s){
    if (!available(s)) return '—';
    let min=null, raw=String(s.state).trim();
    const unit=(s.attributes?.unit_of_measurement||'min').toLowerCase();
    const n=Number(raw);
    if(Number.isFinite(n)) min=unit.includes('sec')||unit==='s'?n/60:unit.includes('hour')||unit==='h'?n*60:n;
    else if(/^\d{1,3}:\d{2}(:\d{2})?$/.test(raw)){
      const a=raw.split(':').map(Number);min=a.length===3?a[0]*60+a[1]+a[2]/60:a[0]*60+a[1];
    } else if(/^PT/i.test(raw)){
      const match=raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
      if(match) min=(Number(match[1]||0)*60)+(Number(match[2]||0))+(Number(match[3]||0)/60);
    }
    if(min===null || min<0 || min>100000) return raw;
    const minutes=Math.round(min); const hours=Math.floor(minutes/60);
    return hours?`${hours} h ${minutes%60} min`:`${minutes} min`;
  }
  function num(v){return Number(v).toLocaleString(undefined,{maximumFractionDigits:0});}
  class RenaultAlpineCard extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._config=null;this._hass=null;this._pending=new Set();this._noticeTimer=null;this._clockTimer=null;}
    static getStubConfig(){return structuredClone(DEFAULTS);}
    static async getConfigElement(){return document.createElement('renault-alpine-card-editor');}
    getCardSize(){return 9;}
    getGridOptions(){return {columns:12,min_columns:4,rows:8,min_rows:5};}
    setConfig(input){
      if(!input || typeof input!=='object') throw new Error('Renault Alpine: missing card configuration');
      this._config={...DEFAULTS,...input,colors:{...DEFAULTS.colors,...(input.colors||{})},icons:{...DEFAULTS.icons,...(input.icons||{})},options:{...DEFAULTS.options,...(input.options||{})},entities:{...DEFAULTS.entities,...(input.entities||{})}};
      this.toggleAttribute('compact',!!this._config.options.compact);
      this._build();this._update();
    }
    connectedCallback(){if(!this._clockTimer)this._clockTimer=setInterval(()=>this._updateFooter(),60000);}
    disconnectedCallback(){if(this._clockTimer){clearInterval(this._clockTimer);this._clockTimer=null;}if(this._noticeTimer)clearTimeout(this._noticeTimer);}
    set hass(hass){this._hass=hass;this._update();}
    _state(key){const id=this._entityId(key);return id?this._hass?.states?.[id]:null;}
    _entityId(key){
      const explicit=this._config?.entities?.[key];
      if(explicit === null)return null;
      if(explicit)return explicit;
      const spec=DEFAULT_SUFFIXES[key];if(!spec)return null;
      const [domain,suffixes]=spec, prefix=this._config?.entity_prefix||'tuin_alpine';
      const candidates=suffixes.map(s=>`${domain}.${prefix}_${s}`);
      return candidates.find(id=>this._hass?.states?.[id]) || candidates[0];
    }
    _get(id){return this.shadowRoot.getElementById(id);}
    _setText(id,value){const el=this._get(id);if(el && el.textContent!==String(value))el.textContent=String(value);}
    _setIcon(id,name){const el=this._get(id);if(el && el.dataset.icon!==name){el.innerHTML=ICONS[name];el.dataset.icon=name;}}
    _build(){
      if(!this._config)return;
      const c=this._config, colors=c.colors, opt=c.options, i=c.icons;
      const optionsStyle=`--g-green:${hex(colors.battery,DEFAULTS.colors.battery)};--g-blue:${hex(colors.highlight,DEFAULTS.colors.highlight)};--g-cyan:${hex(colors.statusIcons,DEFAULTS.colors.statusIcons)};--g-weight:${({thin:'1.25',regular:'1.85',bold:'2.45'}[i.weight]||'1.85')};`;
      this.shadowRoot.innerHTML=`<style>${style}</style><ha-card class="shell" style="${optionsStyle}">
        <div class="head"><h2>${esc(c.title)}</h2><svg class="logo" viewBox="0 0 76 104" role="img" aria-label="Renault emblem"><path d="M38 5 70 52 38 99 6 52 38 5Z"/><path d="M38 5 22 52l16 47M38 5l16 47-16 47M22 52l16-21 16 21-16 21-16-21"/></svg></div>
        <div class="scene" id="scene"><img class="car" src="${esc(c.image)}" alt="Black Renault vehicle" draggable="false"><span class="lamp"></span><span class="horn-wave"></span><span class="horn-wave last"></span></div>
        <div class="metrics" aria-label="Battery and charging status">
          <div class="metric battery"><div class="battery-main">${icon('battery')}<div><span class="name">Battery</span><strong class="val" id="battery">—</strong></div></div><div class="batterybar" role="progressbar" aria-label="Battery" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="battery-progress"><span id="battery-fill"></span></div></div>
          <div class="metric">${icon('road')}<div><span class="name">Range</span><strong class="val" id="range">—</strong></div></div>
          <div class="metric">${icon('bolt')}<div><span class="name">Charge state</span><strong class="val status" id="charge-state">—</strong></div></div>
          <div class="metric">${icon('plug')}<div><span class="name">Plug state</span><strong class="val status" id="plug-state">—</strong></div></div>
        </div>
        <div class="statuses" aria-label="Vehicle details">
          <div class="tile" id="lock-tile"><svg class="ico" id="lock-icon" viewBox="0 0 24 24">${ICONS.lock}</svg><span class="tile-label">Lock</span><strong class="tile-value" id="lock">—</strong></div>
          <div class="tile">${icon('fan')}<span class="tile-label">HVAC</span><strong class="tile-value" id="hvac">—</strong></div>
          <div class="tile">${icon(i.time==='clock'?'clock':'timer')}<span class="tile-label">Time remaining</span><strong class="tile-value" id="remaining">—</strong></div>
          <div class="tile">${icon('gauge')}<span class="tile-label">Mileage</span><strong class="tile-value" id="mileage">—</strong></div>
        </div>
        <div class="actions"><h3>Quick actions</h3><div class="actions-grid">
          <div class="action-wrap"><button class="action ac" data-action="ac" id="ac-button">${icon('snowflake')}<span id="ac-label">Start A/C</span></button></div>
          <div class="action-wrap"><button class="action" data-action="charge" id="charge-button">${icon('bolt')}<span id="charge-label">Start charge</span></button></div>
          <div class="action-wrap"><button class="action ${opt.highlightFlash?'featured':''}" data-action="flash" id="flash-button">${icon(i.flash==='sparkles'?'sparkles':'headlights')}<span>Flash lights</span></button>${opt.showFlashEntity?`<span class="entity-caption" id="flash-entity">${esc(this._entityId('flashLights'))}</span>`:''}</div>
          <div class="action-wrap"><button class="action" data-action="horn" id="horn-button">${icon('horn')}<span>Sound horn</span></button></div>
        </div></div>
        <footer class="footer"><div class="updated">${icon('refresh')}<span id="updated">Waiting for data</span></div><button class="location" id="location-button" type="button">${icon('pin')}<strong id="location">Location unavailable</strong><span class="bar"></span><span class="suffix">${esc(c.location_suffix)}</span></button></footer>
        <div class="notice" id="notice" role="status" aria-live="polite"></div><div class="missing" id="missing"></div>
      </ha-card>`;
      this.shadowRoot.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>this._action(btn.dataset.action)));
      this._get('location-button').addEventListener('click',()=>{
        const id=this._entityId('location');if(!id||!this._hass?.states?.[id])return;
        this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:id}}));
      });
    }
    _update(){
      if(!this._config||!this._hass||!this._get('battery'))return;
      const b=intState(this._state('battery'));
      this._setText('battery',b===null?'—':`${Math.round(b)}%`);
      this._get('battery-fill').style.width=(b===null?0:Math.min(100,Math.max(0,b)))+'%';
      this._get('battery-progress').setAttribute('aria-valuenow',b===null?0:b);
      const r=intState(this._state('range'));
      const rangeUnit=this._state('range')?.attributes?.unit_of_measurement||'km';
      this._setText('range',r===null?'—':`${num(r)} ${rangeUnit}`);
      const charge=this._state('chargeState');
      const chargingState=this._state('charging');
      const chargeStatus=available(charge)?charge.state.replace(/_/g,' '):(on(chargingState)===null?'—':on(chargingState)?'Charging':'Not charging');
      this._setText('charge-state',chargeStatus==='—'?'—':chargeStatus.charAt(0).toUpperCase()+chargeStatus.slice(1));
      const plugState=this._state('plugState'), plugBinary=this._state('plug');
      const isPlugged=on(plugBinary);
      this._setText('plug-state',available(plugState)?plugState.state.replace(/_/g,' '):isPlugged===null?'—':isPlugged?'Plugged in':'Unplugged');
      const l=this._state('lock');
      // Home Assistant binary_sensor device_class lock: ON means UNLOCKED, OFF means LOCKED.
      const unlocked=on(l), locked=unlocked===null?null:!unlocked;
      this._setText('lock',locked===null?'—':locked?'Locked':'Unlocked');
      this._get('lock-tile').classList.toggle('locked',locked===true);
      this._setIcon('lock-icon',unlocked===true?'unlock':'lock');
      const hvac=on(this._state('hvac'));
      this._setText('hvac',hvac===null?'—':hvac?'On':'Off');
      let isCharging=on(chargingState);
      if(isCharging===null && available(charge)) isCharging=/^(charging|charge_in_progress|in_progress)$/i.test(charge.state);
      const rawRemaining=this._state('timeRemaining');
      // Don't claim a stale positive estimate after charging has ended.
      this._setText('remaining',isCharging===false?'—':timeLeft(rawRemaining));
      const mileage=intState(this._state('mileage'));
      this._setText('mileage',mileage===null?'—':`${num(mileage)} ${this._state('mileage')?.attributes?.unit_of_measurement||'km'}`);
      const tracker=this._state('location');
      const locationName=!available(tracker)?'Location unavailable':tracker.state==='home'?'At home':tracker.state==='not_home'?'Away':tracker.state;
      this._setText('location',locationName);
      this._get('location-button').disabled=!available(tracker);
      const acBtn=this._get('ac-button');
      const acStopping=hvac===true;
      const acId=this._entityId('acStart');
      const startAcSupported=buttonReady(this._hass.states?.[acId]) && acId?.startsWith('button.');
      const canStartAc=startAcSupported||!!this._config.renault_vehicle_id;
      const canStopAc=!!this._config.renault_vehicle_id && !!this._hass.services?.renault?.ac_cancel;
      this._setText('ac-label',acStopping?'Stop A/C':'Start A/C');
      acBtn.classList.toggle('active',acStopping);acBtn.disabled=this._pending.has('ac')||(acStopping?!canStopAc:!canStartAc);
      acBtn.title=acStopping&&!canStopAc?'Stop A/C requires renault_vehicle_id in card settings':(!canStartAc?'Start A/C entity not found':'');
      const chargingNow=isCharging===true;
      const chargeId=this._entityId(chargingNow?'stopCharge':'startCharge');
      const chargeExists=buttonReady(this._hass.states?.[chargeId])&&chargeId?.startsWith('button.');
      const chargeFallback=(!chargingNow && !!this._config.renault_vehicle_id && !!this._hass.services?.renault?.charge_start);
      const plugDisconnected=(isPlugged===false)||(isPlugged===null && available(plugState)&&/unplug|disconnect/i.test(plugState.state));
      const chargeBtn=this._get('charge-button');
      this._setText('charge-label',chargingNow?'Stop charge':'Start charge');
      chargeBtn.disabled=this._pending.has('charge')||(!chargeExists&&!chargeFallback)||(!chargingNow && plugDisconnected);
      chargeBtn.title=!chargingNow&&plugDisconnected?'Connect the charging cable first':!chargeExists&&!chargeFallback?'Charging action entity not found':'';
      chargeBtn.classList.toggle('active',chargingNow);
      for(const key of ['flash','horn']){
        const id=this._entityId(key==='flash'?'flashLights':'horn');
        const el=this._get(key+'-button');
        el.disabled=this._pending.has(key)||!id?.startsWith('button.')||!buttonReady(this._hass.states?.[id]);
        el.title=el.disabled?(id?`Unavailable: ${id}`:'Button entity not configured'):'';
      }
      this._updateFooter();
      const mustHave=['battery','range','chargeState','plugState','lock','hvac','timeRemaining','mileage'];
      const missing=mustHave.filter(k=>!available(this._state(k))).length;
      const help=this._get('missing');help.classList.toggle('show',missing>0);
      help.textContent=missing>0?`${missing} status ${missing===1?'entity is':'entities are'} missing or unavailable. Check Renault entity IDs in the card editor.`:'';
    }
    _updateFooter(){
      if(!this._config||!this._get('updated'))return;
      const source=this._state('lastBatteryActivity');
      const instant=available(source)?new Date(source.state):new Date(this._state('battery')?.last_updated||'');
      if(Number.isNaN(instant.getTime())){this._setText('updated','Last update unavailable');return;}
      const diff=Math.max(0,Math.floor((Date.now()-instant.getTime())/60000));
      this._setText('updated',diff<1?'Updated just now':diff<60?`Last update ${diff} min ago`:diff<1440?`Last update ${Math.floor(diff/60)} h ago`:`Last update ${Math.floor(diff/1440)} d ago`);
    }
    _notify(message,error=false){
      const box=this._get('notice');if(!box)return;
      box.textContent=message;box.classList.add('show');box.classList.toggle('error',error);
      if(this._noticeTimer)clearTimeout(this._noticeTimer);
      this._noticeTimer=setTimeout(()=>{box.classList.remove('show','error');},5500);
    }
    async _action(action){
      if(!this._hass?.callService||this._pending.has(action))return;
      if(action==='horn'&&this._config.options.confirmHorn!==false && !window.confirm('Sound the real vehicle horn?'))return;
      const btn=this._get(action+'-button');
      const calls={}; const idFor=key=>this._entityId(key);
      const isAcOn=on(this._state('hvac'))===true;
      let chargingNow=on(this._state('charging'));
      if(chargingNow===null){const s=this._state('chargeState');chargingNow=available(s)&&/^(charging|charge_in_progress|in_progress)$/i.test(s.state);}
      const renaultId=this._config.renault_vehicle_id;
      const press=(key)=>{
        const id=idFor(key);if(!id?.startsWith('button.')||!buttonReady(this._hass.states?.[id]))throw Error(`Button entity not available: ${id||key}`);
        return ['button','press',{entity_id:id}];
      };
      try {
        switch(action){
          case 'ac':
            if(isAcOn){if(!renaultId)throw Error('Set renault_vehicle_id to enable Stop A/C');calls.args=['renault','ac_cancel',{vehicle:renaultId}];}
            else if(buttonReady(this._hass.states?.[idFor('acStart')]))calls.args=press('acStart');
            else if(renaultId)calls.args=['renault','ac_start',{vehicle:renaultId,temperature:21}];
            else throw Error('No Start A/C button or Renault vehicle ID configured');
            break;
          case 'charge':
            if(chargingNow)calls.args=press('stopCharge');
            else {
              const plugged=on(this._state('plug'));
              if(plugged===false)throw Error('Charging cable is disconnected');
              if(buttonReady(this._hass.states?.[idFor('startCharge')]))calls.args=press('startCharge');
              else if(renaultId)calls.args=['renault','charge_start',{vehicle:renaultId}];
              else throw Error('No Start charge button or Renault vehicle ID configured');
            }
            break;
          case 'flash': calls.args=press('flashLights');break;
          case 'horn': calls.args=press('horn');break;
          default:return;
        }
        if(!this._hass.services?.[calls.args[0]]?.[calls.args[1]])throw Error(`Action unavailable in Home Assistant: ${calls.args[0]}.${calls.args[1]}`);
        this._pending.add(action);btn?.classList.add('pending');this._update();
        await this._hass.callService(...calls.args);
        this._notify('Command sent to Home Assistant. Renault may take a few minutes to refresh.');
        const scene=this._get('scene');
        if(action==='flash'||action==='horn'){
          scene.classList.remove('flashing','honking');void scene.offsetWidth;
          scene.classList.add(action==='flash'?'flashing':'honking');
          setTimeout(()=>scene?.classList.remove('flashing','honking'),1700);
        }
      }catch(err){this._notify('Command failed: '+(err?.message||String(err)),true);}
      finally{this._pending.delete(action);btn?.classList.remove('pending');this._update();}
    }
  }
  // Simple native dashboard editor: no custom YAML needed to change mappings/colors.
  class RenaultAlpineCardEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._config={...DEFAULTS,colors:{...DEFAULTS.colors},icons:{...DEFAULTS.icons},options:{...DEFAULTS.options},entities:{...DEFAULTS.entities}};}
    setConfig(c){this._config={...DEFAULTS,...c,colors:{...DEFAULTS.colors,...(c.colors||{})},icons:{...DEFAULTS.icons,...(c.icons||{})},options:{...DEFAULTS.options,...(c.options||{})},entities:{...DEFAULTS.entities,...(c.entities||{})}};this._render();}
    set hass(h){this._hass=h;}
    _render(){
      const c=this._config;
      const base=[['title','Card title'],['entity_prefix','Entity name prefix'],['location_suffix','Location footer label'],['image','Vehicle image URL'],['renault_vehicle_id','Renault vehicle ID (optional; for A/C stop)']];
      const entities=[['battery','Battery'],['range','Range'],['chargeState','Charge state'],['plugState','Plug state'],['charging','Charging binary sensor'],['plug','Plug binary sensor'],['lock','Lock binary sensor'],['hvac','HVAC binary sensor'],['timeRemaining','Charging time remaining'],['mileage','Mileage'],['location','Location'],['lastBatteryActivity','Last battery activity (optional)'],['acStart','Start A/C button'],['startCharge','Start charge button'],['stopCharge','Stop charge button'],['flashLights','Flash lights button'],['horn','Sound horn button']];
      this.shadowRoot.innerHTML=`<style>
        :host{display:block;color:var(--primary-text-color,#222);font:14px system-ui,sans-serif}*{box-sizing:border-box}
        .note{line-height:1.4;color:var(--secondary-text-color,#667)}.group{border-top:1px solid var(--divider-color,#ddd);padding:12px 0}
        .field{display:block;margin:8px 0}.field span{display:block;margin-bottom:5px;font-size:12px;font-weight:650}input:not([type=checkbox]),select{font:inherit;width:100%;padding:9px;border:1px solid var(--divider-color,#ccd);background:var(--card-background-color,#fff);color:var(--primary-text-color,#222);border-radius:7px}
        input[type=color]{height:39px;padding:2px;width:100%}.check{display:flex;gap:9px;align-items:center;margin:10px 0}.hint{color:var(--secondary-text-color,#888);font-size:11px}
        details summary{cursor:pointer;font-weight:700;margin:8px 0}h3{font-size:15px;margin:5px 0 10px}
      </style><p class="note">Live entities are read from Home Assistant. Guesses use the prefix; you can override each one below. Commands are disabled if the corresponding entity does not exist.</p>
      <section class="group"><h3>General</h3>${base.map(([k,label])=>`<label class="field"><span>${label}</span><input data-path="${k}" value="${esc(c[k]??'')}"></label>`).join('')}</section>
      <section class="group"><h3>Graphite style</h3>
        ${[['battery','Battery'],['highlight','Flash highlight'],['statusIcons','Status symbols']].map(([k,label])=>`<label class="field"><span>${label}</span><input data-path="colors.${k}" type="color" value="${hex(c.colors[k],DEFAULTS.colors[k])}"></label>`).join('')}
        <label class="field"><span>Icon weight</span><select data-path="icons.weight">${['thin','regular','bold'].map(v=>`<option value="${v}" ${c.icons.weight===v?'selected':''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Time icon</span><select data-path="icons.time">${['timer','clock'].map(v=>`<option value="${v}" ${c.icons.time===v?'selected':''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Flash icon</span><select data-path="icons.flash">${['headlights','sparkles'].map(v=>`<option value="${v}" ${c.icons.flash===v?'selected':''}>${v}</option>`).join('')}</select></label>
        ${[['highlightFlash','Highlight flash button'],['showFlashEntity','Show flash entity ID'],['compact','Compact spacing'],['confirmHorn','Confirm real horn action']].map(([k,label])=>`<label class="check"><input type="checkbox" data-path="options.${k}" ${c.options[k]?'checked':''}><span>${label}</span></label>`).join('')}
      </section><section class="group"><details><summary>Entity mapping (expand to verify)</summary><p class="hint">Leaving an override empty uses the automatic prefix-based suggestion. Use the exact entity IDs found under Settings → Devices & services → Renault.</p>
        ${entities.map(([key,label])=>{const spec=DEFAULT_SUFFIXES[key], guess=spec?`${spec[0]}.${c.entity_prefix||'tuin_alpine'}_${spec[1][0]}`:'';return `<label class="field"><span>${label}</span><input data-path="entities.${key}" placeholder="${esc(guess)}" value="${esc(c.entities[key]??'')}"></label>`;}).join('')}
      </details></section>`;
      this.shadowRoot.querySelectorAll('[data-path]').forEach(el=>{
        el.addEventListener(el.type==='checkbox'||el.type==='color'||el.tagName==='SELECT'?'change':'change',()=>{
          const path=el.dataset.path.split('.');const v=el.type==='checkbox'?el.checked:el.value;
          const next={...this._config,colors:{...this._config.colors},icons:{...this._config.icons},options:{...this._config.options},entities:{...this._config.entities}};
          if(path.length===2){next[path[0]][path[1]]=v;}else{next[path[0]]=v;}
          this._config=next;
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
        });
      });
    }
  }
  customElements.define(TAG,RenaultAlpineCard);
  if(!customElements.get('renault-alpine-card-editor'))customElements.define('renault-alpine-card-editor',RenaultAlpineCardEditor);
  window.customCards=window.customCards||[];
  window.customCards.push({type:TAG,name:'Renault Alpine',description:'Renault Alpine live vehicle card (graphite, compact, configurable entities)',preview:true});
  console.info('%cRENAULT ALPINE CARD%c v1.0.0 loaded','color:#7fea9f;font-weight:bold','color:inherit');
})();