// ==UserScript==
// @name           letterboxd-scrapper-showcase
// @version        0.0.1
// @namespace      https://github.com/JenieX
// @description    Showcase Letterboxd scrapper library
// @author         JenieX
// @match          *://*/*
// @grant          GM.xmlHttpRequest
// @require        https://github.com/JenieX/letterboxd-scrapper-showcase/raw/main/lib.js
// @run-at         document-start
// @noframes
// @icon           https://letterboxd.com/favicon.ico
// ==/UserScript==

/** @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} FilmRating */
/** @typedef {{ name: string; id: string; rating: FilmRating }} UserFilm */

async function main() {
  const user = 'rksO0';
  const filmId = 'head-to-head-2023-1';

  // ------------------------

  console.log(`%cFetching ${user}'s friends..`, 'color: #00ffbb');

  /** @type {string[]} */
  const friends = await letterboxdScrapper.fetchFriends(user);

  console.log(friends);

  // ------------------------

  console.log(`%cFetching ${user}'s films..`, 'color: #00ffbb');

  /** @type {UserFilm[]} */
  const films = await letterboxdScrapper.fetchFilms({
    type: 'default',
    user,
    rating: '5',
    genre: 'action',
    sort: 'name',
  });

  console.log(films);

  // ------------------------

  console.log(`%cFetching ${filmId} users..`, 'color: #00ffbb');

  /** @type {string[]} */
  const members = await letterboxdScrapper.fetchMembers({
    type: 'members',
    id: filmId,
    rating: '5',
  });

  console.log(members);
}

main().catch((exception) => {
  console.error(exception);
});
