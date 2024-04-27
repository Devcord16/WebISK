var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var https = require("https");
var JSDOM = require("jsdom").JSDOM;
var levelingData = [];
function https_fetch(url, path, method, headers, body, get_headers) {
    if (body)
        headers["Content-Length"] = body.length;
    return new Promise(function (resolve, reject) {
        var req = https.request({
            hostname: url,
            path: path,
            method: method,
            headers: __assign({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0', 'DNT': '1', 'Sec-GPC': '1', 'Connection': 'keep-alive', 'Upgrade-Insecure-Requests': '1', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': 'none', 'Sec-Fetch-User': '?1', 'TE': 'trailers' }, headers),
        }, function (res) {
            if (get_headers)
                resolve(res.headers);
            var data = '';
            res.on('data', function (chunk) { return data += chunk; });
            res.on('end', function () { return resolve(data); });
        });
        if (body)
            req.write(body);
        req.end();
    });
}
/*const refreshLeaderboardData = () => {
  https_fetch("beta.lurkr.gg", "/levels/sciencekingdom?page=1", "GET")
    .then((data) => {
      const dom = new JSDOM(data)
      console.log(data)
      levelingData = dom.window.document.querySelector(
        "script#__NEXT_DATA__"
      ).textContent;
      levelingData = JSON.parse(levelingData);
      levelingData = levelingData.props.pageProps;
    })
};

refreshLeaderboardData();

setInterval(refreshLeaderboardData, 45000);
*/
var app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.get("/", function (req, res) {
    res.render("home", { title: "Home", url: req.fullUrl });
});
app.get("/info", function (req, res) {
    res.render("info", { title: "Information", url: req.fullUrl });
});
app.get("/leaderboard", function (req, res) {
    var filteredData = levelingData.levels || [];
    var pageCount = Math.ceil(filteredData.length / 10);
    var page = parseInt(req.query.p) || 1;
    var usernameToSearch = req.query.username;
    if (usernameToSearch) {
        // If a username is provided in the query, filter the data based on the username
        filteredData = filteredData.filter(function (user) { return user.username && user.username.includes(usernameToSearch); });
    }
    if (page > pageCount) {
        page = pageCount;
    }
    var temp = __assign({}, levelingData); // Use the spread operator to create a shallow copy
    temp.levels = filteredData.slice((page - 1) * 10, page * 10);
    var levels = [];
    for (var i = 0; i < temp.levels.length; i++) {
        var originalIndex = levelingData.levels.indexOf(temp.levels[i]);
        levels.push(originalIndex + 1);
    }
    res.render("leaderboard", {
        title: "Leaderboard",
        levels: levels,
        levelingData: temp,
        page: page,
        pageCount: pageCount,
        url: req.fullUrl,
        searchTerm: usernameToSearch,
        url: req.fullUrl,
    });
});
var port = 8080;
app.listen(port, function () {
    console.log("App is running on port ".concat(port));
});
