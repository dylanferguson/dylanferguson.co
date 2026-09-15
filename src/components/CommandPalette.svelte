<script lang="ts">
  import { onMount } from "svelte";

  import { filterCommands, siteCommands } from "../commands";

  let query = $state("");
  let activeIndex = $state(0);
  let palette: HTMLDialogElement | undefined = $state();
  let search: HTMLInputElement | undefined = $state();

  const found = $derived(filterCommands(siteCommands, query));
  const active = $derived(found[activeIndex]);

  $effect(() => {
    if (!active) return;
    document
      .getElementById(`command-palette-option-${active.id}`)
      ?.scrollIntoView({ block: "nearest" });
  });

  function openPalette() {
    if (!palette || palette.open) return;
    query = "";
    activeIndex = 0;
    palette.showModal();
    search?.focus();
  }

  function closePalette() {
    if (!palette?.open) return;
    palette.close();
  }

  function togglePalette() {
    if (palette?.open) closePalette();
    else openPalette();
  }

  function run(index: number) {
    const command = found[index];
    if (!command) return;
    closePalette();
    command.run();
  }

  function isPaletteHotkey(event: KeyboardEvent) {
    if (event.isComposing || event.altKey) return false;
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return false;
    const key = event.key.toLowerCase();
    if (key === "k") return !event.shiftKey;
    if (key === "p") return event.shiftKey;
    return false;
  }

  function onSearchKeydown(event: KeyboardEvent) {
    if (event.isComposing) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (found.length === 0) return;
      activeIndex = (activeIndex + 1) % found.length;
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (found.length === 0) return;
      activeIndex = (activeIndex - 1 + found.length) % found.length;
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      activeIndex = 0;
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      if (found.length === 0) return;
      activeIndex = found.length - 1;
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      run(activeIndex);
    }
  }

  function onClose() {
    query = "";
    activeIndex = 0;
  }

  onMount(() => {
    function onDocumentKeydown(event: KeyboardEvent) {
      if (!isPaletteHotkey(event)) return;
      event.preventDefault();
      togglePalette();
    }

    function onDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-command-palette-open]")) return;
      event.preventDefault();
      togglePalette();
    }

    document.addEventListener("keydown", onDocumentKeydown);
    document.addEventListener("click", onDocumentClick);
    return () => {
      document.removeEventListener("keydown", onDocumentKeydown);
      document.removeEventListener("click", onDocumentClick);
    };
  });
</script>

<dialog
  bind:this={palette}
  id="command-palette"
  class="command-palette print:hidden"
  aria-label="Command palette"
  onclose={onClose}
>
  <div class="palette-shell">
    <label class="palette-search">
      <span class="sr-only">Search commands</span>
      <svg class="palette-search-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle
          cx="6.5"
          cy="6.5"
          r="4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.25"
        ></circle>
        <path
          d="M10 10l3.5 3.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.25"
          stroke-linecap="round"
        ></path>
      </svg>
      <input
        bind:this={search}
        bind:value={query}
        oninput={() => {
          activeIndex = 0;
        }}
        id="command-palette-input"
        type="text"
        placeholder="Execute a command…"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="true"
        aria-controls="command-palette-list"
        aria-activedescendant={active
          ? `command-palette-option-${active.id}`
          : undefined}
        onkeydown={onSearchKeydown}
      />
    </label>
    <ul id="command-palette-list" role="listbox">
      {#if found.length === 0}
        <li class="palette-empty">No matching commands</li>
      {:else}
        {#each found as command, index (command.id)}
          <li role="presentation">
            <button
              type="button"
              id={`command-palette-option-${command.id}`}
              class="palette-item"
              role="option"
              aria-selected={index === activeIndex}
              onpointerenter={() => {
                activeIndex = index;
              }}
              onclick={() => run(index)}
            >
              <span class="palette-item-title">{command.title}</span>
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</dialog>

<style>
  :global(.command-palette) {
    width: min(32rem, calc(100vw - 2rem));
    max-height: min(28rem, calc(100dvh - 4rem));
    margin: 18vh auto auto;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--color-line);
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-background) 88%, transparent);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    box-shadow: 0 18px 48px
      light-dark(rgba(24, 24, 24, 0.16), rgba(0, 0, 0, 0.45));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  :global(.command-palette::backdrop) {
    background: light-dark(rgba(24, 24, 24, 0.28), rgba(0, 0, 0, 0.46));
  }

  .palette-shell {
    display: flex;
    max-height: min(28rem, calc(100dvh - 4rem));
    flex-direction: column;
  }

  .palette-search {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    border-bottom: 1px solid var(--color-line);
    padding: 0.75rem 0.875rem;
  }

  .palette-search-icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    color: var(--color-muted);
  }

  .palette-search input {
    width: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
  }

  .palette-search input::placeholder {
    color: var(--color-faint);
  }

  #command-palette-list {
    margin: 0;
    max-height: 22rem;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.375rem;
    list-style: none;
  }

  .palette-item {
    display: flex;
    width: 100%;
    align-items: baseline;
    gap: 1rem;
    border: 0;
    border-radius: 0.25rem;
    background: transparent;
    padding: 0.5rem 0.625rem;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: default;
  }

  .palette-item[aria-selected="true"] {
    background: var(--color-hover);
  }

  .palette-item-title {
    min-width: 0;
  }

  .palette-empty {
    padding: 0.875rem 0.75rem 1rem;
    color: var(--color-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.command-palette) {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      background: var(--color-background);
    }
  }

  @media print {
    :global(.command-palette) {
      display: none;
    }
  }
</style>
