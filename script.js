// ===== 1. CONSTANTS AND CONFIGURATION =====
const CONFIG = {
  // Animation settings
  ANIMATION_DURATION: 800,
  ANIMATION_DELAY: 100,
  SCROLL_THRESHOLD: 100,

  // Performance settings
  DEBOUNCE_DELAY: 16, // ~60fps
  THROTTLE_DELAY: 100,

  // Intersection Observer settings
  OBSERVER_THRESHOLD: 0.1,
  OBSERVER_ROOT_MARGIN: "0px 0px -50px 0px",

  // Header settings
  HEADER_HIDE_THRESHOLD: 200,

  // Selectors
  SELECTORS: {
    navToggle: "#navToggle",
    navLinks: "#navLinks",
    header: ".header",
    fadeInElements: ".fade-in",
    ctaButtons: ".btn-primary",
    featureCards: ".feature-card",
    smoothScrollLinks: 'a[href^="#"]',
  },
}

// ===== 2. UTILITY FUNCTIONS =====

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit the rate of function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Get device type based on screen width
 * @returns {string} Device type (mobile, tablet, desktop)
 */
function getDeviceType() {
  const width = window.innerWidth
  if (width <= 480) return "mobile"
  if (width <= 768) return "tablet"
  return "desktop"
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "")
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

/**
 * Safe query selector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element|null} Selected element or null
 */
function safeQuerySelector(selector, context = document) {
  try {
    return context.querySelector(selector)
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error)
    return null
  }
}

/**
 * Safe query selector all with error handling
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {NodeList} Selected elements
 */
function safeQuerySelectorAll(selector, context = document) {
  try {
    return context.querySelectorAll(selector)
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error)
    return []
  }
}

// ===== 3. MOBILE NAVIGATION =====

/**
 * Mobile Navigation Handler
 */
class MobileNavigation {
  constructor() {
    this.navToggle = safeQuerySelector(CONFIG.SELECTORS.navToggle)
    this.navLinks = safeQuerySelector(CONFIG.SELECTORS.navLinks)
    this.isOpen = false

    this.init()
  }

  init() {
    if (!this.navToggle || !this.navLinks) {
      console.warn("Navigation elements not found")
      return
    }

    this.bindEvents()
  }

  bindEvents() {
    // Toggle button click
    this.navToggle.addEventListener("click", (e) => {
      e.preventDefault()
      this.toggle()
    })

    // Close menu when clicking on links
    this.navLinks.addEventListener("click", (e) => {
      if (e.target.tagName === "A" && !e.target.classList.contains("btn")) {
        this.close()
      }
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.navToggle.contains(e.target) && !this.navLinks.contains(e.target)) {
        this.close()
      }
    })

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close()
        this.navToggle.focus()
      }
    })

    // Handle resize
    window.addEventListener(
      "resize",
      debounce(() => {
        if (window.innerWidth > 768 && this.isOpen) {
          this.close()
        }
      }, CONFIG.DEBOUNCE_DELAY),
    )
  }

  toggle() {
    this.isOpen ? this.close() : this.open()
  }

  open() {
    this.navLinks.classList.add("active")
    this.navToggle.setAttribute("aria-expanded", "true")
    this.isOpen = true
    this.animateToggleIcon(true)

    // Trap focus within navigation
    this.trapFocus()

    // Prevent body scroll
    document.body.style.overflow = "hidden"
  }

  close() {
    this.navLinks.classList.remove("active")
    this.navToggle.setAttribute("aria-expanded", "false")
    this.isOpen = false
    this.animateToggleIcon(false)

    // Restore body scroll
    document.body.style.overflow = ""
  }

  animateToggleIcon(isOpen) {
    const lines = this.navToggle.querySelectorAll(".nav-toggle-line")

    lines.forEach((line, index) => {
      if (isOpen) {
        if (index === 0) line.style.transform = "rotate(45deg) translate(5px, 5px)"
        if (index === 1) line.style.opacity = "0"
        if (index === 2) line.style.transform = "rotate(-45deg) translate(7px, -6px)"
      } else {
        line.style.transform = "none"
        line.style.opacity = "1"
      }
    })
  }

  trapFocus() {
    const focusableElements = this.navLinks.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstElement.focus()

    // Handle tab navigation
    const handleTabKey = (e) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener("keydown", handleTabKey)

    // Remove event listener when menu closes
    const removeListener = () => {
      document.removeEventListener("keydown", handleTabKey)
      document.removeEventListener("keydown", removeListener)
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") removeListener()
    })
  }
}

// ===== 4. SMOOTH SCROLLING =====

/**
 * Smooth Scrolling Handler
 */
class SmoothScrolling {
  constructor() {
    this.init()
  }

  init() {
    this.bindEvents()
  }

  bindEvents() {
    // Handle all anchor links
    safeQuerySelectorAll(CONFIG.SELECTORS.smoothScrollLinks).forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        this.handleClick(e, anchor)
      })
    })
  }

  handleClick(e, anchor) {
    e.preventDefault()

    const targetId = anchor.getAttribute("href")
    const target = safeQuerySelector(targetId)

    if (!target) {
      console.warn(`Target element not found: ${targetId}`)
      return
    }

    this.scrollToTarget(target)

    // Update URL without triggering scroll
    if (history.pushState) {
      history.pushState(null, null, targetId)
    }
  }

  scrollToTarget(target) {
    const header = safeQuerySelector(CONFIG.SELECTORS.header)
    const headerHeight = header ? header.offsetHeight : 0
    const targetPosition = target.offsetTop - headerHeight - 20

    // Use native smooth scrolling if supported
    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      })
    } else {
      // Fallback for older browsers
      this.animateScroll(targetPosition)
    }
  }

  animateScroll(targetPosition) {
    const startPosition = window.pageYOffset
    const distance = targetPosition - startPosition
    const duration = 800
    let start = null

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = timestamp - start
      const percentage = Math.min(progress / duration, 1)

      // Easing function (ease-in-out)
      const easing = percentage < 0.5 ? 2 * percentage * percentage : -1 + (4 - 2 * percentage) * percentage

      window.scrollTo(0, startPosition + distance * easing)

      if (progress < duration) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }
}

// ===== 5. INTERSECTION OBSERVER (ANIMATIONS) =====

/**
 * Animation Observer Handler
 */
class AnimationObserver {
  constructor() {
    this.observer = null
    this.init()
  }

  init() {
    if (!("IntersectionObserver" in window)) {
      // Fallback for older browsers
      this.fallbackAnimation()
      return
    }

    this.createObserver()
    this.observeElements()
  }

  createObserver() {
    const options = {
      threshold: CONFIG.OBSERVER_THRESHOLD,
      rootMargin: CONFIG.OBSERVER_ROOT_MARGIN,
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target)
          this.observer.unobserve(entry.target)
        }
      })
    }, options)
  }

  observeElements() {
    const elements = safeQuerySelectorAll(CONFIG.SELECTORS.fadeInElements)
    elements.forEach((el) => {
      this.observer.observe(el)
    })
  }

  animateElement(element) {
    // Add staggered delay for grid items
    const delay = this.calculateDelay(element)

    setTimeout(() => {
      element.classList.add("visible")
    }, delay)
  }

  calculateDelay(element) {
    // Check if element is in a grid
    const parent = element.parentElement
    const siblings = Array.from(parent.children)
    const index = siblings.indexOf(element)

    // Add staggered delay based on position
    return index * CONFIG.ANIMATION_DELAY
  }

  fallbackAnimation() {
    // Show all elements immediately for older browsers
    const elements = safeQuerySelectorAll(CONFIG.SELECTORS.fadeInElements)
    elements.forEach((el) => {
      el.classList.add("visible")
    })
  }
}

// ===== 6. HEADER SCROLL EFFECTS =====

/**
 * Header Scroll Handler
 */
class HeaderScrollHandler {
  constructor() {
    this.header = safeQuerySelector(CONFIG.SELECTORS.header)
    this.lastScrollTop = 0
    this.isHeaderHidden = false

    this.init()
  }

  init() {
    if (!this.header) {
      console.warn("Header element not found")
      return
    }

    this.bindEvents()
  }

  bindEvents() {
    const throttledScroll = throttle(() => {
      this.handleScroll()
    }, CONFIG.THROTTLE_DELAY)

    window.addEventListener("scroll", throttledScroll, { passive: true })
  }

  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    this.updateHeaderBackground(scrollTop)
    this.updateHeaderVisibility(scrollTop)

    this.lastScrollTop = scrollTop
  }

  updateHeaderBackground(scrollTop) {
    if (scrollTop > CONFIG.SCROLL_THRESHOLD) {
      this.header.style.backgroundColor = "rgba(255, 255, 255, 0.98)"
      this.header.style.backdropFilter = "blur(15px)"
    } else {
      this.header.style.backgroundColor = "rgba(255, 255, 255, 0.95)"
      this.header.style.backdropFilter = "blur(10px)"
    }
  }

  updateHeaderVisibility(scrollTop) {
    // Only hide header on mobile/tablet
    if (window.innerWidth > 1024) return

    const isScrollingDown = scrollTop > this.lastScrollTop
    const shouldHideHeader = isScrollingDown && scrollTop > CONFIG.HEADER_HIDE_THRESHOLD

    if (shouldHideHeader && !this.isHeaderHidden) {
      this.hideHeader()
    } else if (!isScrollingDown && this.isHeaderHidden) {
      this.showHeader()
    }
  }

  hideHeader() {
    this.header.style.transform = "translateY(-100%)"
    this.isHeaderHidden = true
  }

  showHeader() {
    this.header.style.transform = "translateY(0)"
    this.isHeaderHidden = false
  }
}

// ===== 7. PERFORMANCE OPTIMIZATIONS =====

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor() {
    this.init()
  }

  init() {
    this.setupLazyLoading()
    this.preloadCriticalResources()
    this.monitorPerformance()
  }

  setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.classList.remove("lazy")
              imageObserver.unobserve(img)
            }
          }
        })
      })

      safeQuerySelectorAll("img[data-src]").forEach((img) => {
        imageObserver.observe(img)
      })
    }
  }

  preloadCriticalResources() {
    // Preload hero image
    const heroImg = safeQuerySelector(".hero-image img")
    if (heroImg && heroImg.src) {
      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.href = heroImg.src
      document.head.appendChild(link)
    }
  }

  monitorPerformance() {
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType("navigation")[0]
          if (perfData) {
            console.log("Page Load Performance:", {
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
              totalTime: perfData.loadEventEnd - perfData.fetchStart,
            })
          }
        }, 0)
      })
    }
  }
}

// ===== 8. ACCESSIBILITY ENHANCEMENTS =====

/**
 * Accessibility Handler
 */
class AccessibilityHandler {
  constructor() {
    this.init()
  }

  init() {
    this.setupKeyboardNavigation()
    this.setupFocusManagement()
    this.setupScreenReaderSupport()
    this.setupReducedMotion()
  }

  setupKeyboardNavigation() {
    // Add keyboard navigation class when Tab is pressed
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation")
      }
    })

    // Remove keyboard navigation class on mouse interaction
    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-navigation")
    })

    // Skip to main content functionality
    const skipLink = safeQuerySelector(".sr-only-focusable")
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault()
        const mainContent = safeQuerySelector("#main-content")
        if (mainContent) {
          mainContent.focus()
          mainContent.scrollIntoView()
        }
      })
    }
  }

  setupFocusManagement() {
    // Ensure focus is visible for keyboard users
    const focusableElements = safeQuerySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    )

    focusableElements.forEach((element) => {
      element.addEventListener("focus", () => {
        if (document.body.classList.contains("keyboard-navigation")) {
          element.style.outline = "2px solid #FF5F15"
          element.style.outlineOffset = "2px"
        }
      })

      element.addEventListener("blur", () => {
        element.style.outline = ""
        element.style.outlineOffset = ""
      })
    })
  }

  setupScreenReaderSupport() {
    // Announce page changes for single-page navigation
    const announcer = document.createElement("div")
    announcer.setAttribute("aria-live", "polite")
    announcer.setAttribute("aria-atomic", "true")
    announcer.className = "sr-only"
    announcer.id = "page-announcer"
    document.body.appendChild(announcer)

    // Announce section changes
    window.addEventListener("hashchange", () => {
      const target = safeQuerySelector(window.location.hash)
      if (target) {
        const heading = target.querySelector("h1, h2, h3, h4, h5, h6")
        if (heading) {
          announcer.textContent = `Navigated to ${heading.textContent}`
        }
      }
    })
  }

  setupReducedMotion() {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    if (prefersReducedMotion.matches) {
      document.documentElement.style.setProperty("--transition-fast", "none")
      document.documentElement.style.setProperty("--transition-normal", "none")
      document.documentElement.style.setProperty("--transition-slow", "none")
    }

    // Listen for changes
    prefersReducedMotion.addEventListener("change", (e) => {
      if (e.matches) {
        document.documentElement.style.setProperty("--transition-fast", "none")
        document.documentElement.style.setProperty("--transition-normal", "none")
        document.documentElement.style.setProperty("--transition-slow", "none")
      } else {
        document.documentElement.style.removeProperty("--transition-fast")
        document.documentElement.style.removeProperty("--transition-normal")
        document.documentElement.style.removeProperty("--transition-slow")
      }
    })
  }
}

// ===== 9. ANALYTICS AND TRACKING =====

/**
 * Analytics Handler
 */
class AnalyticsHandler {
  constructor() {
    this.events = []
    this.init()
  }

  init() {
    this.setupEventTracking()
    this.setupPerformanceTracking()
  }

  setupEventTracking() {
    // Track CTA button clicks
    safeQuerySelectorAll(CONFIG.SELECTORS.ctaButtons).forEach((btn) => {
      btn.addEventListener("click", () => {
        this.trackEvent("CTA_Click", {
          button_text: btn.textContent.trim(),
          section: this.getSectionName(btn),
          device_type: getDeviceType(),
          timestamp: Date.now(),
        })
      })
    })

    // Track feature card interactions
    safeQuerySelectorAll(CONFIG.SELECTORS.featureCards).forEach((card) => {
      card.addEventListener("click", () => {
        const featureName = card.querySelector("h3")?.textContent || "unknown"
        this.trackEvent("Feature_Interest", {
          feature_name: featureName,
          device_type: getDeviceType(),
          timestamp: Date.now(),
        })
      })
    })

    // Track scroll depth
    this.setupScrollTracking()
  }

  setupScrollTracking() {
    const scrollMilestones = [25, 50, 75, 100]
    const trackedMilestones = new Set()

    const trackScrollDepth = throttle(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
      )

      scrollMilestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone)
          this.trackEvent("Scroll_Depth", {
            percentage: milestone,
            device_type: getDeviceType(),
            timestamp: Date.now(),
          })
        }
      })
    }, 1000)

    window.addEventListener("scroll", trackScrollDepth, { passive: true })
  }

  setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener("load", () => {
      if ("performance" in window) {
        const perfData = performance.getEntriesByType("navigation")[0]
        if (perfData) {
          this.trackEvent("Page_Performance", {
            load_time: Math.round(perfData.loadEventEnd - perfData.fetchStart),
            dom_ready: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
            device_type: getDeviceType(),
            timestamp: Date.now(),
          })
        }
      }
    })
  }

  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      },
    }

    this.events.push(event)

    // In production, send to analytics service
    console.log("Event tracked:", event)

    // Example: Send to Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', eventName, properties);
    // }
  }

  getSectionName(element) {
    const section = element.closest("section")
    return section?.id || section?.className || "unknown"
  }

  getEvents() {
    return [...this.events]
  }

  clearEvents() {
    this.events = []
  }
}

// ===== 10. ERROR HANDLING =====

/**
 * Error Handler
 */
class ErrorHandler {
  constructor() {
    this.errors = []
    this.init()
  }

  init() {
    this.setupGlobalErrorHandling()
    this.setupUnhandledRejectionHandling()
  }

  setupGlobalErrorHandling() {
    window.addEventListener("error", (e) => {
      this.logError({
        type: "JavaScript Error",
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }

  setupUnhandledRejectionHandling() {
    window.addEventListener("unhandledrejection", (e) => {
      this.logError({
        type: "Unhandled Promise Rejection",
        message: e.reason?.message || e.reason,
        stack: e.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })

      // Prevent the default browser behavior
      e.preventDefault()
    })
  }

  logError(errorInfo) {
    this.errors.push(errorInfo)
    console.error("Application Error:", errorInfo)

    // In production, send to error tracking service
    // this.sendToErrorService(errorInfo);
  }

  sendToErrorService(errorInfo) {
    // Example: Send to Sentry, LogRocket, etc.
    // fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorInfo)
    // }).catch(err => console.warn('Failed to send error to service:', err));
  }

  getErrors() {
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
  }
}

// ===== 11. INITIALIZATION =====

/**
 * Application Initializer
 */
class FamilyHubApp {
  constructor() {
    this.components = {}
    this.isInitialized = false
  }

  async init() {
    if (this.isInitialized) {
      console.warn("Application already initialized")
      return
    }

    try {
      console.log("Initializing FamilyHub Landing Page...")

      // Initialize error handling first
      this.components.errorHandler = new ErrorHandler()

      // Initialize core components
      await this.initializeComponents()

      // Mark as initialized
      this.isInitialized = true

      // Add loaded class to body
      document.body.classList.add("loaded")

      console.log("FamilyHub Landing Page initialized successfully")
    } catch (error) {
      console.error("Failed to initialize application:", error)
      this.components.errorHandler?.logError({
        type: "Initialization Error",
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      })
    }
  }

  async initializeComponents() {
    // Initialize components in order of dependency
    const componentInitializers = [
      () => (this.components.mobileNav = new MobileNavigation()),
      () => (this.components.smoothScrolling = new SmoothScrolling()),
      () => (this.components.animationObserver = new AnimationObserver()),
      () => (this.components.headerScrollHandler = new HeaderScrollHandler()),
      () => (this.components.performanceMonitor = new PerformanceMonitor()),
      () => (this.components.accessibilityHandler = new AccessibilityHandler()),
      () => (this.components.analyticsHandler = new AnalyticsHandler()),
    ]

    for (const initializer of componentInitializers) {
      try {
        await initializer()
      } catch (error) {
        console.warn("Component initialization failed:", error)
      }
    }
  }

  getComponent(name) {
    return this.components[name]
  }

  getAllComponents() {
    return { ...this.components }
  }
}

// ===== APPLICATION STARTUP =====

// Initialize application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp)
} else {
  initializeApp()
}

async function initializeApp() {
  // Create global app instance
  window.FamilyHubApp = new FamilyHubApp()

  // Initialize the application
  await window.FamilyHubApp.init()

  // Expose utilities for debugging (development only)
  if (process?.env?.NODE_ENV === "development") {
    window.FamilyHubUtils = {
      debounce,
      throttle,
      isInViewport,
      getDeviceType,
      isValidEmail,
      formatPhoneNumber,
    }
  }
}

// ===== EXPORT FOR TESTING =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CONFIG,
    debounce,
    throttle,
    isInViewport,
    getDeviceType,
    isValidEmail,
    formatPhoneNumber,
    MobileNavigation,
    SmoothScrolling,
    AnimationObserver,
    HeaderScrollHandler,
    PerformanceMonitor,
    AccessibilityHandler,
    AnalyticsHandler,
    ErrorHandler,
    FamilyHubApp,
  }
}
