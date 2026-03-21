// 优化后的JavaScript代码，减少移动端性能消耗

document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

function handlePress(event) {
    this.classList.add('pressed');
}

function handleRelease(event) {
    this.classList.remove('pressed');
}

function handleCancel(event) {
    this.classList.remove('pressed');
}

var buttons = document.querySelectorAll('.projectItem');
buttons.forEach(function (button) {
    button.addEventListener('mousedown', handlePress);
    button.addEventListener('mouseup', handleRelease);
    button.addEventListener('mouseleave', handleCancel);
    button.addEventListener('touchstart', handlePress);
    button.addEventListener('touchend', handleRelease);
    button.addEventListener('touchcancel', handleCancel);
});

function toggleClass(selector, className) {
    var elements = document.querySelectorAll(selector);
    elements.forEach(function (element) {
        element.classList.toggle(className);
    });
}

function pop(imageURL) {
    var tcMainElement = document.querySelector(".tc-img");
    if (imageURL) {
        tcMainElement.src = imageURL;
    }
    toggleClass(".tc-main", "active");
    toggleClass(".tc", "active");
}

var tc = document.getElementsByClassName('tc');
var tc_main = document.getElementsByClassName('tc-main');
tc[0].addEventListener('click', function (event) {
    pop();
});
tc_main[0].addEventListener('click', function (event) {
    event.stopPropagation();
});



function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) == 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}


document.addEventListener('DOMContentLoaded', function () {
    var html = document.querySelector('html');
    var themeState = getCookie("themeState") || "Light";

    function changeTheme(theme) {
        html.dataset.theme = theme;
        setCookie("themeState", theme, 365);
        themeState = theme;
    }

    var Checkbox = document.getElementById('myonoffswitch')
    Checkbox.addEventListener('change', function () {
        if (themeState == "Dark") {
            changeTheme("Light");
        } else if (themeState == "Light") {
            changeTheme("Dark");
        } else {
            changeTheme("Dark");
        }
    });

    if (themeState == "Dark") {
        Checkbox.checked = false;
    }

    changeTheme(themeState);

    // 导航标签切换
    var navTabs = document.querySelectorAll('.nav-tab');
    var tabPanes = document.querySelectorAll('.tab-pane');

    navTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var targetTab = this.getAttribute('data-tab');

            navTabs.forEach(function (t) {
                t.classList.remove('active');
            });
            tabPanes.forEach(function (pane) {
                pane.classList.remove('active');
            });

            this.classList.add('active');
            var targetPane = document.getElementById('tab-' + targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // 自动加载文章列表
    loadArticleList();
});


var pageLoading = document.querySelector("#page-loading");
window.addEventListener('load', function() {
    setTimeout(function () {
        pageLoading.style.opacity = '0';
    }, 100);
});


// ===== 工具函数 =====
function parseFrontmatter(text) {
    var match = text.match(/^---[ \t]*[\r\n]([\s\S]*?)[\r\n]---[ \t]*[\r\n]/);
    if (!match) return {};
    var meta = {};
    match[1].split('\n').forEach(function(line) {
        var idx = line.indexOf(':');
        if (idx > 0) {
            meta[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
        }
    });
    return meta;
}

function stripFrontmatter(text) {
    return text.replace(/^---[ \t]*[\r\n][\s\S]*?[\r\n]---[ \t]*[\r\n]/, '');
}

function formatChineseDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;
    var year = parts[0];
    var month = parseInt(parts[1], 10);
    var chineseMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    var monthStr = chineseMonths[month - 1] || month;
    return year + '年' + monthStr + '月';
}

function fetchFile(url, callback) {
    var xhr = new XMLHttpRequest();
    // 添加时间戳禁用缓存
    var cacheBuster = url + (url.indexOf('?') > -1 ? '&' : '?') + '_t=' + Date.now();
    xhr.open('GET', cacheBuster, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) return;
        if (xhr.status === 200 || xhr.status === 0) {
            callback(null, xhr.responseText);
        } else {
            callback('HTTP ' + xhr.status, null);
        }
    };
    xhr.onerror = function() { callback('Network error', null); };
    xhr.send();
}


// ===== 动态文章列表 =====
var _allArticles = []; // 缓存所有文章数据

function loadArticleList() {
    var listEl = document.getElementById('article-list');
    if (!listEl) return;

    fetchFile('./static/md/articles.json', function(err, data) {
        if (err) {
            listEl.innerHTML = '<p class="article-loading">文章列表加载失败。</p>';
            return;
        }

        var fileNames;
        try { fileNames = JSON.parse(data); } catch(e) {
            listEl.innerHTML = '<p class="article-loading">文章列表解析失败。</p>';
            return;
        }

        if (fileNames.length === 0) {
            listEl.innerHTML = '<p class="article-loading">暂无文章。</p>';
            return;
        }

        var articles = [];
        var loaded = 0;
        var total = fileNames.length;

        fileNames.forEach(function(fileName) {
            fetchFile('./static/md/' + encodeURIComponent(fileName), function(err2, content) {
                loaded++;
                if (!err2 && content) {
                    var meta = parseFrontmatter(content);
                    articles.push({
                        file: fileName,
                        title: fileName.replace(/\.(md|mdx)$/, ''),
                        date: meta.date || '',
                        description: meta.description || '',
                        categories: meta.categories || '其他'
                    });
                }
                if (loaded === total) {
                    articles.sort(function(a, b) {
                        return (b.date || '').localeCompare(a.date || '');
                    });
                    _allArticles = articles;
                    renderArticleList(listEl, articles);
                    initCategoryTabs();
                }
            });
        });
    });
}

function renderArticleList(container, articles) {
    var html = '<div class="blog-list">';
    articles.forEach(function(a) {
        var dateDisplay = formatChineseDate(a.date);
        html += '<div class="blog-list-item" onclick="loadArticle(\'' +
            a.file.replace(/'/g, "\\'") + '\', \'' +
            a.title.replace(/'/g, "\\'") + '\')">' +
            '<div class="blog-list-title">' + a.title + '</div>' +
            '<div class="blog-list-meta">' +
            (dateDisplay ? '<span class="blog-list-date">' + dateDisplay + '</span>' : '') +
            (a.description ? '<span class="blog-list-desc">' + a.description + '</span>' : '') +
            '</div>' +
            '</div>';
    });
    if (articles.length === 0) {
        html += '<p class="article-loading">该分类暂无文章。</p>';
    }
    html += '</div>';
    container.innerHTML = html;
}

function initCategoryTabs() {
    var tabs = document.querySelectorAll('.category-tab');
    var listEl = document.getElementById('article-list');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var cat = tab.getAttribute('data-category');
            if (cat === 'all') {
                renderArticleList(listEl, _allArticles);
            } else {
                var filtered = _allArticles.filter(function(a) {
                    return a.categories === cat;
                });
                renderArticleList(listEl, filtered);
            }
        });
    });
}


// ===== 文章内嵌阅读器 =====
function loadArticle(fileName, title) {
    var articleList = document.getElementById('article-list');
    var articleReader = document.getElementById('article-reader');
    var articleContent = document.getElementById('article-content');
    var articleBadge = document.getElementById('article-badge');

    var filePath = './static/md/' + encodeURIComponent(fileName);
    var ext = fileName.split('.').pop().toLowerCase();

    articleList.style.display = 'none';
    articleReader.style.display = 'block';
    articleContent.innerHTML = '加载中…';
    articleBadge.textContent = fileName + ' (' + ext.toUpperCase() + ')';

    // 设置独立页面链接
    var permalink = document.getElementById('article-permalink');
    if (permalink) {
        permalink.href = './notes.html?file=' + encodeURIComponent(fileName);
    }

    fetchFile(filePath, function(err, content) {
        if (err || !content) {
            articleContent.innerHTML = '<p>内容加载失败。本地预览请使用 start-server.bat。</p>';
            return;
        }

        content = stripFrontmatter(content);

        if (ext === 'mdx') {
            content = content
                .replace(/^import\s+.*$/gm, '')
                .replace(/^export\s+default\s+.*$/gm, '')
                .replace(/^export\s+.*$/gm, '')
                .replace(/<([A-Z][A-Za-z0-9]*)\s*([^>]*?)\/>/g, function(match, tag, attrs) {
                    return '> **[组件: ' + tag + ']** ' + attrs.trim();
                })
                .replace(/<([A-Z][A-Za-z0-9]*)\s*([^>]*)>([\s\S]*?)<\/\1>/g, function(match, tag, attrs, inner) {
                    return '> **[' + tag + ']**\n>\n> ' + inner.trim().replace(/\n/g, '\n> ');
                });
        }

        var articleTitle = '<h1>' + fileName.replace(/\.(md|mdx)$/, '') + '</h1>';
        articleContent.innerHTML = articleTitle + marked.parse(content);
    });
}

function closeArticle() {
    var articleList = document.getElementById('article-list');
    var articleReader = document.getElementById('article-reader');
    articleReader.style.display = 'none';
    articleList.style.display = 'block';
}
