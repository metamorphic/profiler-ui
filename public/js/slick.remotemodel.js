(function ($) {
  function RemoteModel() {
    // private
    var PAGESIZE = 50;
    //var data = {length: 0};
    var data = [];
    var searchstr = "";
    var sortcol = null;
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request
    var pagesize = 0;
    var pagenum = 0;
    var totalRows = 0;

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();
    var onPagingInfoChanged = new Slick.Event();

    function init() {
      setPagingOptions({pagesize: PAGESIZE, pagenum: 1});
    }

    function isDataLoaded(from, to) {
      for (var i = from; i <= to; i++) {
        if (data[i] == undefined || data[i] == null) {
          return false;
        }
      }
      return true;
    }

    function clear() {
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }

    function ensureData(from, to) {
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * PAGESIZE] = undefined;
      }

      if (from < 0) {
        from = 0;
      }

      if (data.length > 0) {
        to = Math.min(to, data.length - 1);
      }

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined)) {
        // TODO:  look-ahead
        onDataLoaded.notify({from: from, to: to});
        //onPagingInfoChanged.notify(getPagingInfo());
        return;
      }

      //var url = "http://api.thriftdb.com/api.hnsearch.com/items/_search?filter[fields][type][]=submission&q=" + searchstr + "&start=" + (fromPage * PAGESIZE) + "&limit=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);
      var url = "http://localhost:7001/api/column-list?page=" + fromPage + "&size=" + PAGESIZE;

      if (sortcol != null) {
        url += ("&sortby=" + sortcol + ((sortdir > 0) ? "+asc" : "+desc"));
      }

      if (h_request != null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function () {
        for (var i = fromPage; i <= toPage; i++)
          data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'

        onDataLoading.notify({from: from, to: to});

        //req = $.jsonp({
        //  url: url,
        //  callbackParameter: "callback",
        //  cache: true,
        //  success: onSuccess,
        //  error: function () {
        //    onError(fromPage, toPage)
        //  }
        //});
        req = $.ajax({
          url: url,
          cache: true,
          success: onSuccess,
          error: function () {
            onError(fromPage, toPage)
          }
        });
        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }


    function onError(fromPage, toPage) {
      alert("error loading pages " + fromPage + " to " + toPage);
    }

    function onSuccess(resp) {
      var results = resp._embedded.columnListItems;
      var from = resp.page.number * resp.page.size;
      var to = from + results.length;
      totalRows = resp.page.totalElements;

      for (var i = 0; i < results.length; i++) {
        var item = results[i];

        // Old IE versions can't parse ISO dates, so change to universally-supported format.
        //item.create_ts = item.create_ts.replace(/^(\d+)-(\d+)-(\d+)T(\d+:\d+:\d+)Z$/, "$2/$3/$1 $4 UTC");
        //item.create_ts = new Date(item.create_ts);

        data[from + i] = item;
        data[from + i].index = from + i;
      }

      req = null;

      onDataLoaded.notify({from: from, to: to});
      onPagingInfoChanged.notify(getPagingInfo());
    }

    function reloadData(from, to) {
      for (var i = from; i <= to; i++)
        delete data[i];

      ensureData(from, to);
    }

    function setSort(column, dir) {
      sortcol = column;
      sortdir = dir;
      clear();
    }

    function setSearch(str) {
      searchstr = str;
      clear();
    }

    function setPagingOptions(args) {
      if (args.pageSize != undefined) {
        pagesize = args.pageSize;
        pagenum = pagesize ? Math.min(pagenum, Math.max(0, Math.ceil(totalRows / pagesize) - 1)) : 0;
      }

      if (args.pageNum != undefined) {
        pagenum = Math.min(args.pageNum, Math.max(0, Math.ceil(totalRows / pagesize) - 1));
      }

      onPagingInfoChanged.notify(getPagingInfo(), null, self);

      //refresh();
    }

    function getPagingInfo() {
      var totalPages = pagesize ? Math.max(1, Math.ceil(totalRows / pagesize)) : 1;
      return {pageSize: pagesize, pageNum: pagenum, totalRows: totalRows, totalPages: totalPages};
    }

    function getRowCount() {
      return data.length;
    }

    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,
      "setPagingOptions": setPagingOptions,
      "getPagingInfo": getPagingInfo,
      "getRowCount": getRowCount,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded,
      "onPagingInfoChanged": onPagingInfoChanged
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, { Slick: { Data: { RemoteModel: RemoteModel }}});
})(jQuery);