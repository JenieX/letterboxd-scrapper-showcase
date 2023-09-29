var letterboxdScrapper = (function (exports) {
  'use strict';

  function isString(object) {
    return typeof object === 'string';
  }

  /**
   * Joins an array's items or do nothing if it is joined already.
   *
   * @category Array
   */
  function join(object, separator = ',') {
    if (isString(object)) {
      return object;
    }
    return object.join(separator);
  }

  async function fishResponse(url, options) {
    const response = await fetch(url, options);
    if (!response.ok && !response.url.startsWith('file:///')) {
      throw new Error(
        `Request to ${response.url} ended with ${response.status} status.`,
      );
    }
    return response;
  }

  // Note: to set the 'cookie' header, you have to set 'anonymous' to true.
  async function fishXResponse(url, fishOptions) {
    const { method, anonymous, headers, body, timeOut, onProgress } =
      fishOptions ?? {};
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        url,
        method: method ?? 'GET',
        headers,
        anonymous,
        data: body,
        responseType: 'blob',
        timeout: timeOut,
        onprogress: onProgress,
        onload({ response, statusText, status, finalUrl }) {
          const isFileURL = finalUrl.startsWith('file:///');
          const ok = status >= 200 && status < 300;
          if (!ok && !isFileURL) {
            reject(new Error(`Request to ${url} ended with ${status} status.`));
            return;
          }
          const properResponse = new Response(response, {
            statusText,
            status: isFileURL ? 200 : status,
          });
          Object.defineProperty(properResponse, 'url', { value: finalUrl });
          resolve(properResponse);
        },
        onerror({ status }) {
          reject(new Error(`Request to ${url} ended with ${status} status.`));
        },
      });
    });
  }

  async function fishBlob(url, options, x) {
    const response = await (x ? fishXResponse : fishResponse)(url, options);
    return response.blob();
  }

  async function fishBuffer(url, options, x) {
    const response = await (x ? fishXResponse : fishResponse)(url, options);
    return response.arrayBuffer();
  }

  async function fishDocument(url, options, x) {
    const response = await (x ? fishXResponse : fishResponse)(url, options);
    const responseText = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(responseText, 'text/html');
  }

  async function fishJSON(url, options, x) {
    const response = await (x ? fishXResponse : fishResponse)(url, options);
    return response.json();
  }

  async function fishText(url, options, x) {
    const response = await (x ? fishXResponse : fishResponse)(url, options);
    return response.text();
  }

  // https://httpbin.org/anything
  const fish = {
    blob: async (url, options) => fishBlob(url, options),
    buffer: async (url, options) => fishBuffer(url, options),
    document: async (url, options) => fishDocument(url, options),
    JSON: async (url, options) => fishJSON(url, options),
    text: async (url, options) => fishText(url, options),
  };

  function $(selectors, parent) {
    const element = (parent ?? document).querySelector(join(selectors));
    if (element === null) {
      throw new Error(
        `Could not find the element with the selector ${selectors}`,
      );
    }
    return element;
  }
  function $$(selectors, parent) {
    const elements = (parent ?? document).querySelectorAll(join(selectors));
    if (elements.length === 0) {
      throw new Error(
        `Could not find any element with the selector ${selectors}`,
      );
    }
    return elements;
  }

  function createFilmsURL(params, sortByRating) {
    const { type, user, rating, genre, sort } = params;
    const segments = [];
    segments.push(`https://letterboxd.com/${user}/films/`);
    if (rating !== undefined) {
      segments.push(`rated/${rating}/`);
    }
    if (type === 'decade') {
      segments.push(`decade/${params.decade}/`);
    }
    if (type === 'year') {
      segments.push(`year/${params.year}/`);
    }
    if (genre !== undefined) {
      segments.push(`genre/${genre}/`);
    }
    if (sortByRating === true) {
      segments.push('by/entry-rating/');
    } else if (sort !== undefined) {
      segments.push(`by/${sort}/`);
    }
    return segments.join('');
  }

  function extractFilmData(element) {
    const name = $('img', element).alt;
    const id = element.firstElementChild.dataset.targetLink;
    let rating = 0;
    try {
      const ratingElement = $('.rating', element);
      rating = Number(ratingElement.className.split('-').pop());
    } catch {}
    return {
      name,
      id: id.slice(6, -1),
      rating,
    };
  }

  async function fetchFilms(urlParams, callback, ratedOnly) {
    const films = [];
    let link = createFilmsURL(urlParams, ratedOnly);
    const signedIn = document.cookie.includes('letterboxd.signed.in.as');
    while (link !== undefined) {
      if (callback !== undefined) {
        await callback();
      }
      console.log(link);
      let documentX;
      let container;
      try {
        documentX = await fish.document(link, {
          credentials: signedIn ? 'same-origin' : 'omit',
        });
      } catch (exception) {
        throw new Error(exception.message);
      }
      // The case of a user that has not watched any films yet.
      try {
        container = $('.content-wrap ul.poster-list', documentX);
      } catch {
        return films;
      }
      const elements = $$('li[class="poster-container"]', container);
      for (const element of elements) {
        const film = extractFilmData(element);
        if (film.rating === 0 && ratedOnly === true) {
          return films;
        }
        films.push(film);
      }
      try {
        link = $('.paginate-nextprev > a.next', documentX).href;
      } catch {
        link = undefined;
      }
    }
    return films;
  }

  /** Fetches the ids of a user's friends. */
  async function fetchFriends(user, callback) {
    const friends = [];
    let link = `https://letterboxd.com/${user}/following/`;
    while (link !== undefined) {
      if (callback !== undefined) {
        await callback();
      }
      console.log(link);
      const documentX = await fish.document(link, { credentials: 'omit' });
      const avatarElements = $$('table.person-table a.avatar', documentX);
      for (const avatarElement of avatarElements) {
        friends.push(avatarElement.getAttribute('href').slice(1, -1));
      }
      try {
        link = $('.paginate-nextprev > a.next', documentX).href;
      } catch {
        link = undefined;
      }
    }
    return friends;
  }

  function createMembersURL(params) {
    const { id, type } = params;
    let usersURL = `https://letterboxd.com/film/${id}/${type}/`;
    if (type === 'members' && params.rating !== undefined) {
      usersURL += `rated/${params.rating}/`;
    }
    return usersURL;
  }

  /** Fetches users' ids in a film's members page, fans page, or likes page. */
  async function fetchMembers(urlParams, callback) {
    const users = [];
    let link = createMembersURL(urlParams);
    while (link !== undefined) {
      if (callback !== undefined) {
        await callback();
      }
      console.log(link);
      const documentX = await fish.document(link, { credentials: 'omit' });
      const elements = $$(
        '.person-table tbody > tr .person-summary > a.avatar',
        documentX,
      );
      for (const element of elements) {
        users.push(element.getAttribute('href').slice(1, -1));
      }
      try {
        link = $('.paginate-nextprev > a.next', documentX).href;
      } catch {
        link = undefined;
      }
    }
    return users;
  }

  exports.fetchFilms = fetchFilms;
  exports.fetchFriends = fetchFriends;
  exports.fetchMembers = fetchMembers;

  return exports;
})({});
