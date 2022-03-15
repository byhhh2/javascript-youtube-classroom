import VideoStore from '../VideoStore';
import { on, $, fetchData } from '../utils';
import { ERROR_MESSAGE, SEARCH_API } from '../constants';

class Search {
  debounce;

  constructor() {
    this.subscribeEvents();
    this.keyword = '';
    this.nextPageToken = '';
  }

  subscribeEvents() {
    on('form', '@search', (e) => this.debounceSearch('search', e.detail.keyword), $('search-form'));
    on('ul', '@scroll', () => this.debounceSearch('scroll'), $('search-result'));
  }

  loading(type) {
    $('ul', $('search-result')).insertSkeleton(type);
  }

  debounceSearch(type, keyword = this.keyword) {
    this.loading(type);

    if (this.debounce) {
      clearTimeout(this.debounce);
    }

    this.debounce = setTimeout(() => {
      this.search(type, keyword);
    }, 500);
  }

  async search(type, keyword) {
    try {
      SEARCH_API.URL.search = this.generateSearchParams(keyword);
      const videos = await fetchData(SEARCH_API.URL);

      this.keyword = keyword;
      this.nextPageToken = videos.nextPageToken ?? '';

      VideoStore.instance.dispatch(type, this.preprocessor(videos));
    } catch (e) {
      alert(ERROR_MESSAGE.FAIL_TO_REQUEST_API);
    }
  }

  generateSearchParams(keyword) {
    return new URLSearchParams({
      ...SEARCH_API.PARAMS,
      pageToken: this.nextPageToken,
      q: keyword,
    }).toString();
  }

  preprocessor(videos) {
    return videos.items.map((item) => {
      return {
        id: item.id.videoId,
        thumbnail: encodeURI(item.snippet.thumbnails.default.url),
        title: encodeURI(item.snippet.title),
        channelTitle: encodeURI(item.snippet.channelTitle),
        publishedAt: item.snippet.publishedAt,
      };
    });
  }
}

export default Search;
