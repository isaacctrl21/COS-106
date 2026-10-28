

// Wait for the DOM to be fully loaded before executing scripts
document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  highlightActiveNavLink();
  initDynamicYear();
  
  // Page-specific initializers based on present DOM elements
  if (document.getElementById('task-form')) {
    initAcademicPlanner();
  }
  
  if (document.getElementById('contact-form')) {
    initContactFormValidation();
  }
  
  if (document.querySelector('.filter-tabs')) {
    initProjectFilter();
  }
});

/* ==============================================================================
   1. RESPONSIVE NAVIGATION & UI ENHANCEMENTS
   ============================================================================== */

/**
 * Handles the mobile hamburger menu toggle and accessibility states.
 */
function initMobileNavigation() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    toggleBtn.innerHTML = isExpanded ? '&times;' : '&#9776;';
  });

  // Close the menu when a link inside it is clicked
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '&#9776;';
      }
    });
  });

  // Close the menu when clicking anywhere outside the navbar
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.navbar') && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '&#9776;';
    }
  });
}

/**
 * Automatically detects the current page from the URL and applies the 'active'
 * class to the corresponding navigation link.
 */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname;
  const pageFilename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageFilename || (pageFilename === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Updates the footer copyright year dynamically.
 */
function initDynamicYear() {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/* ==============================================================================
   2. ACADEMIC TASK PLANNER (LOCALSTORAGE CRUD)
   ============================================================================== */

const STORAGE_KEY = 'cos106_academic_tasks';

// Initial starter tasks for Isaac Adelagun (Miva Open University - 100 Level)
const defaultTasks = [
  {
    id: 1,
    title: 'Submit COS106 Web Technologies Portfolio & Planner',
    course: 'COS106',
    date: '2026-10-30',
    priority: 'High',
    category: 'Assignment',
    completed: true
  },
  {
    id: 2,
    title: 'Review CYB101 Fundamentals of Cyber Security Lecture Notes',
    course: 'CYB101',
    date: '2026-11-04',
    priority: 'High',
    category: 'Study',
    completed: false
  },
  {
    id: 3,
    title: 'Complete COS101 Computer Science Problem Set on Algorithms',
    course: 'COS101',
    date: '2026-11-08',
    priority: 'Medium',
    category: 'Lab Work',
    completed: false
  },
  {
    id: 4,
    title: 'Attend Miva Open University Virtual Discussion Session',
    course: 'COS106',
    date: '2026-11-12',
    priority: 'Low',
    category: 'Quiz',
    completed: false
  }
];

let tasks = [];
let currentFilter = 'all';

/**
 * Initializes the Academic Task Planner on planner.html
 */
function initAcademicPlanner() {
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const filterButtons = document.querySelectorAll('.task-filter-btn');
  const resetBtn = document.getElementById('reset-tasks-btn');

  // Load stored tasks or fallback to default tasks
  loadTasks();
  renderTasks();

  // Add Task Event Listener
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('task-title');
    const courseInput = document.getElementById('task-course');
    const dateInput = document.getElementById('task-date');
    const priorityInput = document.getElementById('task-priority');
    const categoryInput = document.getElementById('task-category');

    const title = titleInput.value.trim();
    const course = courseInput.value;
    const date = dateInput.value;
    const priority = priorityInput.value;
    const category = categoryInput.value;

    if (!title || !course || !date) {
      alert('Please fill in all required fields (Task Title, Course, and Due Date).');
      return;
    }

    const newTask = {
      id: Date.now(),
      title,
      course,
      date,
      priority,
      category,
      completed: false
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Reset Form
    taskForm.reset();
  });

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Reset to default sample tasks
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset planner to default sample academic tasks?')) {
        tasks = [...defaultTasks];
        saveTasks();
        renderTasks();
      }
    });
  }
}

/**
 * Loads tasks from the browser's localStorage.
 */
function loadTasks() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      tasks = JSON.parse(savedData);
    } catch (e) {
      console.error('Failed to parse saved tasks, resetting:', e);
      tasks = [...defaultTasks];
    }
  } else {
    tasks = [...defaultTasks];
    saveTasks();
  }
}

/**
 * Saves current tasks array into localStorage.
 */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Renders task cards and updates statistics summary counters.
 */
function renderTasks() {
  const taskList = document.getElementById('task-list');
  const totalCountEl = document.getElementById('total-tasks-count');
  const pendingCountEl = document.getElementById('pending-tasks-count');
  const completedCountEl = document.getElementById('completed-tasks-count');

  if (!taskList) return;

  // Calculate statistics
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  if (totalCountEl) totalCountEl.textContent = total;
  if (pendingCountEl) pendingCountEl.textContent = pending;
  if (completedCountEl) completedCountEl.textContent = completed;

  // Filter tasks based on selected tab
  let filtered = tasks;
  if (currentFilter === 'pending') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }

  // Clear current HTML list
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    taskList.innerHTML = `
      <li class="task-empty-state">
        <p><strong>No tasks found in this view.</strong></p>
        <p class="text-muted" style="font-size:0.85rem;">Add a new academic task using the form or change your filter.</p>
      </li>
    `;
    return;
  }

  // Render each task item
  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;

    // Priority badge class
    let priorityClass = 'priority-low';
    if (task.priority === 'High') priorityClass = 'priority-high';
    if (task.priority === 'Medium') priorityClass = 'priority-medium';

    li.innerHTML = `
      <div class="task-left">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          aria-label="Mark task complete" 
          ${task.completed ? 'checked' : ''}
          onchange="toggleTaskStatus(${task.id})"
        >
        <div class="task-details">
          <span class="task-title-text">${escapeHtml(task.title)}</span>
          <div class="task-sub-meta">
            <span><strong>Course:</strong> ${escapeHtml(task.course)}</span>
            <span><strong>Due:</strong> ${escapeHtml(task.date)}</span>
            <span><strong>Category:</strong> ${escapeHtml(task.category || 'General')}</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="priority-badge ${priorityClass}">${escapeHtml(task.priority)}</span>
        <button 
          class="btn btn-danger" 
          title="Delete task" 
          onclick="deleteTaskItem(${task.id})"
        >
          &times;
        </button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

/**
 * Toggles a task's completed state.
 */
window.toggleTaskStatus = function(taskId) {
  tasks = tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  renderTasks();
};

/**
 * Deletes a task by ID.
 */
window.deleteTaskItem = function(taskId) {
  if (confirm('Are you sure you want to delete this academic task?')) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
  }
};

/* ==============================================================================
   3. CONTACT FORM VALIDATION & INTERACTION
   ============================================================================== */

/**
 * Handles client-side validation and submission notification for contact.html
 */
function initContactFormValidation() {
  const form = document.getElementById('contact-form');
  const successAlert = document.getElementById('contact-success');
  const errorAlert = document.getElementById('contact-error');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Field references
    const nameField = document.getElementById('sender-name');
    const emailField = document.getElementById('sender-email');
    const subjectField = document.getElementById('sender-subject');
    const messageField = document.getElementById('sender-message');

    let isValid = true;

    // Reset previous error indicators
    clearErrors([nameField, emailField, subjectField, messageField]);
    if (successAlert) successAlert.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';

    // 1. Validate Name
    if (!nameField.value.trim() || nameField.value.trim().length < 3) {
      showError(nameField, 'Please enter your full name (at least 3 characters).');
      isValid = false;
    }

    // 2. Validate Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailField.value.trim() || !emailPattern.test(emailField.value.trim())) {
      showError(emailField, 'Please enter a valid email address.');
      isValid = false;
    }

    // 3. Validate Subject
    if (!subjectField.value) {
      showError(subjectField, 'Please select a subject category.');
      isValid = false;
    }

    // 4. Validate Message
    if (!messageField.value.trim() || messageField.value.trim().length < 10) {
      showError(messageField, 'Message must be at least 10 characters long.');
      isValid = false;
    }

    // If valid, simulate successful message submission
    if (isValid) {
      if (successAlert) {
        successAlert.style.display = 'block';
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      form.reset();

      // Automatically hide the success message after 8 seconds
      setTimeout(() => {
        if (successAlert) successAlert.style.display = 'none';
      }, 8000);
    } else {
      if (errorAlert) {
        errorAlert.style.display = 'block';
      }
    }
  });

  function showError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    const errorContainer = inputElement.parentElement.querySelector('.error-message');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
  }

  function clearErrors(inputElements) {
    inputElements.forEach(input => {
      input.classList.remove('is-invalid');
      const errorContainer = input.parentElement.querySelector('.error-message');
      if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
      }
    });
  }
}

/* ==============================================================================
   4. PROJECTS SHOWCASE FILTERING
   ============================================================================== */

/**
 * Handles category filtering on projects.html
 */
function initProjectFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterButtons.length || !projectCards.length) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Toggle active button state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const selectedCategory = button.getAttribute('data-filter');

      // Filter cards
      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (selectedCategory === 'all' || cardCategory === selectedCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/**
 * Basic HTML escaping helper to prevent XSS in dynamic rendering.
 */
function escapeHtml(string) {
  if (!string) return '';
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}
