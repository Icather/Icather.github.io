/**
 * 公共工具函数 - 被 index.html 和 notes.html 共享
 */

/**
 * HTML 特殊字符转义，防止 XSS 注入
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 解析 Markdown 文件头部的 YAML frontmatter
 * @param {string} text - Markdown 原文
 * @returns {Object} 解析出的元数据键值对
 */
function parseFrontmatter(text) {
    const match = text.match(/^---[ \t]*[\r\n]([\s\S]*?)[\r\n]---[ \t]*[\r\n]/);
    if (!match) return {};
    const meta = {};
    match[1].split('\n').forEach(function (line) {
        const idx = line.indexOf(':');
        if (idx > 0) {
            meta[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
        }
    });
    return meta;
}

/**
 * 剥离 Markdown 文件的 YAML frontmatter
 * @param {string} text - Markdown 原文
 * @returns {string} 去掉 frontmatter 后的正文
 */
function stripFrontmatter(text) {
    return text.replace(/^---[ \t]*[\r\n][\s\S]*?[\r\n]---[ \t]*[\r\n]/, '');
}

/**
 * 将 MDX 语法降级为标准 Markdown（移除 import/export 和 JSX 组件标签）
 * @param {string} content - MDX 内容
 * @returns {string} 降级后的 Markdown
 */
function degradeMDX(content) {
    return content
        .replace(/^import\s+.*$/gm, '')
        .replace(/^export\s+default\s+.*$/gm, '')
        .replace(/^export\s+.*$/gm, '')
        .replace(/<([A-Z][A-Za-z0-9]*)\s*([^>]*?)\/>/g, function (match, tag, attrs) {
            return '> **[组件: ' + tag + ']** ' + attrs.trim();
        })
        .replace(/<([A-Z][A-Za-z0-9]*)\s*([^>]*)>([\s\S]*?)<\/\1>/g, function (match, tag, attrs, inner) {
            return '> **[' + tag + ']**\n>\n> ' + inner.trim().replace(/\n/g, '\n> ');
        });
}

/**
 * 将日期字符串格式化为中文显示（如 "2026年五月"）
 * @param {string} dateStr - 格式为 "YYYY-MM-DD" 或 "YYYY-MM-DD HH:mm:ss"
 * @returns {string} 中文格式的日期
 */
function formatChineseDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const chineseMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const monthStr = chineseMonths[month - 1] || month;
    return year + '年' + monthStr + '月';
}

/**
 * 兼容 file:// 协议的网络请求（fetch 不支持 file:// 协议）
 * @param {string} url - 请求地址
 * @returns {Promise<string>} 响应文本
 */
function fetchFile(url) {
    var cacheBuster = url + (url.indexOf('?') > -1 ? '&' : '?') + '_t=' + Date.now();
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', cacheBuster, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            // status === 0 表示 file:// 协议下的成功响应
            if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.responseText);
            } else {
                reject(new Error('HTTP ' + xhr.status));
            }
        };
        xhr.onerror = function () { reject(new Error('Network error')); };
        xhr.send();
    });
}
