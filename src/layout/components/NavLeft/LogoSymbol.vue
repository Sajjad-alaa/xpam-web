<template>
  <svg
    viewBox="40 40 432 432"
    fill="currentColor"
    shape-rendering="geometricPrecision"
    aria-hidden="true"
    focusable="false"
  >
    <!-- XPAM mark: vault ring and bolts, the X (wheel spokes), hub with keyhole. -->
    <defs>
      <mask id="xpam-sidebar-hub">
        <rect x="0" y="0" width="512" height="512" fill="#fff" />
        <circle cx="256" cy="256" r="66" fill="#000" />
      </mask>
    </defs>
    <g class="logo-symbol-layer">
      <circle
        class="logo-symbol-stroke"
        cx="256"
        cy="256"
        r="168"
        stroke-width="14"
        stroke-opacity=".6"
      />
      <rect x="243" y="50" width="26" height="40" rx="11" />
      <rect x="243" y="422" width="26" height="40" rx="11" />
      <rect x="50" y="243" width="40" height="26" rx="11" />
      <rect x="422" y="243" width="40" height="26" rx="11" />
    </g>
    <g
      class="logo-symbol-layer logo-symbol-stroke"
      mask="url(#xpam-sidebar-hub)"
      stroke-width="68"
      stroke-linecap="round"
    >
      <line x1="146" y1="146" x2="366" y2="366" />
      <line x1="366" y1="146" x2="146" y2="366" />
    </g>
    <g class="logo-symbol-layer">
      <circle class="logo-symbol-stroke" cx="256" cy="256" r="52" stroke-width="9" />
      <circle cx="256" cy="242" r="18" />
      <path d="M246 250h20l8 42h-36z" />
    </g>
  </svg>
</template>

<style scoped>
.logo-symbol-stroke {
  /* Outlined parts: never filled, even under global svg fill rules. */
  fill: none !important;
  stroke: currentColor;
}

.logo-symbol-layer {
  animation: logo-layer-enter 480ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.logo-symbol-layer:nth-of-type(2) {
  animation-delay: 100ms;
}

.logo-symbol-layer:nth-of-type(3) {
  animation-delay: 200ms;
}

@keyframes logo-layer-enter {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-symbol-layer {
    animation: none;
  }
}
</style>
