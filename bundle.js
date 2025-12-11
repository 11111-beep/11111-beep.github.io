window.throttle = (func, limit) => {
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
      this.__listeners__ = this.__listeners__ || {};
      this.__listeners__[name] = this.__listeners__[name] || [];

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
  window._$ = (selector) => document.querySelector(selector);
  window._$$ = (selector) => document.querySelectorAll(selector);

  // dark_mode
  const themeButton = document.createElement("a");
  themeButton.className = "nav-icon dark-mode-btn";
  _$("#sub-nav").append(themeButton);

  const osMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  function setTheme(config) {
    const isAuto = config === "auto";
    const isDark = config === "true" || (isAuto && osMode);

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : null);
    localStorage.setItem("dark_mode", config);

    themeButton.id = `nav-${
      config === "true"
        ? "moon"
        : config === "false"
        ? "sun"
        : "circle-half-stroke"
    }-btn`;

    document.body.dispatchEvent(
      new CustomEvent(`${isDark ? "dark" : "light"}-theme-set`)
    );
  }
  const savedMode =
    localStorage.getItem("dark_mode") ||
    document.documentElement.getAttribute("data-theme-mode") ||
    "auto";
  setTheme(savedMode);

  themeButton.addEventListener(
    "click",
    throttle(() => {
      const modes = ["auto", "false", "true"];
      const nextMode =
        modes[(modes.indexOf(localStorage.getItem("dark_mode")) + 1) % 3];
      setTheme(nextMode);
    }, 1000)
  );

  let oldScrollTop = 0;
  document.addEventListener("scroll", () => {
    let scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const diffY = scrollTop - oldScrollTop;
    window.diffY = diffY;
    oldScrollTop = scrollTop;
    if (diffY < 0) {
      _$("#header-nav").classList.remove("header-nav-hidden");
    } else {
      _$("#header-nav").classList.add("header-nav-hidden");
    }
  });

  if (window.Pace) {
    Pace.on("done", () => {
      Pace.sources[0].elements = [];
    });
  }

  // generateScheme
  if (window.materialTheme) {
    const extractor = new materialTheme.ColorThemeExtractor({
      needTransition: false,
    });
    function appendStylesheet() {
      const existingStyle = _$("#reimu-generated-theme-style");
      if (existingStyle) {
        return;
      }
      const css = `
    :root {
      --red-0: var(--md-sys-color-primary-light);
      --red-1: color-mix(in srgb, var(--md-sys-color-primary-light) 90%, white);
      --red-2: color-mix(in srgb, var(--md-sys-color-primary-light) 75%, white);
      --red-3: color-mix(in srgb, var(--md-sys-color-primary-light) 55%, white);
      --red-4: color-mix(in srgb, var(--md-sys-color-primary-light) 40%, white);
      --red-5: color-mix(in srgb, var(--md-sys-color-primary-light) 15%, white);
      --red-5-5: color-mix(in srgb, var(--md-sys-color-primary-light) 10%, white);
      --red-6: color-mix(in srgb, var(--md-sys-color-primary-light) 5%, white);
    
      --color-border: var(--red-3);
      --color-link: var(--red-1);
      --color-meta-shadow: var(--red-6);
      --color-h2-after: var(--red-1);
      --color-red-6-shadow: var(--red-2);
      --color-red-3-shadow: var(--red-3);
    }
    
    [data-theme="dark"]:root {
      --red-0: var(--red-1);
      --red-1: color-mix(in srgb, var(--md-sys-color-primary-dark) 90%, white);
      --red-2: color-mix(in srgb, var(--md-sys-color-primary-dark) 80%, white);
      --red-3: color-mix(in srgb, var(--md-sys-color-primary-dark) 75%, white);
      --red-4: color-mix(in srgb, var(--md-sys-color-primary-dark) 30%, transparent);
      --red-5: color-mix(in srgb, var(--md-sys-color-primary-dark) 20%, transparent);
      --red-5-5: color-mix(in srgb, var(--md-sys-color-primary-dark) 10%, transparent);
      --red-6: color-mix(in srgb, var(--md-sys-color-primary-dark) 5%, transparent);
      
      --color-border: var(--red-5);
    }
    `;

      const style = document.createElement("style");
      style.id = "reimu-generated-theme-style";
      style.textContent = css;
      document.body.appendChild(style);
    }
    async function generateScheme(imageFile) {
      const scheme = await extractor.generateThemeSchemeFromImage(imageFile);
      document.documentElement.style.setProperty(
        "--md-sys-color-primary-light",
        extractor.hexFromArgb(scheme.schemes.light.props.primary)
      );
      document.documentElement.style.setProperty(
        "--md-sys-color-primary-dark",
        extractor.hexFromArgb(scheme.schemes.dark.props.primary)
      );

      const existingStyle = _$("#reimu-generated-theme-style");
      if (existingStyle) {
        return;
      }
      appendStylesheet();
    }

    window.generateSchemeHandler = () => {
      if (window.bannerElement?.src) {
        if (window.bannerElement.complete) {
          generateScheme(bannerElement);
        } else {
          window.bannerElement.addEventListener(
            "load",
            () => {
              generateScheme(bannerElement);
            },
            { once: true }
          );
        }
      } else if (window.bannerElement?.style.background) {
        const rgba = window.bannerElement.style.background.match(/\d+/g);
        const scheme = extractor.generateThemeScheme({
          r: parseInt(rgba[0]),
          g: parseInt(rgba[1]),
          b: parseInt(rgba[2]),
        });
        document.documentElement.style.setProperty(
          "--md-sys-color-primary-light",
          extractor.hexFromArgb(scheme.schemes.light.props.primary)
        );
        document.documentElement.style.setProperty(
          "--md-sys-color-primary-dark",
          extractor.hexFromArgb(scheme.schemes.dark.props.primary)
        );
        appendStylesheet();
      }
    };
  }
})();

var safeImport = async (url, integrity) => {
  if (!integrity) {
    return import(url);
  }
  const response = await fetch(url);
  const moduleContent = await response.text();

  const actualHash = await crypto.subtle.digest(
    "SHA-384",
    new TextEncoder().encode(moduleContent)
  );
  const hashBase64 =
    "sha384-" + btoa(String.fromCharCode(...new Uint8Array(actualHash)));

  if (hashBase64 !== integrity) {
    throw new Error(`Integrity check failed for ${url}`);
  }

  const blob = new Blob([moduleContent], { type: "application/javascript" });
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

var __aosScrollHandler;
var __aosResizeHandler;
var __observer;
var __aosBodyResizeObserver;

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

    if (window.ResizeObserver && _$("#main")) {
      __aosBodyResizeObserver?.disconnect?.();
      __aosBodyResizeObserver = new ResizeObserver(
        debounce(() => refresh(), options.debounceDelay)
      );
      __aosBodyResizeObserver.observe(_$("#main"));
    }

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
  ".article-entry h1>a:first-of-type, .article-entry h2>a:first-of-type, .article-entry h3>a:first-of-type, .article-entry h4>a:first-of-type, .article-entry h5>a:first-of-type, .article-entry h6>a:first-of-type"
).forEach((element) => {
  if (window.REIMU_CONFIG.icon_font) {
    // iconfont
    element.innerHTML = window.REIMU_CONFIG.anchor_icon
      ? `&#x${window.REIMU_CONFIG.anchor_icon};`
      : window.REIMU_CONFIG.anchor_icon === false
      ? ""
      : "&#xe635;";
  } else {
    // fontawesome
    element.innerHTML = window.REIMU_CONFIG.anchor_icon
      ? `&#x${window.REIMU_CONFIG.anchor_icon};`
      : window.REIMU_CONFIG.anchor_icon === false
      ? ""
      : "&#xf292;";
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
  if (element.naturalWidth || element.naturalHeight) {
    a.dataset.pswpWidth = element.naturalWidth;
    a.dataset.pswpHeight = element.naturalHeight;
  } else {
    console.warn(
      "Image naturalWidth and naturalHeight cannot be obtained right now, fallback to onload."
    );
    element.onload = () => {
      a.dataset.pswpWidth = element.naturalWidth;
      a.dataset.pswpHeight = element.naturalHeight;
    };
  }
  a.target = "_blank";
  a.classList.add("article-gallery-item");
  element.parentNode.insertBefore(a, element);
  element.parentNode.removeChild(element);
  a.appendChild(element);
});
window.lightboxStatus = "ready";
window.dispatchEvent(new Event("lightbox:ready"));

// table wrap
_$$(".article-entry table").forEach((element) => {
  if (element.closest("figure.highlight")) return;
  const wrapper = document.createElement("div");
  wrapper.classList.add("table-wrapper");
  element.parentNode?.insertBefore(wrapper, element);
  element.parentNode?.removeChild(element);
  wrapper.appendChild(element);
});

// wrap details content for old @reimujs/hexo-renderer-markdown-it-plus
_$$(".article-entry details.custom-block").forEach((element) => {
  if (element.querySelector(".detail-content")) return;
  const summary = element.querySelector("summary");
  if (!summary) return;
  const detailContent = document.createElement("div");
  detailContent.classList.add("detail-content");
  
  const range = document.createRange();
  range.setStartAfter(summary);
  range.setEndAfter(element.lastChild);
  detailContent.appendChild(range.extractContents());
  
  element.appendChild(detailContent);
});

// Mobile nav
var isMobileNavAnim = false;

_$("#main-nav-toggle")
  .off("click")
  .on("click", () => {
    if (isMobileNavAnim) return;
    isMobileNavAnim = true;
    document.body.classList.toggle("mobile-nav-on");
    _$("#mask").classList.remove("hide");
    setTimeout(() => {
      isMobileNavAnim = false;
    }, 300);
  });

_$("#mask")
  ?.off("click")
  .on("click", () => {
    if (isMobileNavAnim || !document.body.classList.contains("mobile-nav-on"))
      return;
    document.body.classList.remove("mobile-nav-on");
    _$("#mask").classList.add("hide");
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
  sidebarTop.style.transition = "all .3s";
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
_$$("#mobile-nav .toc li").forEach((element) => {
  element.off("click").on("click", () => {
    if (isMobileNavAnim || !document.body.classList.contains("mobile-nav-on"))
      return;
    document.body.classList.remove("mobile-nav-on");
    _$("#mask").classList.add("hide");
  });
});

_$$("#mobile-nav .sidebar-menu-link-dummy").forEach((element) => {
  element.off("click").on("click", () => {
    if (isMobileNavAnim || !document.body.classList.contains("mobile-nav-on"))
      return;
    setTimeout(() => {
      document.body.classList.remove("mobile-nav-on");
      _$("#mask").classList.add("hide");
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
    const target = document.getElementById(
      decodeURI(event.currentTarget.getAttribute("href")).slice(1)
    );
    activeLock = index;
    scrollIntoViewAndWait(target).then(() => {
      activateNavByIndex(index);
      activeLock = null;
    });
  };

  const sections = [...navItems].map((element, index) => {
    const link = element.querySelector("a.toc-link");
    link.off("click").on("click", (e) => anchorScroll(e, index));
    const anchor = document.getElementById(
      decodeURI(link.getAttribute("href")).slice(1)
    );
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

    while (!parent.matches(".sidebar-toc-sidebar")) {
      if (parent.matches("li")) {
        parent.classList.add("active");
        const t = document.getElementById(
          decodeURI(
            parent.querySelector("a.toc-link").getAttribute("href").slice(1)
          )
        );
        if (t) {
          t.classList.add("active");
        }
      }
      parent = parent.parentNode;
    }
    // Scrolling to center active TOC element if TOC content is taller than viewport.
    if (!_$(".sidebar-toc-sidebar").classList.contains("hidden")) {
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

_$(".sponsor-button")
  ?.off("click")
  .on("click", () => {
    _$(".sponsor-button")?.classList.toggle("active");
    _$(".sponsor-tip")?.classList.toggle("active");
    _$(".sponsor-qr")?.classList.toggle("active");
  });

var shareWeixinHandler;
if (shareWeixinHandler) {
  document.off("click", shareWeixinHandler);
}
shareWeixinHandler = (e) => {
  if (e.target.closest(".share-icon.icon-weixin")) return;
  const sw = _$("#share-weixin");
  if (sw && sw.classList.contains("active")) {
    sw.classList.remove("active");
    sw.addEventListener(
      "transitionend",
      function handler() {
        sw.style.display = "none";
        sw.removeEventListener("transitionend", handler);
      },
      { once: true },
    );
  }
};
document.on("click", shareWeixinHandler);

_$(".share-icon.icon-weixin")
  ?.off("click")
  .on("click", function (e) {
    const iconPosition = this.getBoundingClientRect();
    const shareWeixin = this.querySelector("#share-weixin");

    if (iconPosition.x - 148 < 0) {
      shareWeixin.style.left = `-${iconPosition.x - 10}px`;
    } else if (iconPosition.x + 172 > window.innerWidth) {
      shareWeixin.style.left = `-${310 - window.innerWidth + iconPosition.x}px`;
    } else {
      shareWeixin.style.left = "-138px";
    }
    if (e.target === this) {
      const el = shareWeixin;
      if (!el) return;
      if (!el.classList.contains("active")) {
        el.style.display = "block";
        requestAnimationFrame(() => {
          el.classList.add("active");
        });
      } else {
        el.classList.remove("active");
        const onEnd = (ev) => {
          if (ev.propertyName === "opacity") {
            el.style.display = "none";
            el.removeEventListener("transitionend", onEnd);
          }
        };
        el.addEventListener("transitionend", onEnd);
      }
    }
    // if contains img return
    if (_$(".share-weixin-canvas").children.length) {
      return;
    }
    const { cover, excerpt, description, title, stripContent, author } =
      window.REIMU_POST;
    _$("#share-weixin-banner").src = cover;
    _$("#share-weixin-title").innerText = title;
    _$("#share-weixin-desc").innerText = excerpt || description || stripContent;
    _$("#share-weixin-author").innerText = "By: " + author;
    QRCode.toDataURL(window.REIMU_POST.url, function (error, dataUrl) {
      if (error) {
        console.error(error);
        return;
      }
      _$("#share-weixin-qr").src = dataUrl;
      snapdom
        .toPng(_$(".share-weixin-dom"))
        .then((img) => {
          _$(".share-weixin-canvas").appendChild(img);
        })
        .catch(() => {
          // we assume that the error is caused by the browser's security policy
          // so we will remove the banner and try again
          _$("#share-weixin-banner").remove();
          snapdom
            .toPng(_$(".share-weixin-dom"))
            .then((img) => {
              _$(".share-weixin-canvas").appendChild(img);
            })
            .catch(() => {
              console.error("Failed to generate weixin share image.");
            });
        });
    });
  });

var imgElement = _$("#header > img");
if (imgElement.src || imgElement.style.background) {
  window.bannerElement = imgElement;
} else {
  window.bannerElement = _$("#header > picture img");
}

window.generateSchemeHandler?.();
;
(() => {
  _$$("pre").forEach((element) => {
    const parent = element.parentNode;
    if (!parent.classList.contains("gutter")) {
      const div = document.createElement("div");
      div.className = "code-area";
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
  const reimuConfig = window.REIMU_CONFIG?.code_block || {};
  const expandThreshold = reimuConfig.expand;

  _$$("figure.highlight").forEach((element) => {
    if (!element.querySelector(".code-figcaption")) {
      element.insertAdjacentHTML("afterbegin", codeFigcaption);
    }
    if (expandThreshold !== undefined) {
      if (
        expandThreshold === false ||
        (typeof expandThreshold === "number" &&
          element.querySelectorAll("td.code .line").length > expandThreshold)
      ) {
        element.classList.add("code-closed");
        // force rerender element to refresh AOS
        element.style.display = "none";
        void element.offsetWidth;
        element.style.display = "";
      }
    }
  });
  // 代码收缩
  _$$(".code-expand").forEach((element) => {
    element.off("click").on("click", () => {
      const figure = element.closest("figure");
      figure.classList.toggle("code-closed");
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

  const tips = window.REIMU_CONFIG?.clipboard_tips || {};

  // 代码复制
  const clipboard = new ClipboardJS(".code-copy", {
    text: (trigger) => {
      const codeElement =
        trigger.parentNode.parentNode.parentNode.querySelector("td.code");
      let selectedText = codeElement ? codeElement.innerText : "";

      if (
        tips.copyright?.enable &&
        selectedText.length >= tips.copyright?.count
      ) {
        selectedText = selectedText + "\n\n" + (tips.copyright?.content ?? "");
      }
      return selectedText;
    },
  });
  clipboard.on("success", (e) => {
    e.trigger.classList.add("icon-check");
    e.trigger.classList.remove("icon-copy");
    const successConfig = tips.success;
    let successText = "Copy successfully (*^▽^*)";
    if (typeof successConfig === "string") {
      successText = successConfig;
    } else if (typeof successConfig === "object") {
      const lang = document.documentElement.lang;
      const key = Object.keys(successConfig).find(
        (key) => key.toLowerCase() === lang.toLowerCase()
      );
      if (key && successConfig[key]) {
        successText = successConfig[key];
      }
    }
    _$("#copy-tooltip").innerText = successText;
    _$("#copy-tooltip").style.opacity = 1;
    setTimeout(() => {
      _$("#copy-tooltip").style.opacity = 0;
      e.trigger.classList.add("icon-copy");
      e.trigger.classList.remove("icon-check");
    }, 1000);
    e.clearSelection();
  });

  clipboard.on("error", (e) => {
    e.trigger.classList.add("icon-times");
    e.trigger.classList.remove("icon-copy");
    const failConfig = tips.fail;
    let failText = "Copy failed (ﾟ⊿ﾟ)ﾂ";
    if (typeof failConfig === "string") {
      failText = failConfig;
    } else if (typeof failConfig === "object") {
      const lang = document.documentElement.lang;
      const key = Object.keys(failConfig).find(
        (key) => key.toLowerCase() === lang.toLowerCase()
      );
      if (key && failConfig[key]) {
        failText = failConfig[key];
      }
    }
    _$("#copy-tooltip").innerText = failText;
    _$("#copy-tooltip").style.opacity = 1;
    setTimeout(() => {
      _$("#copy-tooltip").style.opacity = 0;
      e.trigger.classList.add("icon-copy");
      e.trigger.classList.remove("icon-times");
    }, 1000);
  });

  // Clean up on PJAX
  if (window.Pjax) {
    window.addEventListener(
      "pjax:send",
      () => {
        clipboard.destroy();
      },
      { once: true }
    );
  }

  // Since we add code-closed class to the figure element, we need to refresh AOS
  if (window.AOS) {
    AOS.refresh();
  }
})();
;
var tabsEls = _$$(".nav-tabs li.tab a");
tabsEls.forEach((tab) => {
  tab.off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const targetId = this.getAttribute("class").substring(1);
    const tabsContainer = this.closest(".tabs");
    const tabContent = tabsContainer.querySelector(".tab-content");
    const panes = tabContent.querySelectorAll(".tab-pane");
    panes.forEach((pane) => pane.classList.remove("active"));
    document.getElementById(targetId).classList.add("active");
    const navTabs = tabsContainer.querySelector(".nav-tabs");
    const tabLinks = navTabs.querySelectorAll("li.tab");
    tabLinks.forEach((li) => li.classList.remove("active"));
    this.parentElement.classList.add("active");

    const indicator = navTabs.querySelector(".tab-indicator");
    const activeTab = this.parentElement;
    const activeRect = activeTab.getBoundingClientRect();
    const navRect = navTabs.getBoundingClientRect();
    indicator.style.left = activeRect.left - navRect.left + "px";
    indicator.style.width = activeRect.width + "px";

    return false;
  });
});

var tabsContainers = _$$(".tabs");
tabsContainers.forEach((container) => {
  const navTabs = container.querySelector(".nav-tabs");
  const activeTab = navTabs.querySelector("li.tab.active");
  if (activeTab) {
    const indicator = navTabs.querySelector(".tab-indicator");
    const activeRect = activeTab.getBoundingClientRect();
    const navRect = navTabs.getBoundingClientRect();
    indicator.style.left = activeRect.left - navRect.left + "px";
    indicator.style.width = activeRect.width + "px";
  }
});
