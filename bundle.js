(function () {
  // A Simple EventListener
  [Element, Document, Window].forEach((target) => {
    target.prototype._addEventListener = target.prototype.addEventListener;
    target.prototype._removeEventListener =
      target.prototype.removeEventListener;
    target.prototype.addEventListener = target.prototype.on = function (
      name,
      listener,
      options
    ) {
      if (!this.__listeners__) {
        this.__listeners__ = {};
      }
      if (!this.__listeners__[name]) {
        this.__listeners__[name] = [];
      }
      // Check if the listener is already added
      for (let [l, o] of this.__listeners__[name]) {
        if (l === listener && JSON.stringify(o) === JSON.stringify(options)) {
          return this; // Listener is already added, do nothing
        }
      }
      this.__listeners__[name].push([listener, options]);
      this._addEventListener(name, listener, options);
      return this;
    };
    target.prototype.removeEventListener = target.prototype.off = function (
      name,
      listener,
      options
    ) {
      if (!this.__listeners__ || !this.__listeners__[name]) {
        return this;
      }
      if (!listener) {
        // remove all event listeners
        this.__listeners__[name].forEach(([listener, options]) => {
          this.removeEventListener(name, listener, options);
        });
        delete this.__listeners__[name];
        return this;
      }
      this._removeEventListener(name, listener, options);
      this.__listeners__[name] = this.__listeners__[name].filter(
        ([l, o]) =>
          l !== listener || JSON.stringify(o) !== JSON.stringify(options)
      );
      if (this.__listeners__[name].length === 0) {
        delete this.__listeners__[name];
      }
      return this;
    };
  });
  // Simple Selector
  window._$ = (selector) => {
    if (
      selector.startsWith("#") &&
      !selector.includes(" ") &&
      !selector.includes(".")
    ) {
      return document.getElementById(selector.slice(1));
    }
    return document.querySelector(selector);
  };
  window._$$ = (selector) => document.querySelectorAll(selector);

  // dark_mode
  let mode = window.localStorage.getItem("dark_mode");
  const setDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    const iconHtml = `<a id="nav-${
      isDark ? "sun" : "moon"
    }-btn" class="nav-icon dark-mode-btn"></a>`;
    document
      .getElementById("sub-nav")
      .insertAdjacentHTML("beforeend", iconHtml);
    document.body.dispatchEvent(
      new CustomEvent(isDark ? "dark-theme-set" : "light-theme-set")
    );
  };
  if (mode === null) {
    const domMode = document.documentElement.getAttribute("data-theme");
    mode = domMode === "dark" ? "true" : "false";
    window.localStorage.setItem("dark_mode", mode);
  }
  setDarkMode(mode === "true");

  document
    .querySelector(".dark-mode-btn")
    .addEventListener("click", function () {
      const id = this.id;
      if (id == "nav-sun-btn") {
        window.localStorage.setItem("dark_mode", "false");
        document.body.dispatchEvent(new CustomEvent("light-theme-set"));
        document.documentElement.removeAttribute("data-theme");
        this.id = "nav-moon-btn";
      } else {
        window.localStorage.setItem("dark_mode", "true");
        document.body.dispatchEvent(new CustomEvent("dark-theme-set"));
        document.documentElement.setAttribute("data-theme", "dark");
        this.id = "nav-sun-btn";
      }
    });

  let oldScrollTop = 0;
  document.addEventListener("scroll", () => {
    let scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const diffY = scrollTop - oldScrollTop;
    window.diffY = diffY;
    oldScrollTop = scrollTop;
    if (diffY < 0) {
      document
        .getElementById("header-nav")
        .classList.remove("header-nav-hidden");
    } else {
      _$("#header-nav").classList.add("header-nav-hidden");
    }
  });

  if (window.Pace) {
    Pace.on('done', function () {
      Pace.sources[0].elements = [];
    });
  }
})();

var safeImport = async function(url, integrity) {
  if (!integrity) {
    return import(url);
  }
  const response = await fetch(url);
  const moduleContent = await response.text();

  const actualHash = await crypto.subtle.digest(
    'SHA-384',
    new TextEncoder().encode(moduleContent)
  );
  const hashBase64 = 'sha384-' + btoa(
    String.fromCharCode(...new Uint8Array(actualHash))
  );

  if (hashBase64 !== integrity) {
    throw new Error(`Integrity check failed for ${url}`);
  }

  const blob = new Blob([moduleContent], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  const module = await import(blobUrl);
  URL.revokeObjectURL(blobUrl);

  return module;
};
;
// simplify from https://github.com/michalsnik/aos

var debounce = (func, delay) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

var throttle = (func, limit) => {
  let lastFunc, lastRan;

  return (...args) => {
    const context = this;
    if (!lastRan || Date.now() - lastRan >= limit) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        func.apply(context, args);
        lastRan = Date.now();
      }, limit - (Date.now() - lastRan));
    }
  };
};

var __aosScrollHandler;
var __aosResizeHandler;
var __observer;

(() => {
  let options = {
    offset: 120,
    delay: 0,
    duration: 400,
    disable: false,
    once: false,
    startEvent: "DOMContentLoaded",
    throttleDelay: 99,
    debounceDelay: 50,
  };

  let $aosElements = [];
  let initialized = false;

  const getOffset = (el) => {
    let left = 0;
    let top = 0;

    while (el) {
      left += el.offsetLeft - (el.tagName != "BODY" ? el.scrollLeft : 0);
      top += el.offsetTop - (el.tagName != "BODY" ? el.scrollTop : 0);
      el = el.offsetParent;
    }

    return {
      top,
      left,
    };
  };

  const containsAOSNode = (nodes) => {
    return [...nodes].some((node) => {
      return (
        node.dataset?.aos || (node.children && containsAOSNode(node.children))
      );
    });
  };

  const observe = (fn) => {
    __observer?.disconnect();

    __observer = new MutationObserver((mutations) => {
      if (
        mutations?.some(({ addedNodes, removedNodes }) =>
          containsAOSNode([...addedNodes, ...removedNodes])
        )
      ) {
        fn();
      }
    });

    __observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  const setState = (el, top, once) => {
    const attrOnce = el.node.getAttribute("data-aos-once");

    if (top > el.position) {
      el.node.classList.add("aos-animate");
    } else if (attrOnce === "false" || (!once && attrOnce !== "true")) {
      el.node.classList.remove("aos-animate");
    }
  };

  const handleScroll = ($elements, once) => {
    const threshold = window.innerHeight + window.scrollY;
    $elements.forEach((el) => setState(el, threshold, once));
  };

  const calculateOffset = (el, optionalOffset) => {
    let elementOffsetTop = 0;
    let additionalOffset = 0;
    const windowHeight = window.innerHeight;
    const attrs = {
      offset: el.getAttribute("data-aos-offset"),
      anchor: el.getAttribute("data-aos-anchor"),
      anchorPlacement: el.getAttribute("data-aos-anchor-placement"),
    };

    if (attrs.offset) {
      additionalOffset = parseInt(attrs.offset);
    }

    if (attrs.anchor) {
      el = _$(attrs.anchor) || el;
    }

    elementOffsetTop = getOffset(el).top;

    switch (attrs.anchorPlacement) {
      case "top-bottom":
        // Default offset
        break;
      case "center-bottom":
        elementOffsetTop += el.offsetHeight / 2;
        break;
      case "bottom-bottom":
        elementOffsetTop += el.offsetHeight;
        break;
      case "top-center":
        elementOffsetTop += windowHeight / 2;
        break;
      case "bottom-center":
        elementOffsetTop += windowHeight / 2 + el.offsetHeight;
        break;
      case "center-center":
        elementOffsetTop += windowHeight / 2 + el.offsetHeight / 2;
        break;
      case "top-top":
        elementOffsetTop += windowHeight;
        break;
      case "bottom-top":
        elementOffsetTop += el.offsetHeight + windowHeight;
        break;
      case "center-top":
        elementOffsetTop += el.offsetHeight / 2 + windowHeight;
        break;
    }

    if (!attrs.anchorPlacement && !attrs.offset) {
      additionalOffset = optionalOffset;
    }

    return elementOffsetTop + additionalOffset;
  };

  const prepare = ($elements, options) => {
    $elements.forEach((el) => {
      el.node.classList.add("aos-init");
      el.position = calculateOffset(el.node, options.offset);
    });
    return $elements;
  };

  const refresh = (initialize = false) => {
    if (initialize) initialized = true;

    if (initialized) {
      $aosElements = prepare($aosElements, options);
      handleScroll($aosElements, options.once);
      return $aosElements;
    }
  };

  const refreshHard = () => {
    $aosElements = [..._$$("[data-aos]")].map((node) => ({
      node,
    }));
    refresh();
  };

  const init = (opts) => {
    options = { ...options, ...opts };
    $aosElements = [..._$$("[data-aos]")].map((node) => ({
      node,
    }));
    if (options.disable) {
      $aosElements.forEach(({ node }) => {
        node.removeAttribute("data-aos");
        node.removeAttribute("data-aos-easing");
        node.removeAttribute("data-aos-duration");
        node.removeAttribute("data-aos-delay");
      });
      return;
    }
    document.body.setAttribute("data-aos-easing", options.easing);
    document.body.setAttribute("data-aos-duration", options.duration);
    document.body.setAttribute("data-aos-delay", options.delay);

    if (
      options.startEvent === "DOMContentLoaded" &&
      ["complete", "interactive"].indexOf(document.readyState) > -1
    ) {
      refresh(true);
    } else if (options.startEvent === "load") {
      window.addEventListener(options.startEvent, () => {
        refresh(true);
      });
    } else {
      document.addEventListener(options.startEvent, () => {
        refresh(true);
      });
    }

    if (__aosResizeHandler) {
      window.off("resize", __aosResizeHandler);
      window.off("orientationchange", __aosResizeHandler);
    }
    __aosResizeHandler = debounce(refresh, options.debounceDelay);
    window.on("resize", __aosResizeHandler);
    window.on("orientationchange", __aosResizeHandler);

    if (__aosScrollHandler) {
      window.off("scroll", __aosScrollHandler);
    }
    __aosScrollHandler = throttle(
      () => handleScroll($aosElements, options.once),
      options.throttleDelay
    );
    window.on("scroll", __aosScrollHandler);

    observe(refreshHard);

    return $aosElements;
  };

  window.AOS = {
    init,
    refresh,
    refreshHard,
  };
})();
;
var getRealPath = (pathname = window.location.pathname, desc = false) => {
  const names = pathname.split("/").filter((name) => {
    name = name.trim();
    return name.length > 0 && name !== "/" && name !== "index.html";
  });
  if (desc) {
    return names[0] || "/";
  } else {
    return names[names.length - 1] || "/";
  }
};

var scrollIntoViewAndWait = (element) => {
  return new Promise((resolve) => {
    if ("onscrollend" in window) {
      document.addEventListener("scrollend", resolve, { once: true });
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    } else {
      element.scrollIntoView({ block: "center", inline: "center" });
      resolve();
    }
  });
};

// anchor
_$$(
  ".article-entry h1>a, .article-entry h2>a, .article-entry h3>a, .article-entry h4>a, .article-entry h5>a, .article-entry h6>a"
).forEach((element) => {
  if (window.icon_font) {
    // iconfont
    element.innerHTML = "&#xe635;";
  } else {
    // fontawesome
    element.innerHTML = "&#xf292;";
  }
});

// lightbox
_$$(".article-entry img").forEach((element) => {
  if (
    element.parentElement.classList.contains("friend-icon") ||
    element.parentElement.tagName === "A" ||
    element.classList.contains("no-lightbox")
  )
    return;
  const a = document.createElement("a");
  a.href ? (a.href = element.src) : a.setAttribute("href", element.src);
  a.dataset.pswpWidth = element.naturalWidth;
  a.dataset.pswpHeight = element.naturalHeight;
  a.target = "_blank";
  a.classList.add("article-gallery-item");
  element.parentNode.insertBefore(a, element);
  element.parentNode.removeChild(element);
  a.appendChild(element);
});
_$$(".article-gallery a.article-gallery-img").forEach((a) => {
  a.dataset.pswpWidth = a.children[0].naturalWidth;
  a.dataset.pswpHeight = a.children[0].naturalHeight;
});
window.lightboxStatus = "ready";
window.dispatchEvent(new Event("lightbox:ready"));

// Mobile nav
var isMobileNavAnim = false;

document
  .getElementById("main-nav-toggle")
  .off("click")
  .on("click", function () {
    if (isMobileNavAnim) return;
    isMobileNavAnim = true;
    document.body.classList.toggle("mobile-nav-on");
    setTimeout(() => {
      isMobileNavAnim = false;
    }, 200);
  });

document
  .getElementById("mask")
  ?.off("click")
  .on("click", function () {
    if (isMobileNavAnim || !document.body.classList.contains("mobile-nav-on"))
      return;
    document.body.classList.remove("mobile-nav-on");
  });

_$$(".sidebar-toc-btn").forEach((element) => {
  element.off("click").on("click", function () {
    if (this.classList.contains("current")) return;
    _$$(".sidebar-toc-btn").forEach((element) =>
      element.classList.add("current")
    );
    _$$(".sidebar-common-btn").forEach((element) =>
      element.classList.remove("current")
    );
    _$$(".sidebar-toc-sidebar").forEach((element) =>
      element.classList.remove("hidden")
    );
    _$$(".sidebar-common-sidebar").forEach((element) =>
      element.classList.add("hidden")
    );
  });
});

_$$(".sidebar-common-btn").forEach((element) => {
  element.off("click").on("click", function () {
    if (this.classList.contains("current")) return;
    _$$(".sidebar-common-btn").forEach((element) =>
      element.classList.add("current")
    );
    _$$(".sidebar-toc-btn").forEach((element) =>
      element.classList.remove("current")
    );
    _$$(".sidebar-common-sidebar").forEach((element) =>
      element.classList.remove("hidden")
    );
    _$$(".sidebar-toc-sidebar").forEach((element) =>
      element.classList.add("hidden")
    );
  });
});

(() => {
  const rootRealPath = getRealPath(window.location.pathname);
  _$$(".sidebar-menu-link-wrap").forEach((link) => {
    let linkPath = link.querySelector("a").getAttribute("href");
    if (linkPath && getRealPath(linkPath) === rootRealPath) {
      link.classList.add("link-active");
    }
  });
})();

// lazyload
_$$(".article-entry img").forEach((element) => {
  if (element.classList.contains("lazyload")) return;
  element.classList.add("lazyload");
  element.setAttribute("data-src", element.src);
  element.setAttribute("data-sizes", "auto");
  element.removeAttribute("src");
});

// to top
var sidebarTop = _$(".sidebar-top");
if (sidebarTop) {
  sidebarTop.style.transition = "opacity 1s";
  sidebarTop.off("click").on("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
  if (document.documentElement.scrollTop < 10) {
    sidebarTop.style.opacity = 0;
  }  
}

var __sidebarTopScrollHandler;

if (__sidebarTopScrollHandler) {
  window.off("scroll", __sidebarTopScrollHandler);
}

__sidebarTopScrollHandler = () => {
  const sidebarTop = _$(".sidebar-top");
  if (document.documentElement.scrollTop < 10) {
    sidebarTop.style.opacity = 0;
  } else {
    sidebarTop.style.opacity = 1;
  }
};

window.on("scroll", __sidebarTopScrollHandler);

// toc
_$$(".toc li").forEach((element) => {
  element.off("click").on("click", () => {
    if (isMobileNavAnim || !document.body.classList.contains("mobile-nav-on"))
      return;
    document.body.classList.remove("mobile-nav-on");
  });
});

_$$(".sidebar-menu-link-dummy").forEach((element) => {
  element.off("click").on("click", () => {
    if (isMobileNavAnim || !document.body.classList.contains("mobile-nav-on"))
      return;
    setTimeout(() => {
      document.body.classList.remove("mobile-nav-on");
    }, 200);
  });
});

function tocInit() {
  if (!_$("#sidebar")) return;
  const navItems =
    getComputedStyle(_$("#sidebar")).display === "block"
      ? _$$("#sidebar .sidebar-toc-wrapper li")
      : _$$("#mobile-nav .sidebar-toc-wrapper li");
  if (!navItems.length) return;

  let activeLock = null;

  const anchorScroll = (event, index) => {
    event.preventDefault();
    const target = _$(decodeURI(event.currentTarget.getAttribute("href")));
    activeLock = index;
    scrollIntoViewAndWait(target).then(() => {
      activateNavByIndex(index);
      activeLock = null;
    });
  };

  const sections = [...navItems].map((element, index) => {
    const link = element.querySelector("a.toc-link");
    link.off("click").on("click", (e) => anchorScroll(e, index));
    const anchor = _$(decodeURI(link.getAttribute("href")));
    if (!anchor) return null;
    const alink = anchor.querySelector("a");
    alink?.off("click").on("click", (e) => anchorScroll(e, index));
    return anchor;
  });

  const activateNavByIndex = (index) => {
    const target = navItems[index];

    if (!target || target.classList.contains("current")) return;

    _$$(".sidebar-toc-wrapper .active").forEach((element) => {
      element.classList.remove("active", "current");
    });

    sections.forEach((element) => {
      element?.classList.remove("active");
    });

    target.classList.add("active", "current");
    sections[index]?.classList.add("active");

    let parent = target.parentNode;

    while (!parent.matches(".sidebar-toc")) {
      if (parent.matches("li")) {
        parent.classList.add("active");
        const t = _$(
          decodeURI(parent.querySelector("a.toc-link").getAttribute("href"))
        );
        if (t) {
          t.classList.add("active");
        }
      }
      parent = parent.parentNode;
    }
    // Scrolling to center active TOC element if TOC content is taller than viewport.
    if (
      !document
        .querySelector(".sidebar-toc-sidebar")
        .classList.contains("hidden")
    ) {
      const tocWrapper = _$(".sidebar-toc-wrapper");
      tocWrapper.scrollTo({
        top:
          tocWrapper.scrollTop + target.offsetTop - tocWrapper.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  };

  const findIndex = (entries) => {
    let index = 0;
    let entry = entries[index];

    if (entry.boundingClientRect.top > 0) {
      index = sections.indexOf(entry.target);
      return index === 0 ? 0 : index - 1;
    }
    for (; index < entries.length; index++) {
      if (entries[index].boundingClientRect.top <= 0) {
        entry = entries[index];
      } else {
        return sections.indexOf(entry.target);
      }
    }
    return sections.indexOf(entry.target);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const index = findIndex(entries) + (window.diffY > 0 ? 1 : 0);
      if (activeLock === null) {
        activateNavByIndex(index);
      }
    },
    {
      rootMargin: "0px 0px -100% 0px",
      threshold: 0,
    }
  );

  sections.forEach((element) => {
    element && observer.observe(element);
  });
}

// hexo-blog-encrypt
window
  .off("hexo-blog-decrypt")
  .on("hexo-blog-decrypt", tocInit)
  .on("hexo-blog-decrypt", () => {
    const script = document.createElement("script");
    script.src = "/js/insert_highlight.js";
    script.setAttribute("data-pjax", true);
    document.body.appendChild(script);
  });
tocInit();

_$('.sponsor-button-wrapper')?.off('click').on('click', () => {
  _$('.sponsor-button-wrapper')?.classList.toggle('active');
  _$('.sponsor-tip')?.classList.toggle('active');
  _$('.sponsor-qr')?.classList.toggle('active');
});;
(() => {
  _$$("pre").forEach((element) => {
    const parent = element.parentNode;
    if (!parent.classList.contains("gutter")) {
      const div = document.createElement("div");
      div.classList.add("code-area");
      parent.insertBefore(div, element);
      parent.removeChild(element);
      div.appendChild(element);
    }
  });

  const codeFigcaption = `
  <div class="code-figcaption">
    <div class="code-left-wrap">
      <div class="code-decoration"></div>
      <div class="code-lang"></div>
    </div>
    <div class="code-right-wrap">
      <div class="code-copy icon-copy"></div>
      <div class="icon-chevron-down code-expand"></div>
    </div>
  </div>`;
  _$$("figure.highlight").forEach((element) => {
    if (!element.querySelector(".code-figcaption")) {
      element.insertAdjacentHTML("afterbegin", codeFigcaption);
    }
  });
  // 代码收缩
  _$$(".code-expand").forEach((element) => {
    element.off("click").on("click", function () {
      const figure = element.closest("figure");
      if (figure.classList.contains("code-closed")) {
        figure.classList.remove("code-closed");
      } else {
        figure.classList.add("code-closed");
      }
    });
  });

  // 代码语言
  _$$("figure.highlight").forEach((element) => {
    let codeLanguage = element.className.split(" ")[1];
    if (!codeLanguage) {
      return;
    }
    let langName = codeLanguage
      .replace("line-numbers", "")
      .trim()
      .replace("language-", "")
      .trim();

    // 大写
    langName = langName.toUpperCase();
    const children = element.querySelector(".code-lang");
    if (children) {
      children.innerText = langName;
    }
  });

  if (!window.ClipboardJS) {
    return;
  }

  // 代码复制
  const clipboard = new ClipboardJS(".code-copy", {
    text: (trigger) => {
      const selection = window.getSelection();
      const range = document.createRange();

      range.selectNodeContents(trigger.parentNode.parentNode.nextElementSibling.querySelector("td.code"));
      selection.removeAllRanges();
      selection.addRange(range);

      let selectedText = selection.toString();
      if (window.clipboard_tips.copyright?.enable) {
        if (selectedText.length >= window.clipboard_tips.copyright?.count) {
          selectedText = selectedText + "\n\n" + window.clipboard_tips.copyright?.content ?? '';
        }
      }
      return selectedText;
    },
  });
  clipboard.on("success", function (e) {
    e.trigger.classList.add("icon-check");
    e.trigger.classList.remove("icon-copy");
    _$("#copy-tooltip").innerText = window.clipboard_tips.success;
    _$("#copy-tooltip").style.opacity = 1;
    setTimeout(() => {
      _$("#copy-tooltip").style.opacity = 0;
      e.trigger.classList.add("icon-copy");
      e.trigger.classList.remove("icon-check");
    }, 1000);
    e.clearSelection();
  });

  clipboard.on("error", function (e) {
    e.trigger.classList.add("icon-times");
    e.trigger.classList.remove("icon-copy");
    _$("#copy-tooltip").innerText = window.clipboard_tips.fail;
    _$("#copy-tooltip").style.opacity = 1;
    setTimeout(() => {
      _$("#copy-tooltip").style.opacity = 0;
      e.trigger.classList.add("icon-copy");
      e.trigger.classList.remove("icon-times");
    }, 1000);
  });

  // clear clipboard when pjax:send
  if (window.Pjax) {
    window.addEventListener("pjax:send", () => {
      clipboard.destroy();
    }, { once: true });
  }
})();
