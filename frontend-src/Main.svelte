<script>
  import Router, { link, location, push } from "svelte-spa-router";

  import { routerPrefix, routePatterns, getActiveNoteId } from "./lib";
  import { deleteAllArchived } from "./api";
  import { getNotes } from "./api";

  import NoteCard from "./NoteCard.svelte";
  import Progress from "./Progress.svelte";
  import NoteView from "./NoteView.svelte";
  import NoteNew from "./NoteNew.svelte";
  import NoteEdit from "./NoteEdit.svelte";

  export const routes = {
    [routePatterns.new]: NoteNew,
    [routePatterns.view]: NoteView,
    [routePatterns.edit]: NoteEdit,
  };

  $: activeNoteId = getActiveNoteId($location);

  let fetching;
  let search = "";
  let age = "1month";
  let page = 1;
  let entries = [];

  const fetch = ({ reset = false } = {}) => {
      if (reset) {
        page = 1;
        entries = [];
      }
      return (fetching = getNotes({ age, search, page }).then((data) => {
      entries = entries.concat(data.data);
      return data.hasMore;
    }));
  };

  fetch();

  let timeout = null;

  const searchQuery  = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(fetchFromScratch, 300);
  }

  const loadMore = () => {
    page += 1;
    return fetch();
  };

  const fetchFromScratch = ({ resetNav = true } = {}) => {
    if (resetNav) {
      push("/");
    }
    return fetch({ reset: true });
  };

  const refetch = async () => {
    let oldPage = page;
    await fetchFromScratch({ resetNav: false });
    while (page < oldPage) {
      await loadMore();
    }
  };

  const deleteAll = async () => {
    await deleteAllArchived();
    age = "1month";
    fetchFromScratch();
  };

  const routeEvent = (event) => {
    const { type, id } = (event && event.detail) || {};
    switch (type) {
      case "note-create-cancelled":
      case "note-closed":
        push("/");
        break;
      case "note-deleted":
      case "note-archived":
      case "note-unarchived":
        push("/");
        refetch();
        break;
      case "note-edit-started":
        push(`/note/${id}/edit`);
        break;
      case "note-edit-cancelled":
        push(`/note/${id}`);
        break;
      case "note-created":
      case "note-edited":
        push(`/note/${id}`);
        refetch();
        break;
    }
  };
</script>

<section class="uk-flex uk-grid-collapse">
  <aside class="uk-width-1-4 uk-padding-small">
    {#if age !== 'archive'}
      {#if activeNoteId === 'new'}
        <button disabled class="uk-button uk-button-primary uk-display-block uk-width-1-1">?????????? ??????????????</button>
      {:else}
        <a use:link={'/note/new'} href="/" class="uk-button uk-button-primary uk-display-block uk-width-1-1">??????????
          ??????????????</a>
      {/if}
    {:else}
      <button on:click={deleteAll} class="uk-button uk-button-secondary uk-display-block uk-width-1-1">?????????????? ????????
        ??????????</button>
    {/if}

    <p>
      <!-- svelte-ignore a11y-no-onchange -->
      <select bind:value={age} on:change={fetchFromScratch} class="uk-select">
        <option value="1month">???? ??????????</option>
        <option value="3months">???? 3 ????????????</option>
        <option value="alltime">???? ?????? ??????????</option>
        <option value="archive">??????????</option>
      </select>
    </p>
    <p class="uk-search uk-search-default uk-width-1-1">
      <i class="uk-icon uk-search-icon fas fa-search" />
      <input
        bind:value={search}
        on:keyup={searchQuery}
        class="uk-search-input uk-width-1-1"
        type="search"
        placeholder="?????????? ???? ??????????????????" />
    </p>

    {#each entries as entry}
      <NoteCard {entry} isActive={entry.id === activeNoteId} />
    {/each}

    {#await fetching}
      <Progress />
    {:then hasMore}
      {#if hasMore}
        <button
          on:click={loadMore}
          class="uk-button uk-button-secondary uk-margin-top uk-display-block uk-width-1-1">?????????????????? ??????&hellip;</button>
      {/if}
    {:catch error}
      <div class="uk-alert uk-alert-danger">
        <p>????????????: {error.message}.</p>
      </div>
    {/await}
  </aside>
  <div class="uk-width-3-4 uk-padding-small">
    <Router
      {routes}
      prefix={routerPrefix}
      on:routeEvent={routeEvent}
      on:routeLoaded={() => {
        window.scrollTo(0, 0);
      }} />
  </div>
</section>
