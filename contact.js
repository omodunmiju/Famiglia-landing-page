/**
 * Contact Form JavaScript
 * Handles form validation, submission, and user interactions for the contact page
 */

// ===== CONSTANTS AND CONFIGURATION =====
const CONTACT_CONFIG = {
  // Form validation settings
  VALIDATION_DELAY: 300,
  SUBMISSION_TIMEOUT: 10000,

  // API endpoints (replace with actual endpoints)
  FORM_SUBMIT_URL: "/api/contact",

  // Validation patterns
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[+]?[1-9][\d]{0,15}$/,

  // Form field requirements
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,

  // Response messages
  MESSAGES: {
    SUCCESS: "Thank you for your message! We'll get back to you within 24 hours.",
    ERROR: "Sorry, there was an error sending your message. Please try again.",
    VALIDATION_ERROR: "Please fix the errors below and try again.",
    NETWORK_ERROR: "Network error. Please check your connection and try again.",
  },
}

// ===== UTILITY FUNCTIONS =====

/**
 * Debounce function for input validation
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
 * Sanitize input to prevent XSS
 */
function sanitizeInput(input) {
  const div = document.createElement("div")
  div.textContent = input
  return div.innerHTML
}

/**
 * Show notification message
 */
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    </div>
  `

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${type === "success" ? "#d4edda" : type === "error" ? "#f8d7da" : "#d1ecf1"};
    color: ${type === "success" ? "#155724" : type === "error" ? "#721c24" : "#0c5460"};
    border: 1px solid ${type === "success" ? "#c3e6cb" : type === "error" ? "#f5c6cb" : "#bee5eb"};
    border-radius: 8px;
    padding: 16px;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `

  // Add animation keyframes
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style")
    style.id = "notification-styles"
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
      }
      .notification-close:hover {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(notification)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease"
      setTimeout(() => notification.remove(), 300)
    }
  }, 5000)

  // Close button functionality
  const closeBtn = notification.querySelector(".notification-close")
  closeBtn.addEventListener("click", () => {
    notification.style.animation = "slideOut 0.3s ease"
    setTimeout(() => notification.remove(), 300)
  })
}

// ===== FORM VALIDATION CLASS =====
class ContactFormValidator {
  constructor() {
    this.errors = new Map()
    this.isValid = true
  }

  /**
   * Validate required field
   */
  validateRequired(field, value, fieldName) {
    if (!value || value.trim() === "") {
      this.addError(field, `${fieldName} is required`)
      return false
    }
    this.removeError(field)
    return true
  }

  /**
   * Validate email format
   */
  validateEmail(field, email) {
    if (!email) return false

    if (!CONTACT_CONFIG.EMAIL_PATTERN.test(email)) {
      this.addError(field, "Please enter a valid email address")
      return false
    }
    this.removeError(field)
    return true
  }

  /**
   * Validate message length
   */
  validateMessage(field, message) {
    if (!message) return false

    if (message.length < CONTACT_CONFIG.MIN_MESSAGE_LENGTH) {
      this.addError(field, `Message must be at least ${CONTACT_CONFIG.MIN_MESSAGE_LENGTH} characters`)
      return false
    }

    if (message.length > CONTACT_CONFIG.MAX_MESSAGE_LENGTH) {
      this.addError(field, `Message must be less than ${CONTACT_CONFIG.MAX_MESSAGE_LENGTH} characters`)
      return false
    }

    this.removeError(field)
    return true
  }

  /**
   * Add validation error
   */
  addError(field, message) {
    this.errors.set(field.name, message)
    this.isValid = false

    // Update UI
    const formGroup = field.closest(".form-group")
    const errorElement = formGroup.querySelector(".error-message")

    formGroup.classList.add("error")
    formGroup.classList.remove("success")
    field.setAttribute("aria-invalid", "true")

    if (errorElement) {
      errorElement.textContent = message
      errorElement.setAttribute("aria-live", "polite")
    }
  }

  /**
   * Remove validation error
   */
  removeError(field) {
    this.errors.delete(field.name)

    // Update UI
    const formGroup = field.closest(".form-group")
    const errorElement = formGroup.querySelector(".error-message")

    formGroup.classList.remove("error")
    formGroup.classList.add("success")
    field.setAttribute("aria-invalid", "false")

    if (errorElement) {
      errorElement.textContent = ""
    }
  }

  /**
   * Validate entire form
   */
  validateForm(formData) {
    this.errors.clear()
    this.isValid = true

    const nameField = document.getElementById("name")
    const emailField = document.getElementById("email")
    const subjectField = document.getElementById("subject")
    const messageField = document.getElementById("message")

    // Validate each field
    this.validateRequired(nameField, formData.get("name"), "Name")
    this.validateRequired(emailField, formData.get("email"), "Email") &&
      this.validateEmail(emailField, formData.get("email"))
    this.validateRequired(subjectField, formData.get("subject"), "Subject")
    this.validateRequired(messageField, formData.get("message"), "Message") &&
      this.validateMessage(messageField, formData.get("message"))

    return this.isValid
  }

  /**
   * Get all validation errors
   */
  getErrors() {
    return Array.from(this.errors.entries())
  }
}

// ===== CONTACT FORM HANDLER CLASS =====
class ContactFormHandler {
  constructor() {
    this.form = document.querySelector(".contact-form")
    this.submitButton = this.form?.querySelector('button[type="submit"]')
    this.validator = new ContactFormValidator()
    this.isSubmitting = false

    this.init()
  }

  init() {
    if (!this.form) {
      console.warn("Contact form not found")
      return
    }

    this.bindEvents()
    this.setupRealTimeValidation()
  }

  bindEvents() {
    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit()
    })

    // Real-time validation on blur
    const fields = this.form.querySelectorAll("input, select, textarea")
    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        this.validateField(field)
      })
    })

    // Character counter for message field
    const messageField = document.getElementById("message")
    if (messageField) {
      this.setupCharacterCounter(messageField)
    }
  }

  setupRealTimeValidation() {
    const debouncedValidation = debounce((field) => {
      this.validateField(field)
    }, CONTACT_CONFIG.VALIDATION_DELAY)

    const fields = this.form.querySelectorAll("input, select, textarea")
    fields.forEach((field) => {
      field.addEventListener("input", () => {
        debouncedValidation(field)
      })
    })
  }

  setupCharacterCounter(messageField) {
    const formGroup = messageField.closest(".form-group")

    // Create character counter
    const counter = document.createElement("div")
    counter.className = "character-counter"
    counter.style.cssText = `
      text-align: right;
      font-size: 0.875rem;
      color: #6c757d;
      margin-top: 4px;
    `

    formGroup.appendChild(counter)

    const updateCounter = () => {
      const length = messageField.value.length
      const remaining = CONTACT_CONFIG.MAX_MESSAGE_LENGTH - length

      counter.textContent = `${length}/${CONTACT_CONFIG.MAX_MESSAGE_LENGTH} characters`

      if (remaining < 50) {
        counter.style.color = "#dc3545"
      } else if (remaining < 100) {
        counter.style.color = "#ffc107"
      } else {
        counter.style.color = "#6c757d"
      }
    }

    messageField.addEventListener("input", updateCounter)
    updateCounter() // Initial count
  }

  validateField(field) {
    const value = field.value.trim()

    switch (field.name) {
      case "name":
        this.validator.validateRequired(field, value, "Name")
        break
      case "email":
        this.validator.validateRequired(field, value, "Email") && this.validator.validateEmail(field, value)
        break
      case "subject":
        this.validator.validateRequired(field, value, "Subject")
        break
      case "message":
        this.validator.validateRequired(field, value, "Message") && this.validator.validateMessage(field, value)
        break
    }
  }

  async handleSubmit() {
    if (this.isSubmitting) return

    const formData = new FormData(this.form)

    // Validate form
    if (!this.validator.validateForm(formData)) {
      showNotification(CONTACT_CONFIG.MESSAGES.VALIDATION_ERROR, "error")
      this.focusFirstError()
      return
    }

    this.setSubmittingState(true)

    try {
      // Simulate API call (replace with actual endpoint)
      const response = await this.submitForm(formData)

      if (response.success) {
        this.handleSuccess()
      } else {
        this.handleError(response.message || CONTACT_CONFIG.MESSAGES.ERROR)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      this.handleError(CONTACT_CONFIG.MESSAGES.NETWORK_ERROR)
    } finally {
      this.setSubmittingState(false)
    }
  }

  async submitForm(formData) {
    // Simulate API call - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate success response
        resolve({ success: true })
      }, 2000)
    })

    // Actual implementation would look like:
    /*
    const response = await fetch(CONTACT_CONFIG.FORM_SUBMIT_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
    */
  }

  handleSuccess() {
    showNotification(CONTACT_CONFIG.MESSAGES.SUCCESS, "success")
    this.form.reset()
    this.clearValidationStates()

    // Update character counter
    const counter = this.form.querySelector(".character-counter")
    if (counter) {
      counter.textContent = `0/${CONTACT_CONFIG.MAX_MESSAGE_LENGTH} characters`
      counter.style.color = "#6c757d"
    }

    // Focus first field for accessibility
    const firstField = this.form.querySelector("input, select, textarea")
    if (firstField) {
      firstField.focus()
    }
  }

  handleError(message) {
    showNotification(message, "error")
  }

  setSubmittingState(isSubmitting) {
    this.isSubmitting = isSubmitting

    if (this.submitButton) {
      this.submitButton.disabled = isSubmitting

      if (isSubmitting) {
        this.submitButton.classList.add("loading")
        this.submitButton.textContent = "Sending..."
      } else {
        this.submitButton.classList.remove("loading")
        this.submitButton.textContent = "Send Message"
      }
    }

    // Disable form fields during submission
    const fields = this.form.querySelectorAll("input, select, textarea")
    fields.forEach((field) => {
      field.disabled = isSubmitting
    })
  }

  clearValidationStates() {
    const formGroups = this.form.querySelectorAll(".form-group")
    formGroups.forEach((group) => {
      group.classList.remove("error", "success")
    })

    const fields = this.form.querySelectorAll("input, select, textarea")
    fields.forEach((field) => {
      field.removeAttribute("aria-invalid")
    })

    const errorMessages = this.form.querySelectorAll(".error-message")
    errorMessages.forEach((error) => {
      error.textContent = ""
    })
  }

  focusFirstError() {
    const firstErrorField = this.form.querySelector(
      ".form-group.error input, .form-group.error select, .form-group.error textarea",
    )
    if (firstErrorField) {
      firstErrorField.focus()
    }
  }
}

// ===== SEARCH FUNCTIONALITY =====
class HelpSearchHandler {
  constructor() {
    this.searchInput = document.querySelector(".search-input")
    this.searchButton = document.querySelector(".search-btn")

    if (this.searchInput && this.searchButton) {
      this.init()
    }
  }

  init() {
    this.bindEvents()
  }

  bindEvents() {
    // Search button click
    this.searchButton.addEventListener("click", (e) => {
      e.preventDefault()
      this.performSearch()
    })

    // Enter key in search input
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        this.performSearch()
      }
    })

    // Real-time search suggestions (if needed)
    const debouncedSearch = debounce(() => {
      this.showSearchSuggestions()
    }, 300)

    this.searchInput.addEventListener("input", debouncedSearch)
  }

  performSearch() {
    const query = this.searchInput.value.trim()

    if (!query) {
      showNotification("Please enter a search term", "error")
      return
    }

    // Simulate search (replace with actual search implementation)
    showNotification(`Searching for: "${query}"`, "info")

    // In a real implementation, you would:
    // 1. Send query to search API
    // 2. Display results
    // 3. Handle no results case
  }

  showSearchSuggestions() {
    // Implement search suggestions if needed
    // This could show a dropdown with suggested help topics
  }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
class AccessibilityEnhancer {
  constructor() {
    this.init()
  }

  init() {
    this.setupKeyboardNavigation()
    this.setupFocusManagement()
    this.setupScreenReaderSupport()
  }

  setupKeyboardNavigation() {
    // Escape key to close notifications
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const notification = document.querySelector(".notification")
        if (notification) {
          const closeBtn = notification.querySelector(".notification-close")
          if (closeBtn) {
            closeBtn.click()
          }
        }
      }
    })
  }

  setupFocusManagement() {
    // Ensure focus is visible for keyboard users
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation")
      }
    })

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-navigation")
    })
  }

  setupScreenReaderSupport() {
    // Announce form validation errors
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const errorMessages = document.querySelectorAll(".error-message[aria-live]")
          errorMessages.forEach((error) => {
            if (error.textContent.trim()) {
              // Error message will be announced by screen reader due to aria-live
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }
}

// ===== ANALYTICS TRACKING =====
class ContactAnalytics {
  constructor() {
    this.events = []
  }

  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        page: "contact",
        url: window.location.href,
      },
    }

    this.events.push(event)
    console.log("Contact Event:", event)

    // In production, send to analytics service
    // this.sendToAnalytics(event)
  }

  trackFormStart() {
    this.trackEvent("contact_form_started")
  }

  trackFormSubmit(success, errors = []) {
    this.trackEvent("contact_form_submitted", {
      success,
      error_count: errors.length,
      errors: errors.map(([field, message]) => ({ field, message })),
    })
  }

  trackFieldValidation(fieldName, isValid) {
    this.trackEvent("contact_form_field_validated", {
      field: fieldName,
      valid: isValid,
    })
  }

  trackSearch(query) {
    this.trackEvent("help_search_performed", {
      query: query.toLowerCase(),
      query_length: query.length,
    })
  }
}

// ===== INITIALIZATION =====
class ContactPageApp {
  constructor() {
    this.components = {}
    this.analytics = new ContactAnalytics()
  }

  init() {
    try {
      // Initialize components
      this.components.formHandler = new ContactFormHandler()
      this.components.searchHandler = new HelpSearchHandler()
      this.components.accessibilityEnhancer = new AccessibilityEnhancer()

      // Track page load
      this.analytics.trackEvent("contact_page_loaded")

      // Track form interaction start
      const form = document.querySelector(".contact-form")
      if (form) {
        const fields = form.querySelectorAll("input, select, textarea")
        fields.forEach((field) => {
          field.addEventListener(
            "focus",
            () => {
              this.analytics.trackFormStart()
            },
            { once: true },
          )
        })
      }

      console.log("Contact page initialized successfully")
    } catch (error) {
      console.error("Failed to initialize contact page:", error)
    }
  }

  getAnalytics() {
    return this.analytics.events
  }
}

// ===== APPLICATION STARTUP =====
document.addEventListener("DOMContentLoaded", () => {
  window.ContactPageApp = new ContactPageApp()
  window.ContactPageApp.init()
})

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ContactFormValidator,
    ContactFormHandler,
    HelpSearchHandler,
    AccessibilityEnhancer,
    ContactAnalytics,
    ContactPageApp,
  }
}
