type Fn<T = void, U = any> = (param?: U) => T;

interface FetchFilmsURLParamsDefault {
  type: 'default';
  user: string;
  rating?: string;
  genre?: string;
  /** Will default to "entry-rating" if the option "ratedOnly" is present. */
  sort?: string;
}
type Decade = `${
  | 1870
  | 1880
  | 1890
  | 1900
  | 1910
  | 1920
  | 1930
  | 1940
  | 1950
  | 1960
  | 1970
  | 1980
  | 1990
  | 2000
  | 2010
  | 2020}s`;
interface FetchFilmsParamsWithDecade
  extends Omit<FetchFilmsURLParamsDefault, 'type'> {
  type: 'decade';
  decade: Decade;
}
interface FetchFilmsParamsWithYear
  extends Omit<FetchFilmsURLParamsDefault, 'type'> {
  type: 'year';
  year: number;
}
type FetchFilmsURLParams =
  | FetchFilmsParamsWithDecade
  | FetchFilmsParamsWithYear
  | FetchFilmsURLParamsDefault;

type FilmRating = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
interface UserFilm {
  name: string;
  id: string;
  rating: FilmRating;
}

type Cb = Fn<Promise<void>>;
declare function fetchFilms(
  urlParams: FetchFilmsURLParams,
  callback?: Cb,
  ratedOnly?: boolean,
): Promise<UserFilm[]>;

/** Fetches the ids of a user's friends. */
declare function fetchFriends(
  user: string,
  callback?: Fn<Promise<void>>,
): Promise<string[]>;

type FetchMembersURLParams =
  | {
      type: 'fans' | 'likes';
      id: string;
    }
  | {
      type: 'members';
      id: string;
      rating?: string;
    };

/** Fetches users' ids in a film's members page, fans page, or likes page. */
declare function fetchMembers(
  urlParams: FetchMembersURLParams,
  callback?: Fn<Promise<void>>,
): Promise<string[]>;

export { FilmRating, UserFilm, fetchFilms, fetchFriends, fetchMembers };
