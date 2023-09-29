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

async function main() {
  console.log('Hello!');
}

main().catch((exception) => {
  console.error(exception);
});
