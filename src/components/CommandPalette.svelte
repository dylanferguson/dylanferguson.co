<script lang="ts">
  import { onMount } from "svelte";

  import { filterCommands, siteCommands } from "../commands";

  let query = $state("");
  let commands = $state(siteCommands);
  let activeIndex = $state(0);
  let palette: HTMLDialogElement | undefined = $state();
  let search: HTMLInputElement | undefined = $state();

  const found = $derived(filterCommands(commands, query));
  const active = $derived(found[activeIndex]);

  $effect(() => {
    if (!active) return;
    document
      .getElementById(`command-palette-option-${active.id}`)
      ?.scrollIntoView({ block: "nearest" });
  });

  function openPalette() {
    if (!palette || palette.open) return;
    commands = siteCommands.filter((command) => command.available?.() ?? true);
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
  class="command-palette mx-auto mt-[18vh] mb-auto overflow-hidden rounded-lg border border-line p-0 font-mono text-sm/[inherit] text-text print:hidden"
  aria-label="Command palette"
>
  <div class="palette-shell flex flex-col">
    <label class="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
      <span class="sr-only">Search commands</span>
      <svg
        class="size-3.5 shrink-0 text-muted"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
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
      <!-- Redundant tabindex: Astro's audit ignores inputs' native tabIndex 0. -->
      <input
        tabindex="0"
        bind:this={search}
        bind:value={query}
        oninput={() => {
          activeIndex = 0;
        }}
        id="command-palette-input"
        class="w-full border-0 bg-transparent text-inherit outline-none placeholder:text-faint"
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
    <ul
      id="command-palette-list"
      class="m-0 max-h-88 list-none overflow-auto overscroll-contain p-1.5"
      role="listbox"
    >
      {#if found.length === 0}
        <li class="px-3 pt-3.5 pb-4 text-muted">No matching commands</li>
      {:else}
        {#each found as command, index (command.id)}
          <li role="presentation">
            <button
              type="button"
              id={`command-palette-option-${command.id}`}
              class="flex w-full cursor-default items-baseline gap-4 rounded border-0 bg-transparent px-2.5 py-2 text-left text-inherit aria-selected:bg-hover"
              role="option"
              aria-selected={index === activeIndex}
              onpointerenter={() => {
                activeIndex = index;
              }}
              onclick={() => run(index)}
            >
              <span class="min-w-0">{command.title}</span>
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</dialog>

<style>
  .command-palette,
  .palette-shell {
    max-height: min(28rem, calc(100dvh - 4rem));
  }

  .command-palette {
    width: min(32rem, calc(100vw - 2rem));
    background: color-mix(in srgb, var(--color-background) 88%, transparent);
    box-shadow: 0 18px 48px
      light-dark(rgba(24, 24, 24, 0.16), rgba(0, 0, 0, 0.45));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .command-palette::backdrop {
    background: light-dark(rgba(24, 24, 24, 0.28), rgba(0, 0, 0, 0.46));
  }

  @media (prefers-reduced-motion: reduce) {
    .command-palette {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      background: var(--color-background);
    }
  }
</style>
