import{b as l}from"./chunk-DX5UB71L.js";class d{constructor(){this.modal=null,this.isInitialized=!1,this.initialize()}async initialize(){if(!this.isInitialized)try{window.CATHCR_INITIALIZED=!0,l.runtime.onMessage.addListener(this.handleMessage.bind(this)),document.addEventListener("keydown",this.handleKeydown.bind(this)),this.isInitialized=!0,console.log("🎯 CATHCR content script initialized")}catch(t){console.error("❌ Failed to initialize content script:",t)}}async handleMessage(t){switch(t.type){case"OPEN_CAPTURE_MODAL":await this.openCaptureModal(t.payload);break;case"CLOSE_CAPTURE_MODAL":this.closeCaptureModal();break}}handleKeydown(t){t.key==="Escape"&&this.modal&&this.closeCaptureModal()}async openCaptureModal(t){this.modal&&this.closeCaptureModal(),this.modal=this.createModalElement(t),document.body.appendChild(this.modal);const a=this.modal.querySelector("textarea");a&&a.focus(),requestAnimationFrame(()=>{var e;(e=this.modal)==null||e.classList.add("cathcr-modal-visible")})}closeCaptureModal(){this.modal&&(this.modal.classList.remove("cathcr-modal-visible"),setTimeout(()=>{this.modal&&(this.modal.remove(),this.modal=null)},200))}createModalElement(t){const a=document.createElement("div");return a.className="cathcr-modal-overlay",a.innerHTML=`
      <div class="cathcr-modal">
        <div class="cathcr-modal-header">
          <h3>💭 Capture Your Thought</h3>
          <button class="cathcr-modal-close" aria-label="Close">×</button>
        </div>

        <form class="cathcr-modal-form">
          <textarea
            placeholder="What's on your mind?"
            rows="4"
            class="cathcr-modal-textarea"
            required
          ></textarea>

          <div class="cathcr-modal-context">
            📍 ${(t==null?void 0:t.title)||document.title}
          </div>

          <div class="cathcr-modal-actions">
            <button type="button" class="cathcr-btn cathcr-btn-secondary" data-action="cancel">
              Cancel
            </button>
            <button type="submit" class="cathcr-btn cathcr-btn-primary">
              💾 Capture
            </button>
          </div>
        </form>
      </div>
    `,this.addModalEventListeners(a,t),a}addModalEventListeners(t,a){const e=t.querySelector(".cathcr-modal-form"),o=t.querySelector(".cathcr-modal-textarea"),i=t.querySelector(".cathcr-modal-close"),c=t.querySelector('[data-action="cancel"]');i==null||i.addEventListener("click",()=>this.closeCaptureModal()),c==null||c.addEventListener("click",()=>this.closeCaptureModal()),t.addEventListener("click",s=>{s.target===t&&this.closeCaptureModal()}),e==null||e.addEventListener("submit",async s=>{s.preventDefault();const r=o.value.trim();if(r)try{await l.runtime.sendMessage({type:"CAPTURE_THOUGHT",payload:{text:r,context:{url:window.location.href,title:document.title,favicon:this.getFavicon(),...a},source:"content-script",timestamp:Date.now()}}),this.closeCaptureModal(),this.showSuccessToast()}catch(n){console.error("Failed to capture thought:",n),this.showErrorToast()}}),o==null||o.addEventListener("keydown",s=>{(s.metaKey||s.ctrlKey)&&s.key==="Enter"&&(e==null||e.dispatchEvent(new Event("submit")))})}getFavicon(){const t=document.querySelector('link[rel*="icon"]');return(t==null?void 0:t.href)||`${window.location.origin}/favicon.ico`}showSuccessToast(){this.showToast("✅ Thought captured successfully!","success")}showErrorToast(){this.showToast("❌ Failed to capture thought. Please try again.","error")}showToast(t,a){const e=document.createElement("div");e.className=`cathcr-toast cathcr-toast-${a}`,e.textContent=t,document.body.appendChild(e),requestAnimationFrame(()=>{e.classList.add("cathcr-toast-visible")}),setTimeout(()=>{e.classList.remove("cathcr-toast-visible"),setTimeout(()=>e.remove(),200)},3e3)}}new d;
