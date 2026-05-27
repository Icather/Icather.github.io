// ===== 主脚本 =====
// 依赖: utils.js（需在此文件之前加载）

// ===== 项目卡片按压效果 =====
const buttons = document.querySelectorAll('.projectItem');
buttons.forEach(function (button) {
    button.addEventListener('mousedown', function () { this.classList.add('pressed'); });
    button.addEventListener('mouseup', function () { this.classList.remove('pressed'); });
    button.addEventListener('mouseleave', function () { this.classList.remove('pressed'); });
    button.addEventListener('touchstart', function () { this.classList.add('pressed'); });
    button.addEventListener('touchend', function () { this.classList.remove('pressed'); });
    button.addEventListener('touchcancel', function () { this.classList.remove('pressed'); });
});

// ===== 图片弹窗 =====
function toggleClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(function (element) {
        element.classList.toggle(className);
    });
}

function pop(imageURL) {
    const tcImgEl = document.querySelector('.tc-img');
    if (imageURL) {
        tcImgEl.src = imageURL;
        tcImgEl.alt = '弹窗图片';
    }
    toggleClass('.tc-main', 'active');
    toggleClass('.tc', 'active');
}

const tc = document.getElementsByClassName('tc');
const tcMain = document.getElementsByClassName('tc-main');
tc[0].addEventListener('click', function () { pop(); });
tcMain[0].addEventListener('click', function (event) { event.stopPropagation(); });

// ===== 主题切换（localStorage） =====
document.addEventListener('DOMContentLoaded', function () {
    const html = document.querySelector('html');
    let themeState = localStorage.getItem('themeState') || 'Light';

    function changeTheme(theme) {
        html.dataset.theme = theme;
        localStorage.setItem('themeState', theme);
        themeState = theme;
    }

    const checkbox = document.getElementById('myonoffswitch');
    checkbox.addEventListener('change', function () {
        changeTheme(themeState === 'Dark' ? 'Light' : 'Dark');
    });

    if (themeState === 'Dark') {
        checkbox.checked = false;
    }
    changeTheme(themeState);

    // 导航标签切换
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            navTabs.forEach(function (t) { t.classList.remove('active'); });
            tabPanes.forEach(function (pane) { pane.classList.remove('active'); });
            this.classList.add('active');
            const targetPane = document.getElementById('tab-' + targetTab);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // 自动加载文章列表
    loadArticleList();
});

// ===== 页面加载动画 =====
const pageLoading = document.querySelector('#page-loading');
window.addEventListener('load', function () {
    setTimeout(function () {
        pageLoading.style.opacity = '0';
    }, 100);
});

// ===== 动态文章列表（直接读取内嵌元数据，消除 N+1 请求） =====
let _allArticles = [];

function loadArticleList() {
    const listEl = document.getElementById('article-list');
    if (!listEl) return;

    // 使用全局变量 ARTICLES_DATA 替代 fetchFile（兼容 file:// 协议且消除网络请求）
    initCategoryTabs();
    if (typeof ARTICLES_DATA !== 'undefined') {
        if (ARTICLES_DATA.length === 0) {
            listEl.innerHTML = '<p class="article-loading">暂无文章。</p>';
            return;
        }
        // 元数据已内嵌在 JSON 中，直接使用，无需逐个请求文件
        _allArticles = ARTICLES_DATA.map(function (a) {
            return {
                file: a.file,
                title: a.file.replace(/\.(md|mdx)$/, ''),
                date: a.date || '',
                description: a.description || '',
                categories: a.categories || '其他'
            };
        });
        renderArticleList(listEl, _allArticles);
    } else {
        listEl.innerHTML = '<p class="article-loading">文章列表加载失败（ARTICLES_DATA 未定义）。</p>';
    }
}

function renderArticleList(container, articles) {
    let html = '<div class="blog-list">';
    articles.forEach(function (a) {
        const dateDisplay = formatChineseDate(a.date);
        const safeFile = escapeHTML(a.file);
        const safeTitle = escapeHTML(a.title);
        const safeDesc = escapeHTML(a.description);
        html += '<div class="blog-list-item" data-file="' + safeFile + '">' +
            '<div class="blog-list-title">' + safeTitle + '</div>' +
            '<div class="blog-list-meta">' +
            (dateDisplay ? '<span class="blog-list-date">' + dateDisplay + '</span>' : '') +
            (a.description ? '<span class="blog-list-desc">' + safeDesc + '</span>' : '') +
            '</div></div>';
    });
    if (articles.length === 0) {
        html += '<p class="article-loading">该分类暂无文章。</p>';
    }
    html += '</div>';
    container.innerHTML = html;

    // 使用事件委托绑定点击
    container.querySelectorAll('.blog-list-item').forEach(function (item) {
        item.addEventListener('click', function () {
            const file = this.getAttribute('data-file');
            const title = file.replace(/\.(md|mdx)$/, '');
            loadArticle(file, title);
        });
    });
}

function initCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    const listEl = document.getElementById('article-list');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            const cat = tab.getAttribute('data-category');
            if (cat === 'all') {
                renderArticleList(listEl, _allArticles);
            } else {
                const filtered = _allArticles.filter(function (a) {
                    return a.categories === cat;
                });
                renderArticleList(listEl, filtered);
            }
        });
    });
}

// ===== 文章内嵌阅读器 =====
function loadArticle(fileName, title) {
    const articleList = document.getElementById('article-list');
    const articleReader = document.getElementById('article-reader');
    const articleContent = document.getElementById('article-content');
    const articleBadge = document.getElementById('article-badge');
    const ext = fileName.split('.').pop().toLowerCase();

    articleList.style.display = 'none';
    articleReader.style.display = 'block';
    articleContent.innerHTML = '加载中…';
    articleBadge.textContent = fileName + ' (' + ext.toUpperCase() + ')';

    // 设置独立页面链接
    const permalink = document.getElementById('article-permalink');
    if (permalink) {
        permalink.href = './notes.html?file=' + encodeURIComponent(fileName);
    }

    fetchFile('./static/md/' + encodeURIComponent(fileName))
        .then(function (content) {
            content = stripFrontmatter(content);
            if (ext === 'mdx') {
                content = degradeMDX(content);
            }
            const safeTitle = escapeHTML(fileName.replace(/\.(md|mdx)$/, ''));
            articleContent.innerHTML = '<h1>' + safeTitle + '</h1>' + marked.parse(content);
        })
        .catch(function () {
            articleContent.innerHTML = '<p>内容加载失败。本地预览请使用 start-server.bat。</p>';
        });
}

function closeArticle() {
    const articleList = document.getElementById('article-list');
    const articleReader = document.getElementById('article-reader');
    articleReader.style.display = 'none';
    articleList.style.display = 'block';
}
