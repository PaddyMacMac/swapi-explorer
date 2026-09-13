// Shared test helper: the minimal page markup the presentation layer reads
// element ids from. Centralised so every test that needs a real DOM builds
// the exact same fixture instead of each file hand-rolling a slightly
// different copy that quietly drifts from index.html.

export const buildSwapiExplorerDom = () => {
  document.body.innerHTML = `
    <div id="resource-tabs">
      <button type="button" class="resource-tab active" data-resource="people" aria-selected="true">Characters</button>
      <button type="button" class="resource-tab" data-resource="films" aria-selected="false">Films</button>
      <button type="button" class="resource-tab" data-resource="planets" aria-selected="false">Planets</button>
      <button type="button" class="resource-tab" data-resource="starships" aria-selected="false">Starships</button>
    </div>
    <label for="entity-picker">Jump to</label>
    <select id="entity-picker" aria-label="Jump to a specific entry">
      <option value="" selected disabled>Choose an entry…</option>
    </select>
    <button type="button" id="view-details-btn" disabled>View details</button>
    <div id="status"></div>
    <section id="results"></section>
    <div id="detailsModal" role="dialog" aria-hidden="true">
      <p id="detailsModalKicker"></p>
      <h2 id="detailsModalLabel"></h2>
      <div id="detailsModalBody"></div>
      <button type="button" id="detailsModalCloseBtn" aria-label="Close"></button>
      <button type="button" id="detailsModalCloseFooterBtn">Close</button>
    </div>`;
};
